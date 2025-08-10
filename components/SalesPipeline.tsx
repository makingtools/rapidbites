import React, { useMemo, useState, useCallback } from 'react';
import { AppDataState, User, Quote, OpportunityClosePrediction } from '../types';
import { ViewColumnsIcon, SparklesIcon, CalendarDaysIcon } from './Icons';
import { predictOpportunityCloseProbability } from '../services/geminiService';
import OpportunitiesCalendar from './OpportunitiesCalendar';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

type PipelineItem = { id: string, type: 'quote', data: Quote };
type PipelineStage = Quote['stage'];

interface OpportunitiesPipelineProps {
    appState: AppDataState;
    user: User;
    onUpdateStage: (quoteId: string, newStage: PipelineStage) => void;
    onUpdateProbability: (quoteId: string, newProbability: number) => void;
}

export const OpportunitiesPipeline: React.FC<OpportunitiesPipelineProps> = ({ appState, user, onUpdateStage, onUpdateProbability }) => {
    const { quotes, invoices, users } = appState;
    const [draggedItem, setDraggedItem] = useState<PipelineItem | null>(null);
    const [loadingProbabilities, setLoadingProbabilities] = useState<string[]>([]);
    const [view, setView] = useState<'kanban' | 'calendar'>('kanban');

    const userProfile = appState.config_user_profiles.find(p => p.id === user.profileId);
    const isSalesperson = userProfile?.name === 'Vendedor';

    const userQuotes = useMemo(() => {
        return isSalesperson ? quotes.filter(q => q.salespersonId === user.id) : quotes;
    }, [quotes, user, isSalesperson]);

    const pipelineData = useMemo(() => {
        const pipeline: Record<PipelineStage, PipelineItem[]> = {
            'Calificación': [],
            'Propuesta Enviada': [],
            'Negociación': [],
            'Ganada': [],
            'Perdida': []
        };

        userQuotes.forEach(q => {
            if (pipeline[q.stage]) {
                pipeline[q.stage].push({ id: q.id, type: 'quote', data: q });
            }
        });
        
        return pipeline;
    }, [userQuotes]);
    
    const handleRecalculateProbability = useCallback(async (quote: Quote) => {
        setLoadingProbabilities(prev => [...prev, quote.id]);
        const customerInvoices = invoices.filter(i => i.customerId === quote.customerId);
        try {
            const prediction: OpportunityClosePrediction = await predictOpportunityCloseProbability(quote, customerInvoices);
            onUpdateProbability(quote.id, prediction.probability);
        } catch (error) {
            console.error("Failed to update probability", error);
        } finally {
            setLoadingProbabilities(prev => prev.filter(id => id !== quote.id));
        }
    }, [invoices, onUpdateProbability]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: PipelineItem) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '1';
        setDraggedItem(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, stage: PipelineStage) => {
        e.preventDefault();
        if (draggedItem) {
            onUpdateStage(draggedItem.id, stage);
        }
    };

    const columns: { id: PipelineStage, title: string }[] = [
        { id: 'Calificación', title: 'Calificación' },
        { id: 'Propuesta Enviada', title: 'Propuesta Enviada' },
        { id: 'Negociación', title: 'Negociación' },
        { id: 'Ganada', title: 'Ganada' },
        { id: 'Perdida', title: 'Perdida' }
    ];

    const getSalespersonName = (id?: string) => users.find(u => u.id === id)?.name || 'N/A';
    
    const getProbabilityColor = (prob: number) => {
        if (prob > 75) return 'text-green-500';
        if (prob > 40) return 'text-yellow-500';
        return 'text-red-500';
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in h-full flex flex-col">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                        <ViewColumnsIcon className="h-8 w-8 mr-3 text-primary-500" />
                        Pipeline de Oportunidades
                    </h1>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Gestiona tus oportunidades desde la calificación hasta el cierre.</p>
                </div>
                 <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-lg">
                    <button onClick={() => setView('kanban')} className={`p-1.5 rounded-md ${view === 'kanban' ? 'bg-white dark:bg-neutral-900 shadow' : 'text-slate-500'}`} title="Vista Kanban"><ViewColumnsIcon className="h-5 w-5" /></button>
                    <button onClick={() => setView('calendar')} className={`p-1.5 rounded-md ${view === 'calendar' ? 'bg-white dark:bg-neutral-900 shadow' : 'text-slate-500'}`} title="Vista Calendario"><CalendarDaysIcon className="h-5 w-5" /></button>
                </div>
            </header>
            
            {view === 'kanban' ? (
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto">
                    {columns.map(col => (
                        <div 
                            key={col.id} 
                            className="bg-gray-100 dark:bg-neutral-900/50 rounded-lg p-3 flex flex-col min-w-[280px]"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            <div className="border-b-2 border-primary-500 pb-2 mb-3">
                                <h3 className="font-bold text-gray-800 dark:text-white">{col.title}</h3>
                                <p className="text-xs text-gray-500">
                                    {pipelineData[col.id].length} negocios | {formatCurrency(pipelineData[col.id].reduce((sum, item) => sum + item.data.total, 0))}
                                </p>
                            </div>
                            <div className="space-y-3 overflow-y-auto h-full pr-1">
                                {pipelineData[col.id].map(item => (
                                    <div 
                                        key={item.id} 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, item)}
                                        onDragEnd={handleDragEnd}
                                        className="bg-white dark:bg-neutral-800 rounded-md p-3 shadow-sm cursor-grab active:cursor-grabbing"
                                    >
                                        <p className="font-bold text-sm">{item.data.customerName}</p>
                                        <p className="text-xs text-gray-500">{getSalespersonName(item.data.salespersonId)}</p>
                                        <div className="flex justify-between items-end mt-2">
                                            <span className="text-sm font-semibold">{formatCurrency(item.data.total)}</span>
                                            {item.data.probability !== null && item.data.probability !== undefined &&
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold ${getProbabilityColor(item.data.probability)}`}>{item.data.probability}%</span>
                                                    <button 
                                                        onClick={() => handleRecalculateProbability(item.data)}
                                                        disabled={loadingProbabilities.includes(item.data.id)}
                                                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-50"
                                                        title="Recalcular probabilidad con IA"
                                                    >
                                                        <SparklesIcon className={`h-4 w-4 text-accent ${loadingProbabilities.includes(item.data.id) ? 'animate-spin' : ''}`} />
                                                    </button>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <OpportunitiesCalendar quotes={userQuotes} />
            )}
        </div>
    );
};
