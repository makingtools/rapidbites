import React, { useMemo, useState } from 'react';
import { Invoice, Customer } from '../types';
import { DocumentChartBarIcon, DocumentDownloadIcon, PaperAirplaneIcon, SparklesIcon } from './Icons';
import { exportToPdf, exportToXlsx } from '../services/downloadService';
import { generateSmartReminderText } from '../services/geminiService';
import AIFeedback from './AIFeedback';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-CO');
const getStatusChip = (status: Invoice['status']) => {
    const base = "px-2.5 py-0.5 text-xs font-semibold rounded-full";
    const colors = {
        pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        vencida: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return <span className={`${base} ${colors[status as keyof typeof colors] || ''}`}>{status}</span>;
}

const getRiskChip = (risk?: 'Bajo' | 'Medio' | 'Alto') => {
    if (!risk) return null;
    const styles = {
        Alto: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
        Medio: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
        Bajo: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    };
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[risk]}`}>{risk}</span>;
}

interface AccountsReceivableReportProps {
    invoices: Invoice[];
    customers: Customer[];
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
    onAIFeedback: (invoiceId: string, feedbackType: 'risk' | 'paymentPrediction', value: 'correct' | 'incorrect') => void;
}

const AccountsReceivableReport: React.FC<AccountsReceivableReportProps> = ({ invoices, customers, addToast, onAIFeedback }) => {
    const [remindingId, setRemindingId] = useState<string | null>(null);

    const reportData = useMemo(() => {
        const today = new Date();
        const receivableInvoices = invoices
            .filter(inv => inv.status === 'pendiente' || inv.status === 'vencida')
            .map(inv => {
                const customer = customers.find(c => c.id === inv.customerId);
                const dueDate = new Date(inv.dueDate);
                return {
                    ...inv,
                    daysOverdue: Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24))),
                    customerName: customer?.name || 'N/A',
                }
            })
            .sort((a, b) => b.daysOverdue - a.daysOverdue);

        const totalReceivable = receivableInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalOverdue = receivableInvoices.filter(inv => inv.status === 'vencida').reduce((sum, inv) => sum + inv.total, 0);
        
        return { receivableInvoices, totalReceivable, totalOverdue };
    }, [invoices, customers]);

    const { receivableInvoices, totalReceivable, totalOverdue } = reportData;

    const columns = [
        { header: 'Factura #', dataKey: 'id' },
        { header: 'Cliente', dataKey: 'customerName' },
        { header: 'Vencimiento', dataKey: 'dueDate' },
        { header: 'Predicción IA', dataKey: 'predictedPaymentDate' },
        { header: 'Estado', dataKey: 'status' },
        { header: 'Días Vencida', dataKey: 'daysOverdue' },
        { header: 'Monto', dataKey: 'total' },
    ];
    
    const handleExportPdf = () => exportToPdf(columns, receivableInvoices.map(r => ({...r, total: formatCurrency(r.total)})), "Informe de Cuentas por Cobrar");
    const handleExportXlsx = () => exportToXlsx(receivableInvoices.map(r => ({...r, total: r.total})), "cuentas_por_cobrar.xlsx");

    const handleSendReminder = async (invoice: Invoice) => {
        setRemindingId(invoice.id);
        try {
            const reminderText = await generateSmartReminderText(invoice);
            addToast(`Recordatorio para ${invoice.customerName}: "${reminderText}"`, 'info');
        } catch (error) {
            addToast("Error al generar el recordatorio con IA.", "error");
        } finally {
            setRemindingId(null);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <header className="mb-6">
                 <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                            <DocumentChartBarIcon className="h-8 w-8 mr-3 text-primary-500" />
                            Cuentas por Cobrar (Oráculo)
                        </h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Un resumen claro de quién te debe, desde cuándo y cuándo es probable que paguen.</p>
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
                    <h3 className="text-gray-500 dark:text-gray-400">Total por Cobrar</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalReceivable)}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl shadow-lg border-l-4 border-red-500">
                    <h3 className="text-red-600 dark:text-red-300">Total Vencido</h3>
                    <p className="text-3xl font-bold text-red-700 dark:text-red-200 mt-1">{formatCurrency(totalOverdue)}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Factura #</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cliente</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Vencimiento</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Predicción de Pago (IA)</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-center">Estado</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">Días Venc.</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">Monto</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {receivableInvoices.map(invoice => (
                                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                    <td className="px-6 py-4 font-mono text-primary-600 dark:text-primary-400">{invoice.id}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{invoice.customerName}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{formatDate(invoice.dueDate)}</td>
                                    <td className="px-6 py-4 font-semibold text-blue-600 dark:text-blue-400">
                                        {invoice.predictedPaymentDate ? (
                                            <div className="flex items-center gap-2">
                                                <span>{formatDate(invoice.predictedPaymentDate)}</span>
                                                {getRiskChip(invoice.paymentRisk)}
                                                <AIFeedback 
                                                    value={invoice.paymentPredictionFeedback}
                                                    onFeedback={(value) => onAIFeedback(invoice.id, 'paymentPrediction', value)}
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">{getStatusChip(invoice.status)}</td>
                                    <td className={`px-6 py-4 text-right font-semibold ${invoice.status === 'vencida' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>{invoice.daysOverdue}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(invoice.total)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleSendReminder(invoice)}
                                            disabled={remindingId === invoice.id}
                                            className="flex items-center justify-center mx-auto gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50"
                                            title="Enviar recordatorio inteligente"
                                        >
                                            {remindingId === invoice.id ? <SparklesIcon className="h-4 w-4 animate-pulse"/> : <PaperAirplaneIcon className="h-4 w-4" />}
                                            <span>Recordar</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                             {receivableInvoices.length === 0 && (
                                <tr><td colSpan={8} className="text-center py-10 text-gray-500 dark:text-gray-400">¡Felicidades! No tienes cuentas por cobrar.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AccountsReceivableReport;