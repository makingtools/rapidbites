import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { AppDataState, Customer, CommunicationLog, SuggestedReply, CreditLimitSuggestion, SupportTicket, Quote } from '../types';
import { UsersIcon, DocumentDuplicateIcon, CheckCircleIcon, DocumentTextIcon, BellIcon, SparklesIcon, PaperAirplaneIcon, BanknotesIcon, PhoneIcon, PlusIcon, ClipboardDocumentListIcon } from './Icons';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import CustomerLoyaltyAI from './CustomerLoyaltyAI';
import Modal from './Modal';
import { generateSuggestedReplyForCustomer, suggestCreditLimitForCustomer } from '../services/geminiService';
import { formatCurrency } from '../utils/formatters';
import KPI_Card from './shared/KPI_Card';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const getBehaviorChip = (behavior?: Customer['paymentBehavior']) => {
    if (!behavior) return null;
    const styles = {
        on_time: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        late: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        new: 'bg-slate-100 text-slate-800 dark:bg-neutral-700 dark:text-neutral-300',
    };
    const labels = { on_time: 'Paga a Tiempo', late: 'Suele Retrasarse', normal: 'Pagador Normal', new: 'Cliente Nuevo' };
    return <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${styles[behavior]}`}>{labels[behavior]}</span>;
};

const TimelineItem: React.FC<{ item: any }> = ({ item }) => {
    const icons = {
        invoice_sent: <DocumentDuplicateIcon className="h-4 w-4 text-blue-500" />,
        invoice_viewed: <UsersIcon className="h-4 w-4 text-purple-500" />,
        payment_received: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
        reminder_sent: <BellIcon className="h-4 w-4 text-yellow-500" />,
        note_added: <DocumentTextIcon className="h-4 w-4 text-slate-500" />,
        call_logged: <PhoneIcon className="h-4 w-4 text-slate-500" />,
        ticket_created: <ClipboardDocumentListIcon className="h-4 w-4 text-red-500" />,
        campaign_email_sent: <PaperAirplaneIcon className="h-4 w-4 text-teal-500" />,
    };
    return (
        <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1.5 h-6 w-6 rounded-full bg-slate-100 dark:bg-neutral-700 flex items-center justify-center">{icons[item.type as keyof typeof icons]}</div>
            <div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{item.details}</p>
                <p className="text-xs text-slate-500">{new Date(item.date).toLocaleString('es-CO')}</p>
            </div>
        </div>
    );
};

const CustomerCreditAI: React.FC<{ customer: Customer, invoices: AppDataState['invoices'] }> = ({ customer, invoices }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [creditData, setCreditData] = useState<CreditLimitSuggestion | null>(null);

    useEffect(() => {
        const fetchCreditLimit = async () => {
            setIsLoading(true);
            const customerInvoices = invoices.filter(i => i.customerId === customer.id);
            const data = await suggestCreditLimitForCustomer(customer, customerInvoices);
            setCreditData(data);
            setIsLoading(false);
        };
        fetchCreditLimit();
    }, [customer, invoices]);

    return (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg">
             <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <BanknotesIcon className="h-6 w-6 text-primary-500" />
                Sugerencia de Crédito IA
             </h2>
             {isLoading ? (
                <div className="animate-pulse space-y-2"><div className="h-8 bg-slate-300 dark:bg-neutral-600 rounded w-1/2"></div><div className="h-4 bg-slate-300 dark:bg-neutral-600 rounded w-full"></div></div>
             ) : (
                <>
                    <p className="text-4xl font-extrabold text-primary-600 dark:text-primary-400">{formatCurrency(creditData?.limit || 0)}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-2">"{creditData?.reason}"</p>
                </>
             )}
        </div>
    );
};

interface CustomerProfileProps {
    customerId: number;
    appState: AppDataState;
    onLogCommunication: (customerId: number, type: 'note_added' | 'call_logged', details: string) => void;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customerId, appState, onLogCommunication }) => {
    const { customers, invoices, quotes, supportTickets } = appState;
    const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [logDetails, setLogDetails] = useState('');
    const [logType, setLogType] = useState<'note_added' | 'call_logged'>('note_added');
    const [suggestedReply, setSuggestedReply] = useState<SuggestedReply | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const customerData = useMemo(() => {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return null;

        const customerInvoices = invoices.filter(inv => inv.customerId === customer.id)
            .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
        const customerQuotes = quotes.filter(q => q.customerId === customer.id);
        const customerTickets = supportTickets.filter(t => t.customerId === customer.id);

        const combinedTimeline = [
            ...(customer.communicationHistory || []),
            ...customerInvoices.map(i => ({ id: `inv-${i.id}`, date: i.issueDate, type: 'invoice_sent' as const, details: `Factura ${i.id} generada por ${formatCurrency(i.total)}` })),
            ...customerTickets.map(t => ({ id: `tkt-${t.id}`, date: t.createdAt, type: 'ticket_created' as const, details: `Ticket de soporte creado: "${t.subject}"` }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (customerInvoices.length === 0) {
            return { customer, allInvoices: [], totalBilled: 0, outstandingBalance: 0, lastPurchaseDate: 'N/A', purchaseHistory: [], favoriteProducts: [], communicationHistory: combinedTimeline, avgPaymentDays: 0, paymentBehavior: 'new' as const, customerQuotes, customerTickets };
        }

        const totalBilled = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const outstandingBalance = customerInvoices.filter(i => i.status === 'pendiente' || i.status === 'vencida').reduce((sum, i) => sum + i.total, 0);
        const lastPurchaseDate = new Date(customerInvoices[0].issueDate).toLocaleDateString('es-CO');

        const productPurchases: { [key: string]: { name: string, quantity: number, revenue: number } } = {};
        customerInvoices.filter(i => i.status === 'pagada').flatMap(i => i.items).forEach(item => {
            if (!productPurchases[item.productId]) {
                productPurchases[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
            }
            productPurchases[item.productId].quantity += item.quantity;
            productPurchases[item.productId].revenue += item.total;
        });

        const favoriteProducts = Object.values(productPurchases).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        const paidInvoices = customerInvoices.filter(i => i.status === 'pagada' && i.paymentDate);
        let paymentBehavior: Customer['paymentBehavior'] = 'new';
        let totalPaymentDays = 0;
        if (paidInvoices.length > 2) {
            const latePayments = paidInvoices.filter(i => new Date(i.paymentDate!) > new Date(i.dueDate)).length;
            paidInvoices.forEach(i => {
                totalPaymentDays += (new Date(i.paymentDate!).getTime() - new Date(i.issueDate).getTime()) / (1000 * 3600 * 24);
            });
            const lateRatio = latePayments / paidInvoices.length;
            if (lateRatio > 0.5) paymentBehavior = 'late';
            else if (lateRatio < 0.1) paymentBehavior = 'on_time';
            else paymentBehavior = 'normal';
        } else if (paidInvoices.length > 0) {
            paymentBehavior = 'normal';
            paidInvoices.forEach(i => {
                totalPaymentDays += (new Date(i.paymentDate!).getTime() - new Date(i.issueDate).getTime()) / (1000 * 3600 * 24);
            });
        }

        const avgPaymentDays = paidInvoices.length > 0 ? Math.round(totalPaymentDays / paidInvoices.length) : 0;

        const purchaseHistoryByMonth = customerInvoices.filter(i => i.status === 'pagada').reduce((acc: Record<string, number>, inv) => {
            const month = new Date(inv.issueDate).toLocaleDateString('es-CO', { year: '2-digit', month: 'short' });
            acc[month] = (acc[month] || 0) + inv.total;
            return acc;
        }, {});
        
        const purchaseHistory = Object.entries(purchaseHistoryByMonth).map(([label, value]) => ({ label, value })).slice(-12);
        
        return { customer, allInvoices: customerInvoices, totalBilled, outstandingBalance, lastPurchaseDate, purchaseHistory, favoriteProducts, communicationHistory: combinedTimeline, avgPaymentDays, paymentBehavior, customerQuotes, customerTickets };

    }, [customerId, customers, invoices, quotes, supportTickets]);

    if (!customerData) {
        return <div className="p-8 text-center">Cliente no encontrado.</div>;
    }

    const { customer, totalBilled, outstandingBalance, avgPaymentDays, lastPurchaseDate, purchaseHistory, communicationHistory, paymentBehavior } = customerData;
    
    const chartData = {
        labels: purchaseHistory.map(p => p.label),
        datasets: [{
            label: 'Compras Mensuales',
            data: purchaseHistory.map(p => p.value),
            backgroundColor: '#6366f1'
        }]
    };

    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { callback: (v:any) => formatCurrency(v).slice(0,-4) + 'K' } } }
    };
    
    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in space-y-6">
            <header>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center">
                    <UsersIcon className="h-8 w-8 mr-3 text-primary-500" />
                    Perfil del Cliente
                </h1>
                <div className="mt-2 flex items-center gap-4">
                     <p className="text-2xl font-semibold text-slate-700 dark:text-slate-200">{customer.name}</p>
                     {getBehaviorChip(paymentBehavior)}
                </div>
                <p className="text-slate-500 dark:text-slate-400">{customer.email}</p>
            </header>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <KPI_Card title="Total Facturado" value={formatCurrency(totalBilled)} />
                 <KPI_Card title="Saldo Pendiente" value={formatCurrency(outstandingBalance)} className={outstandingBalance > 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''} />
                 <KPI_Card title="Días Promedio de Pago" value={`${avgPaymentDays} días`} />
                 <KPI_Card title="Última Compra" value={lastPurchaseDate} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                <div className="lg:col-span-3 space-y-6">
                     <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Historial de Compras (Últimos 12m)</h2>
                        <div className="h-64"><Bar data={chartData} options={chartOptions as any} /></div>
                    </div>
                     <CustomerCreditAI customer={customer} invoices={invoices} />
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <CustomerLoyaltyAI customer={customer} invoices={invoices} />
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Actividad Reciente</h2>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                           {communicationHistory.map(item => <TimelineItem key={item.id} item={item} />)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerProfile;