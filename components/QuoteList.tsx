import React, { useState, useMemo } from 'react';
import { Quote, View } from '../types';
import { DocumentPlusIcon, PlusIcon, PencilIcon, SearchIcon, EyeIcon, DocumentDownloadIcon, ArrowRightIcon } from './Icons';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const getStageChip = (stage: Quote['stage']) => {
    const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full inline-block capitalize";
    const stageMap: Record<Quote['stage'], string> = {
        'Calificación': "bg-slate-100 text-slate-800 dark:bg-neutral-700 dark:text-neutral-300",
        'Propuesta Enviada': "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        'Negociación': "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        'Ganada': "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        'Perdida': "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return <span className={`${baseClasses} ${stageMap[stage]}`}>{stage}</span>;
}

interface QuoteListProps {
    quotes: Quote[];
    onAdd: () => void;
    onEdit: (quote: Quote) => void;
    onConvertToInvoice: (quote: Quote) => void;
    onNavigate: (view: View, payload?: any) => void;
}

const QuoteList: React.FC<QuoteListProps> = ({ quotes, onAdd, onEdit, onConvertToInvoice, onNavigate }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredQuotes = useMemo(() => {
        return quotes.filter(quote =>
            quote.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (quote.customerName && quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
        ).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    }, [quotes, searchTerm]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                        <DocumentPlusIcon className="h-8 w-8 mr-3 text-primary-500" />
                        Gestión de Cotizaciones
                    </h1>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Crea cotizaciones y conviértelas en facturas con un clic.</p>
                </div>
                 <button
                    onClick={onAdd}
                    className="flex items-center bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-300 shadow-lg"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Nueva Cotización
                </button>
            </header>

            <div className="mb-4">
                 <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por ID, cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cotización #</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cliente</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha Emisión</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Etapa</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">Total</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredQuotes.map((quote) => (
                                <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                    <td className="px-6 py-4 font-mono text-primary-600 dark:text-primary-400">{quote.id}</td>
                                    <td className="px-6 py-4 font-medium">
                                        <button onClick={() => onNavigate('customer_profile', quote.customerId)} className="hover:underline text-primary-600 dark:text-primary-400">
                                            {quote.customerName}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{new Date(quote.issueDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{getStageChip(quote.stage)}</td>
                                    <td className="px-6 py-4 font-semibold text-right">{formatCurrency(quote.total)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <button onClick={() => onEdit(quote)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 p-1" title="Editar / Ver">
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            {quote.stage === 'Ganada' && (
                                                <button onClick={() => onConvertToInvoice(quote)} className="flex items-center gap-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 p-1 font-semibold text-sm" title="Convertir a Factura">
                                                    <ArrowRightIcon className="h-4 w-4" /> Facturar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredQuotes.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">No se encontraron cotizaciones.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default QuoteList;