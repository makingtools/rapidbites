import React, { useState, useMemo } from 'react';
import { AppDataState, AIFinancialForecast } from '../types';
import { BanknotesIcon, SparklesIcon } from './Icons';
import { getAIFinancialForecast } from '../services/geminiService';
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, BarElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, BarElement);

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

const KPI_Card: React.FC<{ title: string; value: string; className?: string }> = ({ title, value, className }) => (
    <div className={`bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg ${className}`}>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
);

const FinancialHealthDashboard: React.FC<{ appState: AppDataState }> = ({ appState }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [forecastData, setForecastData] = useState<AIFinancialForecast | null>(null);

    const financialData = useMemo(() => {
        const today = new Date();
        const last30Days = new Date();
        last30Days.setDate(today.getDate() - 30);

        const incomeLast30 = appState.invoices
            .filter(i => i.status === 'pagada' && new Date(i.issueDate) >= last30Days)
            .reduce((sum, i) => sum + i.total, 0);

        const expensesLast30 = appState.expenses
            .filter(e => new Date(e.date) >= last30Days)
            .reduce((sum, e) => sum + e.amount, 0);
            
        const cogsLast30 = appState.invoices
            .filter(i => i.status === 'pagada' && new Date(i.issueDate) >= last30Days)
            .flatMap(i => i.items)
            .reduce((sum, item) => {
                const product = appState.products.find(p => p.id === item.productId);
                return sum + (product ? product.cost * item.quantity : 0);
            }, 0);

        const totalIncome = appState.invoices.filter(i => i.status === 'pagada').reduce((sum, i) => sum + i.total, 0);
        const totalPastExpenses = appState.expenses.reduce((sum, e) => sum + e.amount, 0);
        const currentCash = totalIncome - totalPastExpenses;
        
        const monthlyExpenses = appState.expenses.length > 0 ? (totalPastExpenses / (new Date(appState.expenses[0].date).getMonth() - new Date(appState.expenses[appState.expenses.length -1].date).getMonth() + 1)) : 1;
        const financialAutonomyMonths = monthlyExpenses > 0 ? currentCash / monthlyExpenses : Infinity;

        return {
            grossProfit: incomeLast30 - cogsLast30,
            operatingExpenses: expensesLast30,
            netProfit: incomeLast30 - cogsLast30 - expensesLast30,
            currentCash,
            financialAutonomyMonths
        };
    }, [appState]);

    const handleGenerateForecast = async () => {
        setIsLoading(true);
        setError(null);
        setForecastData(null);
        try {
            const data = await getAIFinancialForecast(appState);
            setForecastData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setIsLoading(false);
        }
    };
    
     const chartData = {
        labels: forecastData?.forecast.map(f => f.month) || [],
        datasets: [
            {
                label: 'Flujo Neto',
                data: forecastData?.forecast.map(f => f.net_flow) || [],
                borderColor: '#0ea5e9',
                backgroundColor: '#0ea5e9',
                type: 'bar' as const,
                order: 2,
            },
            {
                label: 'Saldo Final',
                data: forecastData?.forecast.map(f => f.end_balance) || [],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.3,
                type: 'line' as const,
                order: 1,
            }
        ]
    };
    
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: true, text: `Proyección de Flujo de Caja a 90 Días` },
            tooltip: { callbacks: { label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.raw)}` } }
        },
        scales: {
             y: { ticks: { callback: (value: any) => formatCurrency(value/1000000) + 'M' } }
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
             <header className="mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                    <BanknotesIcon className="h-8 w-8 mr-3 text-primary-500" />
                    Análisis de Salud Financiera
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">El centro de control para la rentabilidad y el flujo de caja de tu negocio.</p>
            </header>

             <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <KPI_Card title="Ganancia Bruta (30d)" value={formatCurrency(financialData.grossProfit)} />
                <KPI_Card title="Gastos Operativos (30d)" value={formatCurrency(financialData.operatingExpenses)} />
                <KPI_Card title="Ganancia Neta (30d)" value={formatCurrency(financialData.netProfit)} className="bg-green-50 dark:bg-green-900/20" />
                <KPI_Card title="Autonomía Financiera" value={`${financialData.financialAutonomyMonths.toFixed(1)} meses`} className="bg-blue-50 dark:bg-blue-900/20" />
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Oráculo de Flujo de Caja</h2>
                {!forecastData && (
                    <div className="text-center py-12">
                        <button
                            onClick={handleGenerateForecast}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-3 mx-auto px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors duration-300 shadow-lg disabled:opacity-50 disabled:cursor-wait"
                        >
                            <SparklesIcon className="h-5 w-5" />
                            {isLoading ? 'Proyectando Futuro...' : 'Generar Proyección IA (90 días)'}
                        </button>
                        {error && <div className="mt-4 text-red-500">{error}</div>}
                    </div>
                )}

                {forecastData && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                        <div className="lg:col-span-2 h-96">
                             <Chart type='bar' options={chartOptions as any} data={chartData} />
                        </div>
                        <div className="space-y-4">
                            <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Análisis de IA</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{forecastData.analysis}</p>
                            </div>
                             {forecastData.recommendations.map((rec, i) => (
                                <div key={i} className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                                    <h4 className="font-bold text-blue-800 dark:text-blue-300">{rec.title}</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">{rec.detail}</p>
                                </div>
                             ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinancialHealthDashboard;