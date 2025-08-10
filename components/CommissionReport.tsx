import React, { useState, useMemo } from 'react';
import { AppDataState, User, DateRange } from '../types';
import { CurrencyDollarIcon, DocumentDownloadIcon } from './Icons';
import { exportToPdf, exportToXlsx } from '../services/downloadService';
import PageHeader from './PageHeader';
import FilterBar from './FilterBar';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

interface CommissionReportProps {
    appState: AppDataState;
    user: User;
}

const CommissionReport: React.FC<CommissionReportProps> = ({ appState, user }) => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [dateRange, setDateRange] = useState<DateRange>({
        start: firstDayOfMonth,
        end: today,
    });
    
    const userProfile = appState.config_user_profiles.find(p => p.id === user.profileId);
    const isSalesperson = userProfile?.name === 'Vendedor';
    const [selectedSalesperson, setSelectedSalesperson] = useState<string>(isSalesperson ? user.id : 'all');


    const reportData = useMemo(() => {
        const startDate = dateRange.start || new Date(0);
        const endDate = dateRange.end || new Date();
        endDate.setHours(23, 59, 59, 999);
        
        const sellerAndCashierProfileIds = appState.config_user_profiles
            .filter(p => p.name === 'Vendedor' || p.name === 'Facturador / Cajero')
            .map(p => p.id);
        const salespeopleAndCashiers = appState.users.filter(u => sellerAndCashierProfileIds.includes(u.profileId));


        const peopleToProcess = isSalesperson 
            ? salespeopleAndCashiers.filter(u => u.id === user.id)
            : selectedSalesperson === 'all' 
                ? salespeopleAndCashiers
                : salespeopleAndCashiers.filter(u => u.id === selectedSalesperson);

        const commissionData = peopleToProcess.map(u => {
            const salespersonInfo = appState.salespeople.find(s => s.id === u.id);
            const commissionRate = salespersonInfo?.commissionRate || 0;

            const salespersonInvoices = appState.invoices.filter(i => {
                const issueDate = new Date(i.issueDate);
                return i.salespersonId === u.id &&
                       i.status === 'pagada' &&
                       issueDate >= startDate &&
                       issueDate <= endDate;
            });
            
            const totalSales = salespersonInvoices.reduce((sum, i) => sum + i.total, 0);
            const commissionAmount = totalSales * (commissionRate / 100);

            return {
                salespersonId: u.id,
                salespersonName: u.name,
                totalSales,
                commissionRate,
                commissionAmount,
                invoiceCount: salespersonInvoices.length,
            };
        }).filter(d => d.totalSales > 0);

        const totalCommissions = commissionData.reduce((sum, d) => sum + d.commissionAmount, 0);

        return { commissionData, totalCommissions };

    }, [appState, dateRange, selectedSalesperson, user, isSalesperson]);

     const handleExportPdf = () => {
        const docTitle = `Informe de Comisiones - ${dateRange.start?.toLocaleDateString()} a ${dateRange.end?.toLocaleDateString()}`;
        exportToPdf(
            [{ header: 'Vendedor', dataKey: 'salespersonName' }, { header: 'Ventas Totales', dataKey: 'totalSales' }, { header: 'Tasa', dataKey: 'commissionRate' }, {header: 'Comisión', dataKey: 'commissionAmount'}],
            reportData.commissionData.map(d => ({ ...d, totalSales: formatCurrency(d.totalSales), commissionRate: `${d.commissionRate}%`, commissionAmount: formatCurrency(d.commissionAmount) })),
            docTitle
        );
    };

    const handleExportXlsx = () => {
        exportToXlsx(reportData.commissionData, `informe_comisiones_${dateRange.start?.toLocaleDateString()}_${dateRange.end?.toLocaleDateString()}.xlsx`);
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

    const extraFilters = !isSalesperson ? (
        <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar:</label>
            <select value={selectedSalesperson} onChange={e => setSelectedSalesperson(e.target.value)} className="w-full sm:w-auto py-2 px-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="all">Todos</option>
                {appState.users
                    .filter(u => {
                        const profile = appState.config_user_profiles.find(p => p.id === u.profileId);
                        return profile?.name === 'Vendedor' || profile?.name === 'Facturador / Cajero';
                    })
                    .map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                ))}
            </select>
        </div>
    ) : null;

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
             <PageHeader
                icon={<CurrencyDollarIcon />}
                title="Informe de Comisiones"
                description="Calcula y visualiza las comisiones generadas por tu equipo de ventas."
                actions={actions}
            />

            <FilterBar
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                extraFilters={extraFilters}
            />
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-6">
                <h3 className="text-gray-500 dark:text-gray-400">Total Comisiones a Pagar</h3>
                <p className="text-4xl font-extrabold text-primary-600 dark:text-primary-400 mt-1">{formatCurrency(reportData.totalCommissions)}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Vendedor / Cajero</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">Total Ventas</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">Tasa Comisión</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">Comisión Generada</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                             {reportData.commissionData.map(data => (
                                <tr key={data.salespersonId} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{data.salespersonName}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(data.totalSales)}</td>
                                    <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{data.commissionRate}%</td>
                                    <td className="px-6 py-4 text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(data.commissionAmount)}</td>
                                </tr>
                            ))}
                            {reportData.commissionData.length === 0 && (
                                <tr><td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400">No hay comisiones generadas para el período o vendedor seleccionado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CommissionReport;