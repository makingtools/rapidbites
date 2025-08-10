import React, { useState, useMemo } from 'react';
import { PurchaseOrder, View, DateRange } from '../types';
import { ClipboardDocumentListIcon, PlusIcon, PencilIcon } from './Icons';
import PageHeader from './PageHeader';
import FilterBar from './FilterBar';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const getStatusChip = (status: PurchaseOrder['status']) => {
    const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full inline-block";
    const statusMap = {
        recibida: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        enviada: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        borrador: "bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-neutral-300",
    };
    return <span className={`${baseClasses} ${statusMap[status]}`}>{status}</span>;
};

interface PurchaseOrderListProps {
    purchaseOrders: PurchaseOrder[];
    onAdd: () => void;
    onEdit: (po: PurchaseOrder) => void;
    onNavigate: (view: View, payload?: any) => void;
}

const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({ purchaseOrders, onAdd, onEdit, onNavigate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: new Date() });

    const filteredPOs = useMemo(() => {
        return purchaseOrders.filter(po => {
            const issueDate = new Date(po.issueDate);
            const searchMatch =
                po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (po.supplierName && po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()));
            const startMatch = !dateRange.start || issueDate >= dateRange.start;
            const endMatch = !dateRange.end || issueDate <= dateRange.end;
            return searchMatch && startMatch && endMatch;
        }).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    }, [purchaseOrders, searchTerm, dateRange]);

    const actions = (
        <button
            onClick={onAdd}
            className="flex items-center bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-300 shadow-lg"
        >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Orden
        </button>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <PageHeader
                icon={<ClipboardDocumentListIcon />}
                title="Órdenes de Compra"
                description="Gestiona tus pedidos a proveedores."
                actions={actions}
            />

            <FilterBar
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                searchPlaceholder="Buscar por ID o proveedor..."
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
            />

            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-neutral-800/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Orden #</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Proveedor</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha Emisión</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">Total</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                            {filteredPOs.map((po) => (
                                <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/40">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-primary-600 dark:text-primary-400">{po.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        <button onClick={() => onNavigate('supplier_profile', po.supplierId)} className="hover:underline text-primary-600 dark:text-primary-400">
                                            {po.supplierName}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{new Date(po.issueDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusChip(po.status)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white text-right">{formatCurrency(po.total)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <button onClick={() => onEdit(po)} className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 p-1" title="Editar">
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredPOs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        No se encontraron órdenes de compra.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PurchaseOrderList;
