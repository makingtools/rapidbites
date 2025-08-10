import React, { useState, useMemo } from 'react';
import { AppDataState } from '../types';
import { DocumentChartBarIcon, DocumentDownloadIcon } from './Icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

const ProfitAndLossStatement: React.FC<{ appState: AppDataState }> = ({ appState }) => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [dateRange, setDateRange] = useState({
        start: firstDayOfMonth.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0],
    });

    const reportData = useMemo(() => {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);

        const relevantInvoices = appState.invoices.filter(i => {
            const issueDate = new Date(i.issueDate);
            return i.status === 'pagada' && issueDate >= startDate && issueDate <= endDate;
        });

        const revenue = relevantInvoices.reduce((sum, i) => sum + i.subtotal, 0);

        const cogs = relevantInvoices.flatMap(i => i.items).reduce((sum, item) => {
            const product = appState.products.find(p => p.id === item.productId);
            return sum + (product ? product.cost * item.quantity : 0);
        }, 0);

        const grossProfit = revenue - cogs;

        const operatingExpenses = appState.expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= startDate && expenseDate <= endDate;
        }).reduce((sum, e) => sum + e.amount, 0);

        const netProfit = grossProfit - operatingExpenses;

        return { revenue, cogs, grossProfit, operatingExpenses, netProfit };
    }, [appState, dateRange]);

    const handleExportPdf = () => {
        const doc = new jsPDF();
        doc.text(`Estado de Resultados`, 14, 16);
        doc.setFontSize(10);
        doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, 14, 22);
        
        autoTable(doc, {
            body: [
                ['Ingresos por Ventas', formatCurrency(reportData.revenue)],
                ['Costo de Mercancía Vendida (COGS)', `-${formatCurrency(reportData.cogs)}`],
                [{ content: 'Utilidad Bruta', styles: { fontStyle: 'bold' } }, { content: formatCurrency(reportData.grossProfit), styles: { fontStyle: 'bold' } }],
                ['Gastos Operativos', `-${formatCurrency(reportData.operatingExpenses)}`],
                [{ content: 'Utilidad Neta', styles: { fontStyle: 'bold', fillColor: '#f0f9ff' } }, { content: formatCurrency(reportData.netProfit), styles: { fontStyle: 'bold', fillColor: '#f0f9ff' } }],
            ],
            startY: 30,
            theme: 'grid',
            styles: { fontSize: 10 },
            columnStyles: { 1: { halign: 'right' } }
        });
        doc.save(`estado_de_resultados_${dateRange.start}_${dateRange.end}.pdf`);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <header className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                            <DocumentChartBarIcon className="h-8 w-8 mr-3 text-primary-500" />
                            Estado de Resultados (P&L)
                        </h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Analiza la rentabilidad de tu negocio en un período específico.</p>
                    </div>
                    <button onClick={handleExportPdf} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
                        <DocumentDownloadIcon className="h-5 w-5" /> PDF
                    </button>
                </div>
                <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Desde:</label>
                        <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} className="py-1 px-2 border rounded bg-white dark:bg-gray-700 text-sm"/>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Hasta:</label>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} className="py-1 px-2 border rounded bg-white dark:bg-gray-700 text-sm"/>
                    </div>
                </div>
            </header>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-gray-600 dark:text-gray-300">Ingresos por Ventas</span>
                        <span className="font-semibold">{formatCurrency(reportData.revenue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-gray-600 dark:text-gray-300">Costo de Mercancía Vendida (COGS)</span>
                        <span className="font-semibold text-red-500">-{formatCurrency(reportData.cogs)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xl font-bold pt-2 border-t dark:border-gray-600">
                        <span className="text-gray-800 dark:text-white">Utilidad Bruta</span>
                        <span>{formatCurrency(reportData.grossProfit)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg pt-4">
                        <span className="text-gray-600 dark:text-gray-300">Gastos Operativos</span>
                        <span className="font-semibold text-red-500">-{formatCurrency(reportData.operatingExpenses)}</span>
                    </div>
                     <div className={`flex justify-between items-center text-2xl font-extrabold p-4 rounded-lg mt-4 ${reportData.netProfit >= 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                        <span>Utilidad Neta</span>
                        <span>{formatCurrency(reportData.netProfit)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfitAndLossStatement;