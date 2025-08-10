import React, { useMemo } from 'react';
import { AppDataState, View } from '../types';
import { DocumentChartBarIcon } from './Icons';
import PageHeader from './PageHeader';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { formatCurrency } from '../utils/formatters';
import KPI_Card from './shared/KPI_Card';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CollectionsDashboard: React.FC<{ appState: AppDataState, onNavigate: (view: View, payload?: any) => void }> = ({ appState, onNavigate }) => {
    const collectionsData = useMemo(() => {
        const today = new Date();
        const receivableInvoices = appState.invoices.filter(i => i.status === 'pendiente' || i.status === 'vencida');

        let totalReceivable = 0;
        let totalOverdue = 0;
        const aging = { '1-30': 0, '31-60': 0, '61-90': 0, '91+': 0 };
        const topDebtors: { [key: number]: { id: number, name: string, amount: number } } = {};

        receivableInvoices.forEach(invoice => {
            const dueDate = new Date(invoice.dueDate);
            const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

            totalReceivable += invoice.total;
            if (invoice.status === 'vencida' || daysOverdue > 0) {
                totalOverdue += invoice.total;

                if (daysOverdue <= 30) aging['1-30'] += invoice.total;
                else if (daysOverdue <= 60) aging['31-60'] += invoice.total;
                else if (daysOverdue <= 90) aging['61-90'] += invoice.total;
                else aging['91+'] += invoice.total;
                
                if (!topDebtors[invoice.customerId]) {
                    topDebtors[invoice.customerId] = { id: invoice.customerId, name: invoice.customerName || 'N/A', amount: 0 };
                }
                topDebtors[invoice.customerId].amount += invoice.total;
            }
        });

        const sortedTopDebtors = Object.values(topDebtors)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        return {
            totalReceivable,
            totalOverdue,
            aging,
            topDebtors: sortedTopDebtors
        };
    }, [appState.invoices]);

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#d1d5db' : '#4b5563';
    
    const agingChartData = {
        labels: ['1-30 días', '31-60 días', '61-90 días', '91+ días'],
        datasets: [{
            label: 'Cartera Vencida',
            data: [
                collectionsData.aging['1-30'],
                collectionsData.aging['31-60'],
                collectionsData.aging['61-90'],
                collectionsData.aging['91+'],
            ],
            backgroundColor: ['#f59e0b', '#ef4444', '#b91c1c', '#7f1d1d'],
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
            legend: { display: false }, 
            tooltip: { callbacks: { label: (c: any) => formatCurrency(c.raw) } } 
        },
        scales: { 
            x: { ticks: { color: textColor } }, 
            y: { ticks: { color: textColor, callback: (v:any) => formatCurrency(v / 1000) + 'K' } } 
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in space-y-6">
            <PageHeader
                icon={<DocumentChartBarIcon />}
                title="Dashboard de Cartera y Cobranzas"
                description="Visión estratégica de tus cuentas por cobrar."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPI_Card title="Total por Cobrar" value={formatCurrency(collectionsData.totalReceivable)} />
                <KPI_Card title="Total Vencido" value={formatCurrency(collectionsData.totalOverdue)} className="bg-yellow-50 dark:bg-yellow-900/20" />
                <KPI_Card title="Índice de Cartera Vencida" value={`${collectionsData.totalReceivable > 0 ? ((collectionsData.totalOverdue / collectionsData.totalReceivable) * 100).toFixed(1) : 0}%`} className="bg-red-50 dark:bg-red-900/20" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Antigüedad de la Cartera Vencida</h2>
                    <div className="h-80"><Bar data={agingChartData} options={chartOptions as any} /></div>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Top 5 Clientes en Mora</h2>
                    {collectionsData.topDebtors.length > 0 ? (
                        <ul className="space-y-3">
                            {collectionsData.topDebtors.map(debtor => (
                                <li key={debtor.id} className="flex justify-between items-center p-2 rounded hover:bg-slate-50 dark:hover:bg-neutral-800/50">
                                    <div>
                                        <button onClick={() => onNavigate('customer_profile', debtor.id)} className="font-semibold text-primary-600 hover:underline">{debtor.name}</button>
                                    </div>
                                    <span className="font-bold text-lg text-red-500">{formatCurrency(debtor.amount)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center text-slate-500 pt-10">
                            <p>¡Felicidades!</p>
                            <p>No hay clientes en mora.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CollectionsDashboard;