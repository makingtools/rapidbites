import React, { useState, useEffect } from 'react';
import { Customer, Invoice, RetentionRisk, LoyaltyOffer } from '../types';
import { analyzeCustomerLoyalty } from '../services/geminiService';
import { ShieldCheckIcon, SparklesIcon, TagIcon } from './Icons';

interface CustomerLoyaltyAIProps {
    customer: Customer;
    invoices: Invoice[];
}

const CustomerLoyaltyAI: React.FC<CustomerLoyaltyAIProps> = ({ customer, invoices }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<{ risk: RetentionRisk; offer?: LoyaltyOffer } | null>(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await analyzeCustomerLoyalty(customer, invoices);
                setAnalysis(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalysis();
    }, [customer, invoices]);

    const getRiskStyles = (level: RetentionRisk['level']) => {
        switch (level) {
            case 'Alto': return { badge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', icon: <ShieldCheckIcon className="h-6 w-6 text-red-500" />, border: 'border-red-500' };
            case 'Medio': return { badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300', icon: <ShieldCheckIcon className="h-6 w-6 text-yellow-500" />, border: 'border-yellow-500' };
            case 'Bajo': return { badge: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', icon: <ShieldCheckIcon className="h-6 w-6 text-green-500" />, border: 'border-green-500' };
            default: return { badge: 'bg-gray-100 text-gray-800', icon: <ShieldCheckIcon className="h-6 w-6 text-gray-500" />, border: 'border-gray-500' };
        }
    };
    
    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg animate-pulse">
                 <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
                 <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                 <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><SparklesIcon className="h-6 w-6 text-accent" /> Análisis de Lealtad y Retención</h2>
                <p className="text-red-500 text-sm">Error: {error}</p>
            </div>
        )
    }

    if (!analysis) return null;

    const riskStyles = getRiskStyles(analysis.risk.level);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><SparklesIcon className="h-6 w-6 text-accent" /> Análisis de Lealtad y Retención</h2>
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Nivel de Riesgo de Fuga</h3>
                    <div className="flex items-center gap-2 mt-1">
                        {riskStyles.icon}
                        <span className={`px-3 py-1 text-sm font-bold rounded-full ${riskStyles.badge}`}>
                            {analysis.risk.level}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">"{analysis.risk.reason}"</p>
                </div>
                {analysis.offer && (
                    <div className={`p-4 rounded-lg border-l-4 ${riskStyles.border} bg-gray-50 dark:bg-gray-700/50`}>
                        <h3 className="font-bold flex items-center gap-2 text-primary-700 dark:text-primary-300"><TagIcon className="h-5 w-5" /> Oferta de Lealtad Sugerida</h3>
                        <p className="font-semibold text-gray-800 dark:text-gray-100 mt-2">{analysis.offer.offerTitle}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{analysis.offer.offerDetails}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerLoyaltyAI;