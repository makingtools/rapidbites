import React, { useMemo } from 'react';
import { AppDataState, View } from '../types';
import { CubeIcon, DocumentChartBarIcon } from './Icons';
import { Bar, Doughnut } from 'react-chartjs-2';
import { formatCurrency } from '../utils/formatters';
import KPI_Card from './shared/KPI_Card';
import PageHeader from './PageHeader';

const InventoryDashboard: React.FC<{ appState: AppDataState, onNavigate: (view: View, payload?: any) => void }> = ({ appState, onNavigate }) => {
    
    const inventoryData = useMemo(() => {
        const { products, warehouses } = appState;
        
        const totalSKUs = products.length;
        const totalValue = products.reduce((sum, p) => sum + p.cost * Object.values(p.stockByWarehouse).reduce((s, q) => s + q, 0), 0);
        const lowStockCount = products.filter(p => Object.values(p.stockByWarehouse).reduce((s, q) => s + q, 0) < 20).length;
        const outOfStockCount = products.filter(p => Object.values(p.stockByWarehouse).reduce((s, q) => s + q, 0) === 0).length;

        const valueByWarehouse = warehouses.map(w => ({
            name: w.name,
            value: products.reduce((sum, p) => sum + p.cost * (p.stockByWarehouse[w.id] || 0), 0)
        })).sort((a,b) => b.value - a.value);

        const productsByCategory = products.reduce((acc: Record<string, number>, p) => {
            acc[p.category] = (acc[p.category] || 0) + 1;
            return acc;
        }, {});
        
        const topValuableProducts = [...products].sort((a, b) => {
             const valueA = a.cost * Object.values(a.stockByWarehouse).reduce((s, q) => s + q, 0);
             const valueB = b.cost * Object.values(b.stockByWarehouse).reduce((s, q) => s + q, 0);
             return valueB - valueA;
        }).slice(0, 5);

        return { totalSKUs, totalValue, lowStockCount, outOfStockCount, valueByWarehouse, productsByCategory, topValuableProducts };
    }, [appState]);

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#d1d5db' : '#4b5563';

    const barChartData = {
        labels: inventoryData.valueByWarehouse.map(w => w.name),
        datasets: [{
            label: 'Valor de Inventario',
            data: inventoryData.valueByWarehouse.map(w => w.value),
            backgroundColor: '#6366f1',
            borderRadius: 4,
        }]
    };
    const doughnutChartData = {
        labels: Object.keys(inventoryData.productsByCategory),
        datasets: [{
            data: Object.values(inventoryData.productsByCategory),
            backgroundColor: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'],
        }]
    };
    const chartOptions = (onClickHandler?: (label: string) => void) => ({
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_: any, elements: any[]) => {
            if (elements.length > 0 && onClickHandler) {
                const clickedLabel = barChartData.labels[elements[0].index];
                onClickHandler(clickedLabel);
            }
        },
        plugins: { 
            legend: { labels: { color: textColor } }, 
            tooltip: { callbacks: { label: (c: any) => formatCurrency(c.raw) } } 
        },
        scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor } } }
    });
    
    const doughnutOptions = {
        ...chartOptions(),
        onClick: (_: any, elements: any[]) => {
            if (elements.length > 0) {
                const clickedLabel = doughnutChartData.labels[elements[0].index];
                onNavigate('inventory_items_services', { initialFilter: { key: 'category', value: clickedLabel } });
            }
        },
        plugins: { 
            ...chartOptions().plugins,
            legend: { ...chartOptions().plugins.legend, position: 'right' } 
        } 
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in space-y-6">
            <PageHeader
                icon={<CubeIcon />}
                title="Dashboard de Inventario"
                description="Visión estratégica de tus existencias y capital."
                 actions={(
                    <button
                        onClick={() => onNavigate('inventory_stock_report')}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg font-semibold text-primary-600 dark:text-primary-400 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                        <DocumentChartBarIcon className="h-5 w-5" />
                        Ver Informe de Stock
                    </button>
                )}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <KPI_Card title="Valor Total del Inventario" value={formatCurrency(inventoryData.totalValue)} />
                <KPI_Card title="Total de SKUs" value={inventoryData.totalSKUs.toString()} />
                <KPI_Card title="Productos con Bajo Stock" value={inventoryData.lowStockCount.toString()} className="bg-yellow-50 dark:bg-yellow-900/20" onClick={() => onNavigate('inventory_items_services', { initialFilter: { key: 'stockByWarehouse', value: '<20' }})} />
                <KPI_Card title="Productos Agotados" value={inventoryData.outOfStockCount.toString()} className="bg-red-50 dark:bg-red-900/20" onClick={() => onNavigate('inventory_items_services', { initialFilter: { key: 'stockByWarehouse', value: '0' }})} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Valor de Inventario por Bodega</h2>
                    <div className="h-80"><Bar data={barChartData} options={chartOptions() as any} /></div>
                </div>
                 <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Distribución por Categoría</h2>
                    <div className="h-80"><Doughnut data={doughnutChartData} options={doughnutOptions as any} /></div>
                </div>
            </div>
            
             <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Top 5 Productos más Valiosos en Stock</h2>
                <ul className="space-y-3">
                    {inventoryData.topValuableProducts.map(p => {
                        const value = p.cost * Object.values(p.stockByWarehouse).reduce((s, q) => s + q, 0);
                        return (
                            <li key={p.id} className="flex justify-between items-center p-2 rounded hover:bg-slate-50 dark:hover:bg-neutral-800/50">
                                <div>
                                    <p className="font-semibold">{p.name}</p>
                                    <p className="text-xs text-slate-500">{p.id}</p>
                                </div>
                                <span className="font-bold text-lg text-primary-600 dark:text-primary-400">{formatCurrency(value)}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default InventoryDashboard;