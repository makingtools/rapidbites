import React, { useState, useMemo } from 'react';
import { AppDataState, DateRange, Invoice } from '../types';
import { UserGroupIcon, DocumentDownloadIcon } from './Icons';
import { exportToPdf, exportToXlsx } from '../services/downloadService';
import PageHeader from './PageHeader';
import FilterBar from './FilterBar';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' , minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const paymentMethods: Invoice['paymentMethod'][] = ['Efectivo', 'Tarjeta de Crédito/Débito', 'Nequi', 'Daviplata', 'Transferencia', 'PSE'];

interface SalespeopleDashboardProps {
    appState: AppDataState;
}

const SalespeopleDashboard: React.FC<SalespeopleDashboardProps> = ({ appState }) => {
    const [dateRange, setDateRange] = useState<DateRange>({ start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), end: new Date() });
    const { salespeople, invoices, users, config_user_profiles } = appState;

    const reportData = useMemo(() => {
        const sellerProfileIds = config_user_profiles
            .filter(p => p.name === 'Vendedor' || p.name === 'Facturador / Cajero')
            .map(p => p.id);

        const sellersAndCashiers = users.filter(u => sellerProfileIds.includes(u.profileId));

        const dataByUser = sellersAndCashiers.map(user => {
            const salespersonInfo = salespeople.find(sp => sp.id === user.id);
            const commissionRate = salespersonInfo?.commissionRate || 0;
            
            const userInvoices = invoices.filter(inv => {
                const issueDate = new Date(inv.issueDate);
                const startMatch = !dateRange.start || issueDate >= dateRange.start;
                const endMatch = !dateRange.end || issueDate <= dateRange.end;
                return inv.salespersonId === user.id && inv.status === 'pagada' && startMatch && endMatch;
            });
            
            const totalSales = userInvoices.reduce((sum, inv) => sum + inv.total, 0);
            
            const salesByPaymentMethod = paymentMethods.reduce((acc, method) => {
                acc[method] = userInvoices
                    .filter(inv => inv.paymentMethod === method)
                    .reduce((sum, inv) => sum + inv.total, 0);
                return acc;
            }, {} as Record<Invoice['paymentMethod'], number>);
            
            const commissionAmount = totalSales * (commissionRate / 100);

            return {
                id: user.id,
                name: user.name,
                totalSales,
                salesByPaymentMethod,
                commissionAmount,
            };
        }).sort((a,b) => b.totalSales - a.totalSales);
        
        return dataByUser;

    }, [salespeople, invoices, users, config_user_profiles, dateRange]);
    
    const handleExportPdf = () => {
        const columns = [
            { header: 'Vendedor', dataKey: 'name' },
            { header: 'Ventas Totales', dataKey: 'totalSales' },
            ...paymentMethods.map(m => ({ header: m, dataKey: m })),
            { header: 'Comisión Ganada', dataKey: 'commissionAmount' },
        ];
        const data = reportData.map(r => ({
            name: r.name,
            totalSales: formatCurrency(r.totalSales),
            ...paymentMethods.reduce((acc, m) => ({...acc, [m]: formatCurrency(r.salesByPaymentMethod[m])}), {}),
            commissionAmount: formatCurrency(r.commissionAmount)
        }));
        exportToPdf(columns, data, 'Informe de Rendimiento de Vendedores');
    };
    const handleExportXlsx = () => {
        const data = reportData.map(r => ({
            'Vendedor': r.name,
            'Ventas Totales': r.totalSales,
            ...paymentMethods.reduce((acc, m) => ({...acc, [m]: r.salesByPaymentMethod[m]}), {}),
            'Comisión Ganada': r.commissionAmount
        }));
        exportToXlsx(data, "rendimiento_vendedores.xlsx");
    };
    
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
                icon={<UserGroupIcon />}
                title="Dashboard de Vendedores"
                description="Analiza el rendimiento detallado y las comisiones de tu equipo de ventas."
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
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Vendedor</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">Total Ventas</th>
                                {paymentMethods.map(method => (
                                    <th key={method} className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">{method}</th>
                                ))}
                                <th className="px-6 py-3 text-xs font-medium text-green-600 dark:text-green-400 uppercase text-right">Comisión Ganada</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {reportData.map(sp => (
                                <tr key={sp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{sp.name}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(sp.totalSales)}</td>
                                    {paymentMethods.map(method => (
                                        <td key={method} className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{formatCurrency(sp.salesByPaymentMethod[method])}</td>
                                    ))}
                                    <td className="px-6 py-4 text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(sp.commissionAmount)}</td>
                                </tr>
                            ))}
                            {reportData.length === 0 && (
                                 <tr>
                                    <td colSpan={6 + paymentMethods.length} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        No hay ventas registradas para este período.
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
 
export default SalespeopleDashboard;