import React, { useMemo } from 'react';
import { AppDataState, CashSession, View, User } from '../types';
import { ComputerDesktopIcon, BackspaceIcon, UserPlusIcon, BanknotesIcon, DocumentTextIcon } from './Icons';
import PageHeader from './PageHeader';
import KPI_Card from './shared/KPI_Card';
import { formatCurrency } from '../utils/formatters';

interface CashierDashboardProps {
  appState: AppDataState;
  activeCashSession: CashSession | null;
  onNavigate: (view: View, payload?: any) => void;
  user: User;
}

const CashierDashboard: React.FC<CashierDashboardProps> = ({ appState, activeCashSession, onNavigate, user }) => {
  const sessionData = useMemo(() => {
    if (!activeCashSession) {
      return { sales: 0, transactions: 0, recentInvoices: [] };
    }
    const sessionInvoices = appState.invoices
      .filter(i => i.cashSessionId === activeCashSession.id && i.status === 'pagada')
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
      
    const sales = sessionInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const transactions = sessionInvoices.length;
    return { sales, transactions, recentInvoices: sessionInvoices.slice(0, 5) };
  }, [appState.invoices, activeCashSession]);

  if (!activeCashSession) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold">No hay una sesión de caja activa.</h2>
        <p className="mt-2 text-slate-500">Por favor, ve a "Gestión de Caja" para abrir una nueva sesión y empezar a vender.</p>
        <button
          onClick={() => onNavigate('cash_drawer_closing')}
          className="mt-6 flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-md"
        >
          <BackspaceIcon className="h-5 w-5" />
          Ir a Gestión de Caja
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      <PageHeader
        icon={<ComputerDesktopIcon />}
        title={`Dashboard de Cajero - ${user.name}`}
        description={`Resumen de tu sesión actual. Base inicial: ${formatCurrency(activeCashSession.openingBalance)}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPI_Card title="Ventas de la Sesión" value={formatCurrency(sessionData.sales)} icon={<BanknotesIcon className="h-6 w-6 text-primary-500" />} />
        <KPI_Card title="Transacciones" value={sessionData.transactions.toString()} icon={<DocumentTextIcon className="h-6 w-6 text-accent-500" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button onClick={() => onNavigate('pos_view')} className="p-8 bg-primary-600 text-white rounded-2xl shadow-lg hover:bg-primary-700 transition-all duration-300 transform hover:-translate-y-1 text-center">
              <ComputerDesktopIcon className="h-12 w-12 mx-auto mb-4" />
              <span className="text-2xl font-bold">Abrir Punto de Venta (POS)</span>
          </button>
           <button onClick={() => onNavigate('cash_drawer_closing')} className="p-8 bg-slate-700 text-white rounded-2xl shadow-lg hover:bg-slate-800 transition-all duration-300 transform hover:-translate-y-1 text-center">
              <BackspaceIcon className="h-12 w-12 mx-auto mb-4" />
              <span className="text-2xl font-bold">Gestión de Caja</span>
          </button>
          <button onClick={() => onNavigate('crm_contacts', { action: 'create' })} className="p-8 bg-accent-600 text-white rounded-2xl shadow-lg hover:bg-accent-700 transition-all duration-300 transform hover:-translate-y-1 text-center">
              <UserPlusIcon className="h-12 w-12 mx-auto mb-4" />
              <span className="text-2xl font-bold">Nuevo Cliente</span>
          </button>
      </div>

       <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg">
          <h3 className="p-4 text-lg font-bold border-b dark:border-neutral-800">Últimas Transacciones de la Sesión</h3>
          <ul className="divide-y dark:divide-neutral-800">
            {sessionData.recentInvoices.length > 0 ? (
              sessionData.recentInvoices.map(inv => (
                <li key={inv.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{inv.customerName}</p>
                    <p className="text-sm text-slate-500">{inv.id}</p>
                  </div>
                  <span className="font-semibold text-lg">{formatCurrency(inv.total)}</span>
                </li>
              ))
            ) : (
              <p className="p-4 text-center text-slate-500">No hay transacciones en esta sesión todavía.</p>
            )}
          </ul>
      </div>
    </div>
  );
};
export default CashierDashboard;
