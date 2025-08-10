import React, { useState, useMemo, useEffect } from 'react';
import { Invoice, View, DateRange } from '../types';
import { DocumentDuplicateIcon, PlusIcon, PencilIcon, EyeIcon, ShieldCheckIcon, ExclamationCircleIcon } from './Icons';
import PageHeader from './PageHeader';
import FilterBar from './FilterBar';
import AIFeedback from './AIFeedback';
import { formatCurrency } from '../utils/formatters';

const getStatusChip = (status: Invoice['status'], viewed: boolean) => {
    const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full inline-flex items-center gap-1.5";
    const statusMap = {
        pagada: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        vencida: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        borrador: "bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-neutral-300",
    };
    return (
        <span className={`${baseClasses} ${statusMap[status]}`}>
            {viewed && <EyeIcon className="h-3 w-3" />}
            {status}
        </span>
    );
}

const getRiskChip = (riskLevel?: Invoice['riskLevel'], riskReason?: string) => {
    if (!riskLevel) return <span className="text-gray-400 text-xs">N/A</span>;

    const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full inline-flex items-center gap-1.5 cursor-help";
    const riskMap = {
        Alto: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        Medio: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        Bajo: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    };
    return (
        <span className={`${baseClasses} ${riskMap[riskLevel]}`} title={riskReason}>
            <ShieldCheckIcon className="h-3 w-3" />
            {riskLevel}
        </span>
    );
}


interface InvoiceListProps {
    invoices: Invoice[];
    onAdd: () => void;
    onEditInvoice: (invoice: Invoice) => void;
    handleViewInvoice: (invoice: Invoice) => void;
    onNavigate: (view: View, payload?: any) => void;
    onAIFeedback: (invoiceId: string, feedbackType: 'risk' | 'paymentPrediction', value: 'correct' | 'incorrect') => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onAdd, onEditInvoice, handleViewInvoice, onNavigate, onAIFeedback }) => {
    const [inputValue, setInputValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<Invoice['status'] | 'all'>('all');
    const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: new Date() });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(inputValue);
            setCurrentPage(1);
        }, 300); // 300ms delay for debouncing

        return () => {
            clearTimeout(timer);
        };
    }, [inputValue]);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterStatus(e.target.value as any);
        setCurrentPage(1);
    };

    const handleDateChange = (newRange: DateRange) => {
        setDateRange(newRange);
        setCurrentPage(1);
    };

    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            const issueDate = new Date(`${invoice.issueDate}T00:00:00`);
            const statusMatch = filterStatus === 'all' || invoice.status === filterStatus;
            const searchMatch =
                invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (invoice.customerName && invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
            const startMatch = !dateRange.start || issueDate >= dateRange.start;
            const endMatch = !dateRange.end || issueDate <= dateRange.end;
            return statusMatch && searchMatch && startMatch && endMatch;
        }).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    }, [invoices, searchTerm, filterStatus, dateRange]);

    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const actions = (
        <>
            <button
                onClick={() => onNavigate('invoice_from_document')}
                className="flex items-center bg-accent-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-accent-600 transition-colors duration-300 shadow-lg"
            >
                <PlusIcon className="h-5 w-5 mr-2" />
                Crear con IA
            </button>
            <button
                onClick={onAdd}
                className="flex items-center bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-300 shadow-lg"
            >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nueva Factura
            </button>
        </>
    );

    const extraFilters = (
        <select
            value={filterStatus}
            onChange={handleStatusChange}
            className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
            <option value="all">Todos los estados</option>
            <option value="pagada">Pagada</option>
            <option value="pendiente">Pendiente</option>
            <option value="vencida">Vencida</option>
            <option value="borrador">Borrador</option>
        </select>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <PageHeader
                icon={<DocumentDuplicateIcon />}
                title="Facturas de Venta"
                description="Consulta, crea y gestiona todas tus facturas."
                actions={actions}
            />

            <FilterBar
                searchTerm={inputValue}
                onSearchTermChange={setInputValue}
                searchPlaceholder="Buscar por ID o cliente..."
                dateRange={dateRange}
                onDateRangeChange={handleDateChange}
                extraFilters={extraFilters}
            />

            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-neutral-800/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Factura #</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha Emisión</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Riesgo IA</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">Total</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                            {paginatedInvoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/40">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-primary-600 dark:text-primary-400">
                                        <div className="flex items-center gap-2">
                                            {invoice.isPotentialDuplicate && <span title={`Posible duplicado: ${invoice.duplicateReason}`}><ExclamationCircleIcon className="h-5 w-5 text-yellow-500" /></span>}
                                            <span>{invoice.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        <button onClick={() => onNavigate('customer_profile', invoice.customerId)} className="hover:underline text-primary-600 dark:text-primary-400">
                                            {invoice.customerName}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{new Date(`${invoice.issueDate}T00:00:00`).toLocaleDateString('es-CO')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusChip(invoice.status, !!invoice.viewedAt && invoice.status !== 'pagada')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                           {getRiskChip(invoice.riskLevel, invoice.riskReason)}
                                           <AIFeedback
                                                value={invoice.riskFeedback}
                                                onFeedback={(value) => onAIFeedback(invoice.id, 'risk', value)}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white text-right">{formatCurrency(invoice.total)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <button onClick={() => handleViewInvoice(invoice)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 p-1" title="Ver Factura y Pagar">
                                                <EyeIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => onEditInvoice(invoice)} className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 p-1" title="Editar">
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        No se encontraron facturas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="p-4 flex items-center justify-between border-t border-gray-200 dark:border-neutral-800">
                        <span className="text-sm text-gray-600 dark:text-neutral-400">
                            Mostrando {paginatedInvoices.length} de {filteredInvoices.length} facturas
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm bg-gray-200 dark:bg-neutral-800 rounded-md disabled:opacity-50 text-gray-800 dark:text-neutral-200">Anterior</button>
                            <span className="px-3 py-1 text-sm font-medium">Página {currentPage} de {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm bg-gray-200 dark:bg-neutral-800 rounded-md disabled:opacity-50 text-gray-800 dark:text-neutral-200">Siguiente</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvoiceList;
