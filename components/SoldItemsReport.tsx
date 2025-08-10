

import React, { useMemo } from 'react';
import { Invoice, Product } from '../types';
import { DocumentChartBarIcon, DocumentDownloadIcon } from './Icons';
import { exportToPdf, exportToXlsx } from '../services/downloadService';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);

interface SoldItemsReportProps {
    invoices: Invoice[];
    products: Product[];
}

const SoldItemsReport: React.FC<SoldItemsReportProps> = ({ invoices, products }) => {
    const reportData = useMemo(() => {
        const productSales: { [productId: string]: { name: string; quantity: number; revenue: number; margin: number } } = {};

        invoices
            .filter(inv => inv.status === 'pagada')
            .forEach(inv => {
                inv.items.forEach(item => {
                    if (!productSales[item.productId]) {
                        productSales[item.productId] = { name: item.productName, quantity: 0, revenue: 0, margin: 0 };
                    }
                    const product = products.find(p => p.id === item.productId);
                    const costOfGoods = product ? product.cost * item.quantity : 0;
                    
                    productSales[item.productId].quantity += item.quantity;
                    productSales[item.productId].revenue += item.total;
                    productSales[item.productId].margin += (item.subtotal - costOfGoods);
                });
            });
        
        const detailedList = Object.entries(productSales).map(([id, data]) => ({id, ...data})).sort((a,b) => b.revenue - a.revenue);
        
        const topByRevenue = detailedList.length > 0 ? detailedList[0] : null;
        const topByMargin = [...detailedList].sort((a,b) => b.margin - a.margin)[0] || null;

        return {
            topByRevenue,
            topByMargin,
            detailedList,
        }
    }, [invoices, products]);

    const { topByRevenue, topByMargin, detailedList } = reportData;
    
    const columns = [
        { header: 'Producto', dataKey: 'name' },
        { header: 'Unidades Vendidas', dataKey: 'quantity' },
        { header: 'Ingresos Generados', dataKey: 'revenue' },
        { header: 'Margen de Ganancia', dataKey: 'margin' },
    ];
    
    const handleExportPdf = () => exportToPdf(columns, detailedList.map(item => ({...item, revenue: formatCurrency(item.revenue), margin: formatCurrency(item.margin)})), "Informe de Artículos Vendidos");
    const handleExportXlsx = () => exportToXlsx(detailedList, "articulos_vendidos.xlsx");

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <header className="mb-6">
                 <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                            <DocumentChartBarIcon className="h-8 w-8 mr-3 text-primary-500" />
                            Análisis de Rentabilidad por Artículo
                        </h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Descubre qué productos están impulsando realmente tus ganancias.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExportPdf} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
                            <DocumentDownloadIcon className="h-5 w-5" /> PDF
                        </button>
                        <button onClick={handleExportXlsx} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
                            <DocumentDownloadIcon className="h-5 w-5" /> Excel
                        </button>
                    </div>
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-gray-500 dark:text-gray-400">Top por Ingresos</h3>
                    {topByRevenue ? <>
                        <p className="text-lg font-bold text-gray-700 dark:text-white mt-1 truncate">{topByRevenue.name}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(topByRevenue.revenue)}</p>
                    </> : <p className="text-gray-500 dark:text-gray-400 mt-2">No hay datos</p>}
                </div>
                 <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl shadow-lg border-l-4 border-green-500">
                    <h3 className="text-green-600 dark:text-green-300">Top por Ganancia</h3>
                     {topByMargin ? <>
                        <p className="text-lg font-bold text-gray-700 dark:text-white mt-1 truncate">{topByMargin.name}</p>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-200 mt-1">{formatCurrency(topByMargin.margin)}</p>
                    </> : <p className="text-gray-500 dark:text-gray-400 mt-2">No hay datos</p>}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Producto</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">Unidades Vendidas</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">Ingresos Generados</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">Margen de Ganancia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {detailedList.map((data) => (
                                <tr key={data.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{data.name}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-gray-600 dark:text-gray-300">{data.quantity.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(data.revenue)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(data.margin)}</td>
                                </tr>
                            ))}
                            {detailedList.length === 0 && (
                                <tr><td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400">No hay datos de ventas para mostrar.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SoldItemsReport;