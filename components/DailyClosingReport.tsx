
import React, { useState, useMemo } from 'react';
import { Invoice } from '../types';
import { DocumentChartBarIcon, DocumentDownloadIcon } from './Icons';
import { exportToPdf, exportToXlsx } from '../services/downloadService';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);

interface DailyClosingReportProps {
    invoices: Invoice[];
}

const DailyClosingReport: React.FC<DailyClosingReportProps> = ({ invoices }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const reportData = useMemo(() => {
        const dailyInvoices = invoices.filter(inv => 
            inv.issueDate === selectedDate && inv.status === 'pagada'
        );

        const totalSales = dailyInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const invoiceCount = dailyInvoices.length;
        
        const salesByPaymentMethod = dailyInvoices.reduce((acc, inv) => {
            const method = inv.paymentMethod || 'N/A';
            if (!acc[method]) {
                acc[method] = { total: 0, count: 0 };
            }
            acc[method].total += inv.total;
            acc[method].count += 1;
            return acc;
        }, {} as Record<string, { total: number; count: number }>);
        
        const formattedPaymentData = Object.entries(salesByPaymentMethod).map(([method, data]) => ({
            method,
            ...data
        }));

        return { dailyInvoices, totalSales, invoiceCount, salesByPaymentMethod: formattedPaymentData };
    }, [invoices, selectedDate]);

    const { totalSales, invoiceCount, salesByPaymentMethod } = reportData;

    const handleExportPdf = () => {
         const docTitle = `Cierre Diario - ${selectedDate}`;
         exportToPdf(
            [{ header: 'Método de Pago', dataKey: 'method' }, { header: 'Total Recaudado', dataKey: 'total' }, { header: 'Nº Facturas', dataKey: 'count' }],
            salesByPaymentMethod.map(d => ({ ...d, total: formatCurrency(d.total) })),
            docTitle
        );
    };

    const handleExportXlsx = () => {
        exportToXlsx(salesByPaymentMethod, `cierre_diario_${selectedDate}.xlsx`);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <header className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                            <DocumentChartBarIcon className="h-8 w-8 mr-3 text-primary-500" />
                            Informe de Cierre Diario
                        </h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Consulta el resumen de ventas por día y método de pago.</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={handleExportPdf} disabled={salesByPaymentMethod.length === 0} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50">
                           <DocumentDownloadIcon className="h-5 w-5" /> PDF
                        </button>
                        <button onClick={handleExportXlsx} disabled={salesByPaymentMethod.length === 0} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50">
                           <DocumentDownloadIcon className="h-5 w-5" /> Excel
                        </button>
                    </div>
                </div>
                <div className="mt-4">
                    <label htmlFor="report-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecciona una fecha</label>
                    <input
                        type="date"
                        id="report-date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="mt-1 w-full max-w-xs px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-gray-500 dark:text-gray-400">Total Ventas del Día</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalSales)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-gray-500 dark:text-gray-400">Total Facturas del Día</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{invoiceCount}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Método de Pago</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">Nº Facturas</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">Total Recaudado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {salesByPaymentMethod.map(({ method, total, count }) => (
                                <tr key={method} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{method}</td>
                                    <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{count}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(total)}</td>
                                </tr>
                            ))}
                            {salesByPaymentMethod.length === 0 && (
                                <tr><td colSpan={3} className="text-center py-10 text-gray-500 dark:text-gray-400">No hay ventas registradas para la fecha seleccionada.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DailyClosingReport;
