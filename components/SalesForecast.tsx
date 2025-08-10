
import React, { useState, useMemo } from 'react';
import { AppDataState, SalesForecastResponse } from '../types';
import { ChartBarIcon, SparklesIcon } from './Icons';
import { getSalesForecast } from '../services/geminiService';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SalesForecast: React.FC<{ appState: AppDataState }> = ({ appState }) => {
    const [selectedProductId, setSelectedProductId] = useState<string | null>(appState.products[0]?.id || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [forecastData, setForecastData] = useState<SalesForecastResponse | null>(null);

    const historicalSalesData = useMemo(() => {
        if (!selectedProductId) return { labels: [], data: [] };
        
        const salesByDay: Record<string, number> = {};
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            salesByDay[d.toISOString().split('T')[0]] = 0;
        }

        appState.invoices
            .filter(i => i.status === 'pagada')
            .flatMap(i => i.items)
            .filter(item => item.productId === selectedProductId)
            .forEach(item => {
                const dateKey = appState.invoices.find(i => i.items.includes(item))!.issueDate;
                if (salesByDay.hasOwnProperty(dateKey)) {
                    salesByDay[dateKey] += item.quantity;
                }
            });

        const sortedDates = Object.keys(salesByDay).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
        return {
            labels: sortedDates.map(d => new Date(d).toLocaleDateString('es-CO', {day: '2-digit', month: 'short'})),
            data: sortedDates.map(d => salesByDay[d]),
        };
    }, [selectedProductId, appState.invoices]);

    const handleGenerateForecast = async () => {
        if (!selectedProductId) return;
        setIsLoading(true);
        setError(null);
        setForecastData(null);
        try {
            const data = await getSalesForecast(selectedProductId, appState);
            setForecastData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setIsLoading(false);
        }
    };
    
    const chartData = {
        labels: [...historicalSalesData.labels, ...(forecastData?.forecast.map(f => `+${f.day}d`) || [])],
        datasets: [
            {
                label: 'Ventas Históricas',
                data: historicalSalesData.data,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.3,
            },
            {
                label: 'Ventas Proyectadas',
                data: [
                    ...Array(historicalSalesData.data.length -1).fill(null),
                    historicalSalesData.data[historicalSalesData.data.length -1],
                    ...(forecastData?.forecast.map(f => f.predicted_sales) || [])
                ],
                borderColor: 'rgb(236, 72, 153)',
                backgroundColor: 'rgba(236, 72, 153, 0.5)',
                borderDash: [5, 5],
                tension: 0.3,
            }
        ]
    };
    
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: true, text: `Proyección de Ventas para ${appState.products.find(p => p.id === selectedProductId)?.name}` },
        },
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <header className="mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                    <ChartBarIcon className="h-8 w-8 mr-3 text-primary-500" />
                    Proyecciones de Demanda con IA
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Anticípate al mercado y optimiza tu inventario.</p>
            </header>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-grow w-full">
                    <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecciona un Producto:</label>
                    <select
                        id="product-select"
                        value={selectedProductId || ''}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        {appState.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleGenerateForecast}
                    disabled={isLoading || !selectedProductId}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors duration-300 shadow-lg disabled:opacity-50 disabled:cursor-wait"
                >
                    <SparklesIcon className="h-5 w-5" />
                    {isLoading ? 'Analizando...' : 'Generar Proyección'}
                </button>
            </div>
            
            {error && <div className="mt-4 p-4 text-center bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">{error}</div>}

            {forecastData && (
                 <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                        <Line options={chartOptions} data={chartData} />
                    </div>
                     <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                             <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Análisis de IA</h3>
                             <p className="text-sm text-gray-600 dark:text-gray-300">{forecastData.analysis}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl shadow-lg border-l-4 border-green-500">
                             <h3 className="font-bold text-lg text-green-800 dark:text-green-300 mb-2">Recomendación de Stock</h3>
                             <p className="text-sm text-green-700 dark:text-green-200">{forecastData.recommendation}</p>
                        </div>
                    </div>
                 </div>
            )}

            {!forecastData && !isLoading && (
                 <div className="mt-6 text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Selecciona un producto y genera una proyección para empezar.</p>
                 </div>
            )}
        </div>
    );
};

export default SalesForecast;
