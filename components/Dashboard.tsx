import React, { useState, useMemo } from 'react';
import { AppDataState, StrategicInsight, JohanCommand, DashboardFilter, DashboardFilterItem, DateRange } from '../types';
import ProactiveAssistant from './ProactiveAssistant';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Chart, Doughnut, Bar } from 'react-chartjs-2';
import { BanknotesIcon, ChartBarIcon, ChartPieIcon, CubeIcon, DocumentChartBarIcon, PresentationChartLineIcon } from './Icons';
import PageHeader from './PageHeader';
import FilterBar from './FilterBar';
import { formatCurrency } from '../utils/formatters';
import KPI_Card from './shared/KPI_Card';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

interface DashboardProps {
  insights: StrategicInsight[];
  insightsLoading: boolean;
  onAction: (action: StrategicInsight['action']) => void;
  dataState: AppDataState;
  command: JohanCommand | null;
  dashboardFilter: DashboardFilter;
  setDashboardFilter: React.Dispatch<React.SetStateAction<DashboardFilter>>;
  dateRange: DateRange;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange>>;
}

const LeaderboardPanel: React.FC<{ 
    data: { id: string | number; name: string; value: number }[];
    onItemClick: (item: { id: string | number; name: string }) => void;
}> = React.memo(({ data, onItemClick }) => {
    const maxValue = data.length > 0 ? data[0].value : 0;
    return (
        <div className="space-y-3">
            {data.map((item) => (
                <button key={item.id} onClick={() => onItemClick(item)} className="w-full text-left group">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-neutral-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">{item.name}</span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-white">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-neutral-800 rounded-full h-2.5">
                        <div 
                            className="bg-primary-500 h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
                        ></div>
                    </div>
                </button>
            ))}
        </div>
    );
});


const Dashboard: React.FC<DashboardProps> = ({ insights, insightsLoading, onAction, dataState, command, dashboardFilter, setDashboardFilter, dateRange, setDateRange }) => {
    const [rankingTab, setRankingTab] = useState<'products' | 'customers' | 'cashiers'>('products');
    const [categoryChartType, setCategoryChartType] = useState<'doughnut' | 'bar'>('doughnut');
    const [salesChartType, setSalesChartType] = useState<'bar' | 'line'>('bar');
    const [profitChartType, setProfitChartType] = useState<'bar' | 'line'>('line');
    const { products, customers, users } = dataState;
    const isDark = document.documentElement.classList.contains('dark');
    
    const filteredInvoices = useMemo(() => {
        if (dashboardFilter.length === 0) return dataState.invoices;
        
        return dataState.invoices.filter(invoice => {
            return dashboardFilter.every(filter => {
                switch (filter.type) {
                    case 'category':
                        return invoice.items.some(item => {
                            const product = products.find(p => p.id === item.productId);
                            return product?.category === filter.value;
                        });
                    case 'product':
                        return invoice.items.some(item => item.productId === filter.value);
                    case 'customer':
                        return invoice.customerId === filter.value;
                    case 'cashier':
                        return invoice.salespersonId === filter.value;
                    default: return true;
                }
            });
        });

    }, [dataState.invoices, dashboardFilter, products]);

    const paidInvoicesInDateRange = useMemo(() => {
        const startRange = dateRange.start;
        const endRange = dateRange.end;
        
        return filteredInvoices.filter(i => {
             const issueDate = new Date(`${i.issueDate}T00:00:00`); 
             const startMatch = !startRange || issueDate >= startRange;
             const endMatch = !endRange || issueDate <= endRange;
             return i.status === 'pagada' && startMatch && endMatch;
        })
    }, [filteredInvoices, dateRange]);

    const mainChartProcessedData = useMemo(() => {
        if (paidInvoicesInDateRange.length === 0) {
            return { labels: [], salesData: [], profitData: [] };
        }

        const sortedInvoices = [...paidInvoicesInDateRange].sort((a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime());
        const firstDate = dateRange.start || new Date(sortedInvoices[0].issueDate);
        const lastDate = dateRange.end || new Date(sortedInvoices[sortedInvoices.length - 1].issueDate);

        const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const aggregation: 'daily' | 'monthly' = diffDays > 35 ? 'monthly' : 'daily';
        
        const salesByPeriod: { [key: string]: { sales: number; profit: number } } = {};

        sortedInvoices.forEach(i => {
            const date = new Date(`${i.issueDate}T00:00:00`); // Ensure local timezone
            let key = '';
            
            if (aggregation === 'daily') {
                key = date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
            } else {
                key = date.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
            }

            if (!salesByPeriod[key]) {
                salesByPeriod[key] = { sales: 0, profit: 0 };
            }

            const invoiceCost = i.items.reduce((sum, item) => (products.find(p => p.id === item.productId)?.cost ?? 0) * item.quantity + sum, 0);
            salesByPeriod[key].sales += i.subtotal;
            salesByPeriod[key].profit += (i.subtotal - invoiceCost);
        });

        const monthMap: { [key: string]: number } = { Ene: 0, Feb: 1, Mar: 2, Abr: 3, May: 4, Jun: 5, Jul: 6, Ago: 7, Sep: 8, Oct: 9, Nov: 10, Dic: 11 };
        
        const labels = Object.keys(salesByPeriod);
        
        if (aggregation === 'monthly') {
            labels.sort((a, b) => {
                const [monthA, yearA] = a.split(' ');
                const [monthB, yearB] = b.split(' ');
                const dateA = new Date(parseInt(`20${yearA.replace("'", "")}`), monthMap[monthA.replace('.','')] || 0);
                const dateB = new Date(parseInt(`20${yearB.replace("'", "")}`), monthMap[monthB.replace('.','')] || 0);
                return dateA.getTime() - dateB.getTime();
            });
        }
        
        return {
            labels: labels,
            salesData: labels.map(label => salesByPeriod[label].sales),
            profitData: labels.map(label => salesByPeriod[label].profit)
        };
    }, [paidInvoicesInDateRange, dateRange, products]);

    const dashboardData = useMemo(() => {
        const totalSales = paidInvoicesInDateRange.reduce((sum, i) => sum + i.total, 0);
        const totalCost = paidInvoicesInDateRange.flatMap(inv => inv.items).reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            return sum + (product ? product.cost * item.quantity : 0);
        }, 0);
        const grossProfit = totalSales - totalCost;
        const accountsReceivable = filteredInvoices.filter(i => i.status === 'pendiente' || i.status === 'vencida').reduce((sum, i) => sum + i.total, 0);
        const lowStockProductsCount = products.filter(p => Object.values(p.stockByWarehouse || {}).reduce((s, v) => s + Number(v), 0) < 50).length;
        
        const salesByCategory = paidInvoicesInDateRange.flatMap(i => i.items).reduce((acc: Record<string, number>, item) => {
            const category = products.find(p => p.id === item.productId)?.category || 'Desconocido';
            acc[category] = (acc[category] || 0) + item.total;
            return acc;
        }, {});
        
        const topProducts = Object.values(paidInvoicesInDateRange.flatMap(i => i.items).reduce((acc: Record<string, { id: string, name: string, value: number }>, item) => {
            acc[item.productId] = { id: item.productId, name: item.productName, value: (acc[item.productId]?.value || 0) + item.total };
            return acc;
        }, {})).sort((a,b) => b.value - a.value).slice(0, 5);

        const topCustomers = Object.values(paidInvoicesInDateRange.reduce((acc: Record<string, { id: number, name: string, value: number }>, inv) => {
            if (inv.customerName && inv.customerName !== 'Consumidor Final') {
                acc[inv.customerName] = { id: inv.customerId, name: inv.customerName, value: (acc[inv.customerName]?.value || 0) + inv.total };
            }
            return acc;
        }, {})).sort((a,b) => b.value - a.value).slice(0, 5);

        const topCashiers = Object.values(paidInvoicesInDateRange.reduce((acc: Record<string, { id: string, name: string, value: number }>, inv) => {
            if (!inv.salespersonId) return acc;
            const sp = users.find(s => s.id === inv.salespersonId);
            if(sp) acc[sp.name] = { id: sp.id, name: sp.name, value: (acc[sp.name]?.value || 0) + inv.total };
            return acc;
        }, {})).sort((a,b) => b.value - a.value).slice(0, 5);

        return { totalSales, grossProfit, accountsReceivable, lowStockProductsCount, salesByCategory, topProducts, topCustomers, topCashiers };
    }, [paidInvoicesInDateRange, filteredInvoices, products, users]);
    
    const handleFilterSelect = (type: DashboardFilterItem['type'], value: string | number, label: string) => {
        const newFilter: DashboardFilterItem = { type, value, label };
        if (!dashboardFilter.some(f => f.type === type && f.value === value)) {
            setDashboardFilter(prev => [...prev, newFilter]);
        }
    };

    const removeFilter = (filterToRemove: DashboardFilterItem) => {
        setDashboardFilter(prev => prev.filter(f => f.type !== filterToRemove.type || f.value !== filterToRemove.value));
    };
    
    const textColor = isDark ? '#d4d4d4' : '#4b5563';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';

    const mainChartOptions: any = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'top', align: 'end', labels: { color: textColor, boxWidth: 12, padding: 20, font: { weight: '600' } } },
            tooltip: {
                enabled: true, backgroundColor: isDark ? '#262626' : '#ffffff', titleColor: isDark ? '#f5f5f5' : '#1e293b', bodyColor: textColor,
                borderColor: gridColor, borderWidth: 1, padding: 10, boxPadding: 4,
                callbacks: { 
                    label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.raw)}`,
                    afterLabel: (context: any) => {
                        if (context.dataset.label === 'Ganancia') {
                            const sales = context.chart.data.datasets.find((ds: any) => ds.label === 'Ventas').data[context.dataIndex];
                            const profit = context.raw;
                            const margin = sales > 0 ? ((profit / sales) * 100).toFixed(1) : 0;
                            return `Margen: ${margin}%`;
                        }
                        return '';
                    }
                }
            }
        },
        scales: { x: { ticks: { color: textColor }, grid: { color: 'transparent' } }, y: { ticks: { color: textColor, callback: (v:any) => formatCurrency(v).slice(0,-4) + 'K' }, grid: { color: gridColor, borderDash: [4, 4] } } },
        interaction: { intersect: false, mode: 'index' },
    };
    
    const mainChartData = {
        labels: mainChartProcessedData.labels,
        datasets: [{
            type: salesChartType as 'bar' | 'line',
            label: 'Ventas',
            data: mainChartProcessedData.salesData,
            backgroundColor: salesChartType === 'bar' ? 'rgba(79, 70, 229, 0.6)' : 'rgba(79, 70, 229, 0.2)',
            borderColor: 'rgba(79, 70, 229, 1)',
            borderWidth: salesChartType === 'line' ? 2 : 1,
            fill: salesChartType === 'line',
            tension: 0.4,
        }, {
            type: profitChartType as 'bar' | 'line',
            label: 'Ganancia',
            data: mainChartProcessedData.profitData,
            backgroundColor: profitChartType === 'bar' ? 'rgba(20, 184, 166, 0.6)' : 'rgba(20, 184, 166, 0.2)',
            borderColor: '#14b8a6',
            borderWidth: profitChartType === 'line' ? 2 : 1,
            fill: profitChartType === 'line',
            tension: 0.4,
            pointRadius: profitChartType === 'line' ? 2 : 0,
            pointHoverRadius: profitChartType === 'line' ? 6 : 0,
        }]
    };

    const categoryChartRawData = useMemo(() => {
        const labels = Object.keys(dashboardData.salesByCategory);
        const data = Object.values(dashboardData.salesByCategory);
        return { labels, data };
    }, [dashboardData.salesByCategory]);


    const categoryChartOptions: any = { 
        responsive: true, maintainAspectRatio: false,
        onClick: (_: any, elements: any[]) => {
            if (elements.length > 0 && categoryChartRawData.labels.length > 0) {
                const clickedLabel = categoryChartRawData.labels[elements[0].index];
                handleFilterSelect('category', clickedLabel, clickedLabel);
            }
        },
        plugins: { 
            legend: { display: true, position: 'right', labels: { color: textColor, boxWidth: 12, padding: 15 } }, 
            tooltip: { 
                 ...mainChartOptions.plugins.tooltip,
                 callbacks: {
                     label: function(context: any) {
                        const label = context.label || '';
                        const value = context.raw;
                        const total = context.chart.getDatasetMeta(0).total || categoryChartRawData.data.reduce((sum, v) => sum + v, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                    }
                 }
            }
        }
    };
    
    const doughnutOptions = { ...categoryChartOptions, cutout: '70%' };
    const barOptions = { ...categoryChartOptions, indexAxis: 'y' as const, plugins: { ...categoryChartOptions.plugins, legend: { display: false } } };

    const categoryChartData = {
        labels: categoryChartRawData.labels,
        datasets: [{
            data: categoryChartRawData.data,
            backgroundColor: ['#4f46e5', '#14b8a6', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'],
            borderColor: isDark ? '#171717' : '#ffffff', borderWidth: 4, hoverOffset: 12,
        }]
    };

    const centerTextPlugin = {
        id: 'centerText',
        afterDraw: (chart: any) => {
            if (chart.config.type !== 'doughnut' || Object.keys(dashboardData.salesByCategory).length === 0) return;
            const { ctx, chartArea: { width, height } } = chart;
            ctx.save();
            ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = isDark ? '#f5f5f5' : '#111827';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const textX = width / 2;
            const textY = height / 2;
            ctx.fillText(formatCurrency(dashboardData.totalSales), textX, textY);
            ctx.font = '14px sans-serif'; ctx.fillStyle = isDark ? '#a3a3a3' : '#6b7280';
            ctx.fillText('Total Ventas', textX, textY + 25);
            ctx.restore();
        }
    };
    
    const rankingTabs = [{ id: 'products', label: 'Mejores Productos' }, { id: 'customers', label: 'Mejores Clientes' }, { id: 'cashiers', label: 'Mejores Cajeros' }];

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
            <PageHeader
                icon={<PresentationChartLineIcon />}
                title="Centro de Mando"
                description="Resumen financiero y operativo de tu negocio."
            />

            <FilterBar 
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                activeFilters={dashboardFilter}
                onRemoveFilter={removeFilter}
                onClearFilters={() => setDashboardFilter([])}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPI_Card title="Ventas Totales" value={formatCurrency(dashboardData.totalSales)} icon={<ChartBarIcon className="h-6 w-6 text-primary-500" />} />
                <KPI_Card title="Ganancia Bruta" value={formatCurrency(dashboardData.grossProfit)} icon={<BanknotesIcon className="h-6 w-6 text-accent-500" />} />
                <KPI_Card 
                    title="Cuentas por Cobrar" 
                    value={formatCurrency(dashboardData.accountsReceivable)} 
                    icon={<DocumentChartBarIcon className="h-6 w-6 text-amber-500" />} 
                    onClick={() => onAction({ type: 'navigate', payload: 'sales_accounts_receivable', label: '' })}
                />
                <KPI_Card 
                    title="Productos Bajo Stock" 
                    value={dashboardData.lowStockProductsCount.toString()} 
                    icon={<CubeIcon className="h-6 w-6 text-red-500" />}
                    onClick={() => onAction({ type: 'navigate', payload: 'inventory_stock_report', label: '' })}
                />
            </div>

            <main className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                <div className="lg:col-span-3 bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Rendimiento de Ventas</h2>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-600 dark:text-neutral-300">Ventas:</span>
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-lg">
                                    <button onClick={() => setSalesChartType('bar')} className={`p-1.5 rounded-md ${salesChartType === 'bar' ? 'bg-white dark:bg-neutral-900 shadow' : 'text-slate-500'}`} title="Gráfico de Barras"><ChartBarIcon className="h-5 w-5" /></button>
                                    <button onClick={() => setSalesChartType('line')} className={`p-1.5 rounded-md ${salesChartType === 'line' ? 'bg-white dark:bg-neutral-900 shadow' : 'text-slate-500'}`} title="Gráfico de Líneas"><PresentationChartLineIcon className="h-5 w-5" /></button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-600 dark:text-neutral-300">Ganancia:</span>
                                 <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-lg">
                                    <button onClick={() => setProfitChartType('bar')} className={`p-1.5 rounded-md ${profitChartType === 'bar' ? 'bg-white dark:bg-neutral-900 shadow' : 'text-slate-500'}`} title="Gráfico de Barras"><ChartBarIcon className="h-5 w-5" /></button>
                                    <button onClick={() => setProfitChartType('line')} className={`p-1.5 rounded-md ${profitChartType === 'line' ? 'bg-white dark:bg-neutral-900 shadow' : 'text-slate-500'}`} title="Gráfico de Líneas"><PresentationChartLineIcon className="h-5 w-5" /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="h-80 overflow-x-auto lg:overflow-visible">
                        <div className="w-[600px] sm:w-full h-full">
                            <Chart type='bar' data={mainChartData} options={mainChartOptions} />
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2"><ProactiveAssistant insights={insights} isLoading={insightsLoading} onAction={onAction} /></div>
                <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Ventas por Categoría</h2>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-lg">
                            <button onClick={() => setCategoryChartType('doughnut')} className={`p-1.5 rounded-md ${categoryChartType === 'doughnut' ? 'bg-white dark:bg-neutral-900 shadow' : 'text-slate-500'}`}><ChartPieIcon className="h-5 w-5" /></button>
                            <button onClick={() => setCategoryChartType('bar')} className={`p-1.5 rounded-md ${categoryChartType === 'bar' ? 'bg-white dark:bg-neutral-900 shadow' : 'text-slate-500'}`}><ChartBarIcon className="h-5 w-5" /></button>
                        </div>
                    </div>
                    <div className="h-64 flex items-center justify-center">
                        {categoryChartRawData.labels.length > 0 ? (
                            categoryChartType === 'doughnut' ? (
                                <Doughnut data={categoryChartData} options={doughnutOptions} plugins={[centerTextPlugin]}/>
                            ) : (
                                <Bar data={categoryChartData} options={barOptions} />
                            )
                        ) : (
                            <p className="text-slate-500">No hay datos de ventas por categoría para el período seleccionado.</p>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-3 bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-neutral-800">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Clasificaciones Principales</h2>
                    <div className="border-b border-slate-200 dark:border-neutral-800 mb-4">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto">
                            {rankingTabs.map(tab => (
                                <button key={tab.id} onClick={() => setRankingTab(tab.id as any)} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-semibold text-sm transition-colors ${rankingTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:border-slate-300 dark:hover:border-neutral-600'}`}>{tab.label}</button>
                            ))}
                        </nav>
                    </div>
                     {rankingTab === 'products' && <LeaderboardPanel data={dashboardData.topProducts} onItemClick={(item) => handleFilterSelect('product', item.id, item.name)} />}
                     {rankingTab === 'customers' && <LeaderboardPanel data={dashboardData.topCustomers} onItemClick={(item) => handleFilterSelect('customer', item.id, item.name)} />}
                     {rankingTab === 'cashiers' && <LeaderboardPanel data={dashboardData.topCashiers} onItemClick={(item) => handleFilterSelect('cashier', item.id, item.name)} />}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;