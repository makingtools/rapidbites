


import React, { useState, useMemo } from 'react';
import { Supplier, PurchaseOrder, View, DateRange } from '../types';
import { BuildingOfficeIcon, DocumentDownloadIcon } from './Icons';
import { exportToPdf, exportToXlsx } from '../services/downloadService';
import PageHeader from './PageHeader';
import FilterBar from './FilterBar';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);

interface SuppliersDashboardProps {
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];
    onNavigate: (view: View, payload?: any) => void;
}

const SuppliersDashboard: React.FC<SuppliersDashboardProps> = ({ suppliers, purchaseOrders, onNavigate }) => {
    const [dateRange, setDateRange] = useState<DateRange>({ start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), end: new Date() });

    const filteredPOs = useMemo(() => {
        return purchaseOrders.filter(po => {
            const issueDate = new Date(po.issueDate);
            const startMatch = !dateRange.start || issueDate >= dateRange.start;
            const endMatch = !dateRange.end || issueDate <= dateRange.end;
            return po.status !== 'borrador' && startMatch && endMatch;
        });
    }, [purchaseOrders, dateRange]);

    const reportData = useMemo(() => {
        const dataBySupplier: { [id: string]: { id: string; name: string; totalValue: number; orderCount: number; } } = {};

        suppliers.forEach(s => {
            dataBySupplier[s.id] = { id: s.id, name: s.name, totalValue: 0, orderCount: 0 };
        });

        filteredPOs.forEach(po => {
            if (dataBySupplier[po.supplierId]) {
                dataBySupplier[po.supplierId].totalValue += po.total;
                dataBySupplier[po.supplierId].orderCount += 1;
            }
        });
        
        return Object.values(dataBySupplier)
            .filter(s => s.orderCount > 0)
            .sort((a,b) => b.totalValue - a.totalValue);

    }, [suppliers, filteredPOs]);
    
    const handleExportPdf = () => {
        exportToPdf(
            [ {header: 'Proveedor', dataKey: 'name'}, {header: 'Valor Total Comprado', dataKey: 'totalValue'}, {header: 'Nº Órdenes', dataKey: 'orderCount'} ],
            reportData.map(r => ({...r, totalValue: formatCurrency(r.totalValue)})),
            'Informe de Compras por Proveedor'
        );
    };
    const handleExportXlsx = () => exportToXlsx(reportData, "compras_por_proveedor.xlsx");
    
    const actions = (
        <>
             <button onClick={handleExportPdf} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
               <DocumentDownloadIcon className="h-5 w-5" /> PDF
            </button>
            <button onClick={handleExportXlsx} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
               <DocumentDownloadIcon className="h-5 w-5" /> Excel
            </button>
        </>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <PageHeader
                icon={<BuildingOfficeIcon />}
                title="Dashboard de Proveedores"
                description="Analiza tus compras y relaciones con proveedores."
                actions={actions}
            />

            <FilterBar
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
            />

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ranking</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Proveedor</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">Valor Total Comprado</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">Nº de Órdenes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {reportData.map((s, index) => (
                                <tr key={s.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                    <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300 text-lg">#{index + 1}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">
                                        <button onClick={() => onNavigate('supplier_profile', s.id)} className="hover:underline text-primary-600 dark:text-primary-400">
                                            {s.name}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold text-primary-600 dark:text-primary-400">{formatCurrency(s.totalValue)}</td>
                                    <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{s.orderCount}</td>
                                </tr>
                            ))}
                              {reportData.length === 0 && (
                                <tr><td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400">No hay datos de compras para este período.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuppliersDashboard;