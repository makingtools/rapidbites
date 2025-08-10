import React, { useState, useMemo } from 'react';
import { AppDataState, CashSession, CashClosing, Invoice } from '../types';
import { CalculatorIcon, EyeIcon } from './Icons';
import PageHeader from './PageHeader';
import Modal from './Modal';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

const DifferenceRow: React.FC<{ label: string, system: number, counted: number }> = ({ label, system, counted }) => {
    const difference = counted - system;
    let colorClass = 'text-gray-800 dark:text-gray-200';
    if (difference > 0) colorClass = 'text-green-600 dark:text-green-400';
    if (difference < 0) colorClass = 'text-red-600 dark:text-red-400';

    return (
        <tr className="border-b dark:border-gray-700">
            <td className="py-2 font-semibold">{label}</td>
            <td className="py-2 text-right">{formatCurrency(system)}</td>
            <td className="py-2 text-right">{formatCurrency(counted)}</td>
            <td className={`py-2 text-right font-bold ${colorClass}`}>{formatCurrency(difference)}</td>
        </tr>
    );
};


const SessionDetailsModal: React.FC<{ session: CashClosing, invoices: Invoice[], user: {name: string}, onClose: () => void }> = ({ session, invoices, user, onClose }) => {
    
    const totals = useMemo(() => {
        const getSystemTotal = (method: Invoice['paymentMethod']) => invoices.filter(i => i.paymentMethod === method).reduce((s, i) => s + i.total, 0);
        
        const system = {
            cash: getSystemTotal('Efectivo'),
            card: getSystemTotal('Tarjeta de Crédito/Débito'),
            transfer: getSystemTotal('Transferencia'),
            other: invoices.filter(i => !['Efectivo', 'Tarjeta de Crédito/Débito', 'Transferencia'].includes(i.paymentMethod)).reduce((s, i) => s + i.total, 0)
        };
        
        const counted = {
            cash: session.countedCash - session.openingBalance,
            card: session.countedCard,
            transfer: session.countedTransfer,
            other: session.countedOther,
        };

        return { system, counted };

    }, [invoices, session]);
    
    return (
        <Modal isOpen={true} onClose={onClose} title={`Detalle de Sesión - ${session.cashSessionId}`} size="5xl">
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-500">Usuario</p>
                        <p className="font-bold">{user.name}</p>
                    </div>
                     <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-500">Apertura</p>
                        <p className="font-bold text-xs">{new Date(session.openingDate).toLocaleString('es-CO')}</p>
                    </div>
                     <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-500">Cierre</p>
                        <p className="font-bold text-xs">{new Date(session.closingDate).toLocaleString('es-CO')}</p>
                    </div>
                     <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-500">Base Inicial</p>
                        <p className="font-bold">{formatCurrency(session.openingBalance)}</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-2">Desglose de Arqueo</h3>
                    <table className="w-full text-sm">
                        <thead className="border-b-2 dark:border-gray-600">
                            <tr>
                                <th className="py-2 text-left">Método de Pago</th>
                                <th className="py-2 text-right">Valor Sistema</th>
                                <th className="py-2 text-right">Valor Contado</th>
                                <th className="py-2 text-right">Diferencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            <DifferenceRow label="Efectivo" system={totals.system.cash} counted={totals.counted.cash} />
                            <DifferenceRow label="Tarjeta" system={totals.system.card} counted={totals.counted.card} />
                            <DifferenceRow label="Transferencia" system={totals.system.transfer} counted={totals.counted.transfer} />
                             <DifferenceRow label="Otros Métodos" system={totals.system.other} counted={totals.counted.other} />
                        </tbody>
                        <tfoot className="border-t-2 dark:border-gray-600 font-bold">
                             <tr>
                                <td className="py-2">TOTAL VENTAS</td>
                                <td className="py-2 text-right">{formatCurrency(session.totalSystemSales)}</td>
                                <td className="py-2 text-right">{formatCurrency(session.totalCountedSales)}</td>
                                <td className="py-2 text-right">{formatCurrency(session.totalDifference)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

            </div>
        </Modal>
    );
};

interface CashDrawerClosingProps {
    appState: AppDataState;
    activeCashSession: CashSession | null;
    onOpenSession: (openingBalance: number) => void;
    onCloseSession: (closing: Omit<CashClosing, 'id'|'closingDate'|'cashSessionId'|'openingDate'|'userId'>) => void;
}

const CashDrawerClosing: React.FC<CashDrawerClosingProps> = ({ appState, activeCashSession, onOpenSession, onCloseSession }) => {
    const [openingBalance, setOpeningBalance] = useState(0);
    const [countedCash, setCountedCash] = useState(0);
    const [countedCard, setCountedCard] = useState(0);
    const [countedTransfer, setCountedTransfer] = useState(0);
    const [countedOther, setCountedOther] = useState(0);

    const [selectedSession, setSelectedSession] = useState<CashClosing | null>(null);

    const sessionInvoices = useMemo(() => {
        if (!activeCashSession) return [];
        return appState.invoices.filter(inv => inv.cashSessionId === activeCashSession.id && inv.status === 'pagada');
    }, [activeCashSession, appState.invoices]);

    const systemTotals = useMemo(() => {
        const getExpected = (method: Invoice['paymentMethod']) => sessionInvoices.filter(i => i.paymentMethod === method).reduce((s, i) => s + i.total, 0);
        
        const expectedCash = getExpected('Efectivo') + (activeCashSession?.openingBalance || 0);
        const expectedCard = getExpected('Tarjeta de Crédito/Débito');
        const expectedTransfer = getExpected('Transferencia');
        const expectedOther = sessionInvoices.filter(inv => !['Efectivo', 'Tarjeta de Crédito/Débito', 'Transferencia'].includes(inv.paymentMethod)).reduce((s, i) => s + i.total, 0);

        return { expectedCash, expectedCard, expectedTransfer, expectedOther };
    }, [sessionInvoices, activeCashSession]);

    const handleOpen = () => onOpenSession(openingBalance);
    
    const handleClose = () => {
        if (!activeCashSession) return;
        
        const totalSystemSales = (systemTotals.expectedCash - activeCashSession.openingBalance) + systemTotals.expectedCard + systemTotals.expectedTransfer + systemTotals.expectedOther;
        const totalCountedSales = (countedCash - activeCashSession.openingBalance) + countedCard + countedTransfer + countedOther;
        
        const closingData = {
            openingBalance: activeCashSession.openingBalance,
            expectedCash: systemTotals.expectedCash, countedCash, cashDifference: countedCash - systemTotals.expectedCash,
            expectedCard: systemTotals.expectedCard, countedCard, cardDifference: countedCard - systemTotals.expectedCard,
            expectedTransfer: systemTotals.expectedTransfer, countedTransfer, transferDifference: countedTransfer - systemTotals.expectedTransfer,
            expectedOther: systemTotals.expectedOther, countedOther, otherDifference: countedOther - systemTotals.expectedOther,
            totalSystemSales, totalCountedSales, totalDifference: totalCountedSales - totalSystemSales,
        };
        onCloseSession(closingData);
    };

    const sessionHistory = [...appState.cashClosings].sort((a,b)=> new Date(b.closingDate).getTime() - new Date(a.closingDate).getTime());

    return (
         <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
             <PageHeader
                icon={<CalculatorIcon />}
                title="Centro de Control de Cajas"
                description="Supervisa todas las sesiones de caja, realiza cierres y consulta el historial."
            />
            
            {!activeCashSession ? (
                <div className="max-w-xl mx-auto bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-lg text-center">
                    <h2 className="text-xl font-bold mb-4">Abrir Nueva Sesión de Caja</h2>
                    <p className="text-sm text-slate-500 mb-4">Ingresa el monto de la base (efectivo inicial) para empezar a vender.</p>
                    <div className="flex items-center gap-4">
                        <input type="number" placeholder="Base de la caja" value={openingBalance} onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)} className="w-full text-center text-xl p-3 border rounded-lg bg-slate-50 dark:bg-neutral-800"/>
                        <button onClick={handleOpen} className="px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition">Abrir Caja</button>
                    </div>
                </div>
            ) : (
                 <div className="max-w-4xl mx-auto bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-slate-100 dark:bg-neutral-800 rounded-lg"><p className="text-sm text-slate-500">Sesión iniciada el</p><p className="font-bold">{new Date(activeCashSession.openingDate).toLocaleString('es-CO')}</p></div>
                        <div className="p-4 bg-slate-100 dark:bg-neutral-800 rounded-lg"><p className="text-sm text-slate-500">Base Inicial</p><p className="font-bold">{formatCurrency(activeCashSession.openingBalance)}</p></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 p-4 border rounded-lg"><h3 className="font-bold text-lg">Totales del Sistema</h3>
                             <div className="flex justify-between"><span className="text-slate-500">Efectivo Esperado:</span><span className="font-semibold">{formatCurrency(systemTotals.expectedCash)}</span></div>
                             <div className="flex justify-between"><span className="text-slate-500">Tarjeta Esperada:</span><span className="font-semibold">{formatCurrency(systemTotals.expectedCard)}</span></div>
                             <div className="flex justify-between"><span className="text-slate-500">Transfer. Esperada:</span><span className="font-semibold">{formatCurrency(systemTotals.expectedTransfer)}</span></div>
                             <div className="flex justify-between"><span className="text-slate-500">Otros Esperado:</span><span className="font-semibold">{formatCurrency(systemTotals.expectedOther)}</span></div>
                        </div>
                         <div className="space-y-4 p-4 border rounded-lg"><h3 className="font-bold text-lg">Arqueo Manual</h3>
                             <div><label className="block text-sm text-slate-500">Efectivo Contado:</label><input type="number" value={countedCash} onChange={e => setCountedCash(parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded bg-white dark:bg-neutral-800"/></div>
                             <div><label className="block text-sm text-slate-500">Total Tarjeta:</label><input type="number" value={countedCard} onChange={e => setCountedCard(parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded bg-white dark:bg-neutral-800"/></div>
                             <div><label className="block text-sm text-slate-500">Total Transfer.:</label><input type="number" value={countedTransfer} onChange={e => setCountedTransfer(parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded bg-white dark:bg-neutral-800"/></div>
                             <div><label className="block text-sm text-slate-500">Total Otros:</label><input type="number" value={countedOther} onChange={e => setCountedOther(parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded bg-white dark:bg-neutral-800"/></div>
                         </div>
                    </div>
                    <button onClick={handleClose} className="w-full py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition">Confirmar y Cerrar Caja</button>
                 </div>
            )}

             <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Historial de Sesiones Cerradas</h2>
                <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-neutral-800/50">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Fecha Cierre</th>
                                    <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Usuario</th>
                                    <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-300 uppercase text-right">Base</th>
                                    <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-300 uppercase text-right">Ventas Sistema</th>
                                    <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-300 uppercase text-right">Diferencia</th>
                                    <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-300 uppercase text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
                                {sessionHistory.map(session => (
                                    <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/40">
                                        <td className="px-6 py-4">{new Date(session.closingDate).toLocaleString('es-CO')}</td>
                                        <td className="px-6 py-4">{appState.users.find(u => u.id === session.userId)?.name}</td>
                                        <td className="px-6 py-4 text-right">{formatCurrency(session.openingBalance)}</td>
                                        <td className="px-6 py-4 text-right">{formatCurrency(session.totalSystemSales)}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${session.totalDifference === 0 ? '' : session.totalDifference > 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(session.totalDifference)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => setSelectedSession(session)} className="p-1 text-primary-600 dark:text-primary-400 hover:underline">
                                                <EyeIcon className="h-5 w-5 mx-auto"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            {selectedSession && (
                <SessionDetailsModal 
                    session={selectedSession} 
                    invoices={appState.invoices.filter(i => i.cashSessionId === selectedSession.cashSessionId)}
                    user={appState.users.find(u => u.id === selectedSession.userId)!}
                    onClose={() => setSelectedSession(null)}
                />
            )}
        </div>
    )
};

export default CashDrawerClosing;