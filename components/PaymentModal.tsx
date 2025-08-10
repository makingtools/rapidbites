import React, { useState, useMemo } from 'react';
import { Invoice } from '../types';
import Modal from './Modal';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

const paymentMethods: { method: Invoice['paymentMethod']; label: string; description: string }[] = [
    { method: 'Efectivo', label: 'Efectivo', description: 'El cliente paga con dinero en efectivo en la caja.' },
    { method: 'Tarjeta de Crédito/Débito', label: 'Tarjeta Crédito/Débito', description: 'Visa, Mastercard, Amex, etc. a través de datáfono.' },
    { method: 'Nequi', label: 'Nequi', description: 'Transferencia desde la billetera digital Nequi.' },
    { method: 'Daviplata', label: 'Daviplata', description: 'Transferencia desde la billetera digital Daviplata.' },
    { method: 'PSE', label: 'PSE (Transferencia)', description: 'Pago desde cuenta bancaria. Requiere app del banco.' },
    { method: 'Contra Entrega', label: 'Contra Entrega', description: 'El cliente paga al momento de recibir el producto.' },
    { method: 'Punto de Pago', label: 'Punto de Pago', description: 'Efecty, Baloto, etc. Se genera código para pagar.' },
];


interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    totalAmount: number;
    onPaymentSuccess: (paymentMethod: Invoice['paymentMethod']) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, totalAmount, onPaymentSuccess }) => {
    const [paymentMethod, setPaymentMethod] = useState<Invoice['paymentMethod']>('Efectivo');
    const [amountReceived, setAmountReceived] = useState<number | null>(null);
    
    const change = useMemo(() => {
        if (paymentMethod === 'Efectivo' && amountReceived !== null) {
            return amountReceived - totalAmount;
        }
        return null;
    }, [amountReceived, totalAmount, paymentMethod]);

    const quickCashOptions = useMemo(() => {
        const options = new Set<number>();
        const denominations = [5000, 10000, 20000, 50000, 100000, 200000];
        
        // Add exact amount
        options.add(totalAmount);

        // Find next highest denomination
        const nextDenomination = denominations.find(d => d >= totalAmount);
        if (nextDenomination) {
            options.add(nextDenomination);
        }

        // Add next sensible round number
        if (totalAmount > 1000) {
            const nextThousand = Math.ceil(totalAmount / 1000) * 1000;
             if (nextThousand !== totalAmount) options.add(nextThousand);
        }
        if (totalAmount > 10000) {
             const nextTenThousand = Math.ceil(totalAmount / 10000) * 10000;
             if (nextTenThousand !== totalAmount) options.add(nextTenThousand);
        }

        return Array.from(options).sort((a,b) => a-b).slice(0, 4);

    }, [totalAmount]);

    const handleConfirmPayment = () => {
        onPaymentSuccess(paymentMethod);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Proceso de Pago">
            <div className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
                <div className="text-center p-4 bg-slate-100 dark:bg-neutral-800 rounded-lg">
                    <p className="text-sm text-slate-500 dark:text-neutral-400">Total a Pagar</p>
                    <p className="text-4xl font-extrabold text-primary-600 dark:text-primary-400">{formatCurrency(totalAmount)}</p>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-2">Método de Pago</label>
                    <div className="grid grid-cols-2 gap-3">
                        {paymentMethods.map(({ method, label, description }) => (
                            <button
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={`p-3 rounded-lg border-2 text-left font-semibold transition flex flex-col justify-between h-24 ${paymentMethod === method ? 'bg-primary-600 border-primary-600 text-white' : 'bg-slate-100 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 hover:border-primary-400'}`}
                            >
                                <span>{label}</span>
                                <p className={`text-xs font-normal mt-1 ${paymentMethod === method ? 'text-white/80' : 'text-slate-500 dark:text-neutral-400'}`}>{description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {paymentMethod === 'Efectivo' && (
                    <div className="space-y-4 animate-fade-in">
                         <div>
                            <label htmlFor="amountReceived" className="block text-sm font-medium text-slate-700 dark:text-neutral-300">Efectivo Recibido</label>
                            <input 
                                type="number"
                                id="amountReceived"
                                value={amountReceived || ''}
                                onChange={e => setAmountReceived(parseFloat(e.target.value))}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-slate-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 text-lg text-right"
                                placeholder="0"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {quickCashOptions.map(amount => (
                                <button key={amount} onClick={() => setAmountReceived(amount)} className="p-2 bg-slate-200 dark:bg-neutral-700 rounded-md text-sm hover:bg-slate-300 dark:hover:bg-neutral-600 font-semibold">
                                    {amount === totalAmount ? 'Exacto' : formatCurrency(amount)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {change !== null && change >= 0 && (
                     <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg animate-fade-in">
                        <p className="text-sm text-blue-600 dark:text-blue-300">Cambio a Devolver</p>
                        <p className="text-3xl font-bold text-blue-700 dark:text-blue-200">{formatCurrency(change)}</p>
                    </div>
                )}
                 {change !== null && change < 0 && (
                     <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg animate-fade-in">
                        <p className="text-sm text-red-600 dark:text-red-300">Faltante</p>
                        <p className="text-3xl font-bold text-red-700 dark:text-red-200">{formatCurrency(Math.abs(change))}</p>
                    </div>
                )}

                <button 
                    onClick={handleConfirmPayment}
                    disabled={(paymentMethod === 'Efectivo' && (change === null || change < 0))}
                    className="w-full mt-4 py-3 bg-green-600 text-white font-bold text-lg rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                    Confirmar Pago
                </button>
            </div>
        </Modal>
    );
};

export default PaymentModal;