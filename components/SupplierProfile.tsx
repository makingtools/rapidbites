import React, { useMemo, useState, useEffect } from 'react';
import { AppDataState, Supplier, StrategicInsight } from '../types';
import { BuildingStorefrontIcon } from './Icons';
import { getJohanSupplierAnalysis } from '../services/geminiService';
import ProactiveAssistant from './ProactiveAssistant';
import { Bar } from 'react-chartjs-2';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

const KPI_Card: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
);

const SupplierProfile: React.FC<{ supplierId: string; appState: AppDataState; }> = ({ supplierId, appState }) => {
    const { suppliers, purchaseOrders, products } = appState;
    const [insights, setInsights] = useState<StrategicInsight[]>([]);
    const [insightsLoading, setInsightsLoading] = useState(true);

    const supplier = useMemo(() => suppliers.find(s => s.id === supplierId), [supplierId, suppliers]);
    
    const supplierData = useMemo(() => {
        if (!supplier) return null;
        
        const supplierPOs = purchaseOrders.filter(po => po.supplierId === supplier.id && po.status !== 'borrador')
                                         .sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
                                         
        if (supplierPOs.length === 0) {
            return { supplier, totalValue: 0, orderCount: 0, avgOrderValue: 0, lastOrderDate: 'N/A', purchaseHistory: [], topProducts: [] };
        }
        
        const totalValue = supplierPOs.reduce((sum, po) => sum + po.total, 0);
        const orderCount = supplierPOs.length;
        const avgOrderValue = totalValue / orderCount;
        const lastOrderDate = new Date(supplierPOs[0].issueDate).toLocaleDateString('es-CO');
        
        const productSummary: {[key: string]: { name: string, quantity: number, value: number }} = {};
        supplierPOs.flatMap(po => po.items).forEach(item => {
            if(!productSummary[item.productId]) {
                productSummary[item.productId] = { name: item.productName, quantity: 0, value: 0 };
            }
            productSummary[item.productId].quantity += item.quantity;
            productSummary[item.productId].value += item.total;
        });
        
        const topProducts = Object.values(productSummary).sort((a,b) => b.value - a.value).slice(0, 5);
        
        return { supplier, totalValue, orderCount, avgOrderValue, lastOrderDate, purchaseHistory: supplierPOs.slice(0,10), topProducts };

    }, [supplier, purchaseOrders]);

    useEffect(() => {
        if (!supplier) return;
        setInsightsLoading(true);
        getJohanSupplierAnalysis(supplier, purchaseOrders, products)
            .then(setInsights)
            .finally(() => setInsightsLoading(false));
    }, [supplier, purchaseOrders, products]);

    if (!supplierData) return <div className="p-8 text-center">Proveedor no encontrado.</div>;
    const { supplier: currentSupplier, totalValue, orderCount, avgOrderValue, lastOrderDate, purchaseHistory, topProducts } = supplierData;
    
    const topProductsChartData = {
        labels: topProducts.map(p => p.name),
        datasets: [{
            label: 'Valor Comprado',
            data: topProducts.map(p => p.value),
            backgroundColor: '#0ea5e9',
            borderRadius: 4,
        }]
    };
    
    const topProductsChartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: {
            callbacks: { label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.raw)}` }
        }},
        scales: { 
            y: { ticks: { font: { size: 10 }, color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#4b5563' } },
            x: { display: false }
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in space-y-6">
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                       <BuildingStorefrontIcon className="h-8 w-8 mr-3 text-primary-500" /> Perfil de Proveedor 360°
                    </h1>
                    <p className="mt-1 text-2xl font-semibold text-gray-700 dark:text-gray-200">{currentSupplier.name}</p>
                    <p className="text-gray-500 dark:text-gray-400">{currentSupplier.email}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <KPI_Card title="Valor Total Comprado" value={formatCurrency(totalValue)} />
                 <KPI_Card title="Nº de Órdenes" value={orderCount.toString()} />
                 <KPI_Card title="Valor Promedio por Orden" value={formatCurrency(avgOrderValue)} />
                 <KPI_Card title="Última Orden" value={lastOrderDate} />
            </div>

            <main className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Análisis IA por Johan</h2>
                     <ProactiveAssistant insights={insights} isLoading={insightsLoading} onAction={()=>{}} />
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Top Productos Comprados</h2>
                    <div className="h-80">
                       <Bar data={topProductsChartData} options={topProductsChartOptions} />
                    </div>
                </div>
                <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                     <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Historial de Órdenes Recientes</h2>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                        <thead><tr className="border-b dark:border-gray-700"><th className="p-2 text-xs font-semibold text-gray-500">Orden #</th><th className="p-2 text-xs font-semibold text-gray-500">Fecha</th><th className="p-2 text-xs font-semibold text-gray-500">Estado</th><th className="p-2 text-xs font-semibold text-gray-500 text-right">Total</th></tr></thead>
                        <tbody>
                            {purchaseHistory.map(po => (
                                <tr key={po.id} className="border-b dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                    <td className="p-2 font-mono text-primary-600 text-sm">{po.id}</td>
                                    <td className="p-2 text-sm">{new Date(po.issueDate).toLocaleDateString('es-CO')}</td>
                                    <td className="p-2 text-sm capitalize">{po.status}</td>
                                    <td className="p-2 text-sm text-right font-semibold">{formatCurrency(po.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                     </div>
                </div>
            </main>
        </div>
    );
};

export default SupplierProfile;