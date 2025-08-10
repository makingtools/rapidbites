import React, { useState, useMemo } from 'react';
import { AppDataState } from '../types';
import { ScaleIcon, DocumentDownloadIcon } from './Icons';
import { INITIAL_CAPITAL } from '../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

const BalanceSheet: React.FC<{ appState: AppDataState }> = ({ appState }) => {
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    const reportData = useMemo(() => {
        const endDate = new Date(asOfDate);
        endDate.setHours(23, 59, 59, 999);

        // Assets
        const totalRevenue = appState.invoices.filter(i => i.status === 'pagada' && new Date(i.paymentDate || i.issueDate) <= endDate).reduce((sum, i) => sum + i.total, 0);
        const totalExpenses = appState.expenses.filter(e => new Date(e.date) <= endDate).reduce((sum, e) => sum + e.amount, 0);
        const cash = INITIAL_CAPITAL + totalRevenue - totalExpenses;
        
        const accountsReceivable = appState.invoices.filter(i => (i.status === 'pendiente' || i.status === 'vencida') && new Date(i.issueDate) <= endDate).reduce((sum, i) => sum + i.total, 0);
        
        const inventoryValue = appState.products.reduce((sum, p) => sum + p.cost * Object.values(p.stockByWarehouse).reduce((s, q) => s + q, 0), 0);
        
        const totalAssets = cash + accountsReceivable + inventoryValue;

        // Equity
        const totalCogs = appState.invoices.filter(i => i.status === 'pagada' && new Date(i.issueDate) <= endDate).flatMap(i => i.items).reduce((sum, item) => {
            const product = appState.products.find(p => p.id === item.productId);
            return sum + (product ? product.cost * item.quantity : 0);
        }, 0);
        const retainedEarnings = totalRevenue - totalCogs - totalExpenses;
        const totalEquity = INITIAL_CAPITAL + retainedEarnings;

        return { cash, accountsReceivable, inventoryValue, totalAssets, retainedEarnings, totalEquity };
    }, [appState, asOfDate]);

    const handleExportPdf = () => {
        const doc = new jsPDF();
        doc.text(`Balance General`, 14, 16);
        doc.setFontSize(10);
        doc.text(`Al ${asOfDate}`, 14, 22);

        autoTable(doc, {
            head: [['Activos', '', 'Pasivos y Patrimonio', '']],
            body: [
                ['Activos Corrientes', '', 'Patrimonio', ''],
                ['  Efectivo', formatCurrency(reportData.cash), '  Capital Inicial', formatCurrency(INITIAL_CAPITAL)],
                ['  Cuentas por Cobrar', formatCurrency(reportData.accountsReceivable), '  Utilidades Retenidas', formatCurrency(reportData.retainedEarnings)],
                ['  Inventario', formatCurrency(reportData.inventoryValue), '', ''],
            ],
            foot: [
                ['Total Activos', formatCurrency(reportData.totalAssets), 'Total Patrimonio', formatCurrency(reportData.totalEquity)]
            ],
            startY: 30,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fontStyle: 'bold' },
            footStyles: { fontStyle: 'bold' },
            columnStyles: { 1: { halign: 'right' }, 3: { halign: 'right' } }
        });

        doc.save(`balance_general_${asOfDate}.pdf`);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <header className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                            <ScaleIcon className="h-8 w-8 mr-3 text-primary-500" />
                            Balance General
                        </h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Una fotografía de la salud financiera de tu empresa.</p>
                    </div>
                    <button onClick={handleExportPdf} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
                        <DocumentDownloadIcon className="h-5 w-5" /> PDF
                    </button>
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <label className="text-sm font-medium">A la fecha de:</label>
                    <input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} className="py-1 px-2 border rounded bg-white dark:bg-gray-700 text-sm"/>
                </div>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Assets */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold border-b-2 border-primary-500 pb-2">Activos</h2>
                        <div className="pl-4">
                            <h3 className="font-semibold text-lg">Activos Corrientes</h3>
                            <div className="pl-4 space-y-2 mt-2">
                                <div className="flex justify-between"><span>Efectivo</span> <span>{formatCurrency(reportData.cash)}</span></div>
                                <div className="flex justify-between"><span>Cuentas por Cobrar</span> <span>{formatCurrency(reportData.accountsReceivable)}</span></div>
                                <div className="flex justify-between"><span>Inventario</span> <span>{formatCurrency(reportData.inventoryValue)}</span></div>
                            </div>
                        </div>
                        <div className="flex justify-between font-extrabold text-lg pt-2 border-t-2 dark:border-gray-600">
                            <span>Total Activos</span>
                            <span>{formatCurrency(reportData.totalAssets)}</span>
                        </div>
                    </div>
                    {/* Liabilities & Equity */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold border-b-2 border-accent pb-2">Pasivos y Patrimonio</h2>
                         <div className="pl-4">
                            <h3 className="font-semibold text-lg">Patrimonio</h3>
                            <div className="pl-4 space-y-2 mt-2">
                                <div className="flex justify-between"><span>Capital Inicial</span> <span>{formatCurrency(INITIAL_CAPITAL)}</span></div>
                                <div className="flex justify-between"><span>Utilidades Retenidas</span> <span>{formatCurrency(reportData.retainedEarnings)}</span></div>
                            </div>
                        </div>
                        <div className="flex justify-between font-extrabold text-lg pt-2 border-t-2 dark:border-gray-600">
                            <span>Total Patrimonio</span>
                            <span>{formatCurrency(reportData.totalEquity)}</span>
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-4 border-t-4 border-double dark:border-gray-600 text-center text-sm text-gray-500">
                    <p>Total Activos ({formatCurrency(reportData.totalAssets)}) = Total Pasivos + Patrimonio ({formatCurrency(reportData.totalEquity)})</p>
                </div>
            </div>
        </div>
    );
};

export default BalanceSheet;