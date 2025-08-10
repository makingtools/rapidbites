import React, { useMemo, useState } from 'react';
import { AppDataState, View, Promotion, MarketingCopySuggestion } from '../types';
import { MegaphoneIcon, SparklesIcon } from './Icons';
import { Bar } from 'react-chartjs-2';
import { generatePromotionCopy } from '../services/geminiService';
import Modal from './Modal';
import { formatCurrency } from '../utils/formatters';
import KPI_Card from './shared/KPI_Card';
import PageHeader from './PageHeader';

const MarketingCopyModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    suggestions: MarketingCopySuggestion[];
    isLoading: boolean;
    promotionName: string;
}> = ({ isOpen, onClose, suggestions, isLoading, promotionName }) => {
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Maybe add a toast notification here in a future version
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Textos de Marketing para: ${promotionName}`}>
            {isLoading ? (
                <div className="text-center p-8">
                    <SparklesIcon className="h-10 w-10 text-primary-500 mx-auto animate-pulse" />
                    <p className="mt-4 font-semibold">Johan está redactando...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {suggestions.map((suggestion, index) => (
                        <div key={index} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                            <h4 className="font-bold text-primary-600 dark:text-primary-400 text-sm mb-2">{suggestion.channel}</h4>
                            <p className="text-gray-800 dark:text-gray-200 text-sm italic">"{suggestion.copy}"</p>
                            <button onClick={() => copyToClipboard(suggestion.copy)} className="text-xs font-semibold mt-2 hover:underline text-gray-500">Copiar</button>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
};


const MarketingDashboard: React.FC<{ appState: AppDataState, onNavigate: (view: View, payload?: any) => void }> = ({ appState, onNavigate }) => {
    
    const [modalState, setModalState] = useState<{ isOpen: boolean; isLoading: boolean; suggestions: MarketingCopySuggestion[]; promotion: Promotion | null }>({
        isOpen: false, isLoading: false, suggestions: [], promotion: null
    });
    
    const marketingData = useMemo(() => {
        const { promotions, invoices } = appState;
        const today = new Date().toISOString().split('T')[0];
        
        const activePromotions = promotions.filter(p => p.startDate <= today && p.endDate >= today);
        const activePromotionsCount = activePromotions.length;

        const discountedInvoices = invoices.filter(i => i.totalDiscount && i.totalDiscount > 0);
        
        const totalDiscountsGiven = discountedInvoices.reduce((sum, i) => sum + (i.totalDiscount || 0), 0);
        const salesWithPromotions = discountedInvoices.reduce((sum, i) => sum + i.total, 0);

        const performanceByPromotion = promotions.map(promo => {
            const totalDiscount = invoices.flatMap(i => i.items)
                .filter(item => item.promotionName === promo.name && item.discount)
                .reduce((sum, item) => sum + item.discount!, 0);
            return { id: promo.id, name: promo.name, totalDiscount };
        }).filter(p => p.totalDiscount > 0).sort((a,b) => b.totalDiscount - a.totalDiscount);

        return { activePromotions, activePromotionsCount, totalDiscountsGiven, salesWithPromotions, performanceByPromotion };
    }, [appState]);

    const handleGenerateCopy = async (promotion: Promotion) => {
        setModalState({ isOpen: true, isLoading: true, suggestions: [], promotion });
        try {
            const suggestions = await generatePromotionCopy(promotion, appState.products);
            setModalState(prev => ({ ...prev, isLoading: false, suggestions }));
        } catch (error) {
            console.error(error);
            // In a real app, show a toast notification
            setModalState({ isOpen: false, isLoading: false, suggestions: [], promotion: null });
        }
    };

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#d1d5db' : '#4b5563';

    const barChartData = {
        labels: marketingData.performanceByPromotion.map(p => p.name),
        datasets: [{
            label: 'Total Descuentos Otorgados',
            data: marketingData.performanceByPromotion.map(p => p.totalDiscount),
            backgroundColor: '#ec4899',
        }]
    };
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_: any, elements: any[]) => {
            if (elements.length > 0) {
                const clickedPromoId = marketingData.performanceByPromotion[elements[0].index].id;
                onNavigate('marketing_promotions', { initialFilter: { key: 'id', value: clickedPromoId }});
            }
        },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: any) => formatCurrency(c.raw) } } },
        scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor } } }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in space-y-6">
            <PageHeader
                icon={<MegaphoneIcon />}
                title="Dashboard de Marketing"
                description="Mide el impacto de tus campañas y promociones."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPI_Card title="Promociones Activas" value={marketingData.activePromotionsCount.toString()} onClick={() => onNavigate('marketing_promotions')} />
                <KPI_Card title="Total Descuentos Otorgados" value={formatCurrency(marketingData.totalDiscountsGiven)} className="bg-pink-50 dark:bg-pink-900/20" />
                <KPI_Card title="Ventas con Promoción" value={formatCurrency(marketingData.salesWithPromotions)} className="bg-green-50 dark:bg-green-900/20" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Rendimiento por Promoción</h2>
                    <div className="h-80"><Bar data={barChartData} options={chartOptions as any} /></div>
                </div>
                 <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Asistente de Marketing IA</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Selecciona una promoción activa para generar textos de marketing al instante.</p>
                    <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {marketingData.activePromotions.map(promo => (
                            <li key={promo.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-neutral-800/50">
                                <div>
                                    <p className="font-semibold">{promo.name}</p>
                                    <p className="text-xs text-slate-500">{promo.description}</p>
                                </div>
                                <button onClick={() => handleGenerateCopy(promo)} className="flex-shrink-0 flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline">
                                    <SparklesIcon className="h-4 w-4" />
                                    Generar Copy
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            
            <MarketingCopyModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState(prev => ({...prev, isOpen: false}))}
                isLoading={modalState.isLoading}
                suggestions={modalState.suggestions}
                promotionName={modalState.promotion?.name || ''}
            />
        </div>
    );
};

export default MarketingDashboard;