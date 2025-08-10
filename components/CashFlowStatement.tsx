import React, { useState, useMemo } from 'react';
import { AppDataState } from '../types';
import { DocumentTextIcon, DocumentDownloadIcon } from './Icons';
import { INITIAL_CAPITAL } from '../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

const CashFlowStatement: React.FC<{ appState: AppDataState }> = ({ appState }) => {
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

        // Beginning Balance
        const beginningRevenue = appState.invoices.filter(i => i.status === 'pagada' && new Date(i.paymentDate || i.issueDate) < startDate).reduce((sum, i) => sum + i.total, 0);
        const beginningExpenses = appState.expenses.filter(e => new Date(e.date) < startDate).reduce((sum, e) => sum + e.amount, 0);
        const beginningBalance = INITIAL_CAPITAL + beginningRevenue - beginningExpenses;
        
        // Cash Flows from Operating Activities
        const cashInflows = appState.invoices.filter(i => {
            const paymentDate = new Date(i.paymentDate || i.issueDate);
            return i.status === 'pagada' && paymentDate >= startDate && paymentDate <= endDate;
        }).reduce((sum, i) => sum + i.total, 0);

        const cogsPayments = appState.purchaseOrders.filter(po => {
            const issueDate = new Date(po.issueDate);
            return po.status === 'recibida' && issueDate >= startDate && issueDate <= endDate;
        }).reduce((sum, po) => sum + po.total, 0);

        const operatingExpenses = appState.expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= startDate && expenseDate <= endDate;
        }).reduce((sum, e) => sum + e.amount, 0);
        
        const cashOutflows = cogsPayments + operatingExpenses;

        const netCashFlow = cashInflows - cashOutflows;
        const endingBalance = beginningBalance + netCashFlow;

        return { beginningBalance, cashInflows, cogsPayments, operatingExpenses, cashOutflows, netCashFlow, endingBalance };
    }, [appState, dateRange]);

    const handleExportPdf = () => {
        const doc = new jsPDF();
        doc.text(`Estado de Flujo de Caja`, 14, 16);
        doc.setFontSize(10);
        doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, 14, 22);

        autoTable(doc, {
            body: [
                ['Saldo de Caja Inicial', formatCurrency(reportData.beginningBalance)],
                [{ content: 'Flujo de Caja de Actividades de Operación', styles: { fontStyle: 'bold' } }],
                ['  Cobros a Clientes', formatCurrency(reportData.cashInflows)],
                ['  Pagos a Proveedores (COGS)', `-${formatCurrency(reportData.cogsPayments)}`],
                ['  Pagos de Gastos Operativos', `-${formatCurrency(reportData.operatingExpenses)}`],
                ['Flujo de Caja Neto', formatCurrency(reportData.netCashFlow)],
                [{ content: 'Saldo de Caja Final', styles: { fontStyle: 'bold', fillColor: '#f0f9ff' } }, { content: formatCurrency(reportData.endingBalance), styles: { fontStyle: 'bold', fillColor: '#f0f9ff' } }],
            ],
            startY: 30,
            theme: 'grid',
            styles: { fontSize: 10 },
            columnStyles: { 1: { halign: 'right' } }
        });
        doc.save(`flujo_de_caja_${dateRange.start}_${dateRange.end}.pdf`);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <header className="mb-6">
                 <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                            <DocumentTextIcon className="h-8 w-8 mr-3 text-primary-500" />
                            Estado de Flujo de Caja
                        </h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Sigue el rastro de tu efectivo para entender la liquidez del negocio.</p>
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
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-lg pb-2">
                        <span className="text-gray-600 dark:text-gray-300">Saldo de Caja Inicial</span>
                        <span className="font-semibold">{formatCurrency(reportData.beginningBalance)}</span>
                    </div>
                    
                    <h3 className="font-bold text-xl pt-4 pb-2 text-primary-700 dark:text-primary-300">Flujo de Caja de Actividades de Operación</h3>
                    <div className="pl-4 space-y-2">
                        <div className="flex justify-between text-lg">
                            <span className="text-gray-600 dark:text-gray-300">Cobros a Clientes (Entradas)</span>
                            <span className="font-semibold text-green-600">{formatCurrency(reportData.cashInflows)}</span>
                        </div>
                         <div className="flex justify-between text-lg">
                            <span className="text-gray-600 dark:text-gray-300">Pagos a Proveedores y Gastos (Salidas)</span>
                            <span className="font-semibold text-red-500">-{formatCurrency(reportData.cashOutflows)}</span>
                        </div>
                    </div>
                    
                     <div className="flex justify-between items-center text-xl font-bold pt-2 border-t dark:border-gray-600">
                        <span className="text-gray-800 dark:text-white">Flujo de Caja Neto del Período</span>
                        <span className={reportData.netCashFlow >= 0 ? 'text-green-600' : 'text-red-500'}>{formatCurrency(reportData.netCashFlow)}</span>
                    </div>

                    <div className="flex justify-between items-center text-2xl font-extrabold pt-4 border-t-2 border-primary-500 mt-4">
                        <span className="text-gray-800 dark:text-white">Saldo de Caja Final</span>
                        <span>{formatCurrency(reportData.endingBalance)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashFlowStatement;