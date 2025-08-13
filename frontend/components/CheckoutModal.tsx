
import React, { useState, useMemo } from 'react';
import { CartItem } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { WalletIcon } from './icons/WalletIcon';
import { CashIcon } from './icons/CashIcon';
import { CheckoutDetails } from '../PublicApp';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onPlaceOrder: (details: CheckoutDetails) => void;
}

type PaymentMethod = 'card' | 'wallet' | 'cash' | 'paypal';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, items, onPlaceOrder }) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [tipPercentage, setTipPercentage] = useState<number | null>(0.15); // Default to 15%
  const [customTip, setCustomTip] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.totalPrice, 0), [items]);
  
  const tipAmount = useMemo(() => {
    if (tipPercentage !== null) {
      return subtotal * tipPercentage;
    }
    const custom = parseFloat(customTip);
    return isNaN(custom) ? 0 : custom;
  }, [subtotal, tipPercentage, customTip]);
  
  const total = useMemo(() => subtotal + tipAmount, [subtotal, tipAmount]);

  const handleSelectTip = (perc: number | null) => {
    setTipPercentage(perc);
    if (perc !== null) {
      setCustomTip('');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const details: CheckoutDetails = {
      name,
      address,
      phone,
      paymentMethod,
      tip: tipAmount,
    };
    onPlaceOrder(details);
  };

  if (!isOpen) return null;

  const PaymentOption: React.FC<{
    method: PaymentMethod,
    label: string,
    children: React.ReactNode,
    icon: React.ReactNode
  }> = ({ method, label, children, icon }) => (
    <div 
        className={`border rounded-lg transition-all ${paymentMethod === method ? 'border-primary ring-2 ring-primary' : 'border-gray-300'}`}
    >
        <label 
            className="flex items-center p-4 cursor-pointer"
            onClick={() => setPaymentMethod(method)}
        >
            <input type="radio" name="paymentMethod" value={method} checked={paymentMethod === method} className="h-5 w-5 text-primary focus:ring-accent" onChange={() => {}}/>
            <div className="ml-4 flex items-center gap-3">
                {icon}
                <span className="font-semibold text-dark">{label}</span>
            </div>
        </label>
        {paymentMethod === method && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                {children}
            </div>
        )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-2xl font-display font-bold text-dark">Finalizar Compra</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>
        <form onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Details & Payment */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-dark mb-4">Detalles de Entrega</h3>
                <div className="space-y-4">
                  <input type="text" placeholder="Nombre Completo" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent" required />
                  <input type="text" placeholder="Dirección de Entrega" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent" required />
                  <input type="tel" placeholder="Número de Teléfono" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent" required />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-dark mb-4">Método de Pago</h3>
                <div className="space-y-3">
                  <PaymentOption method="card" label="Tarjeta Crédito/Débito" icon={<CreditCardIcon className="w-6 h-6 text-gray-600"/>}>
                    <div className="space-y-3">
                      <input type="text" placeholder="Número de Tarjeta" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent" />
                      <div className="flex gap-3">
                        <input type="text" placeholder="MM/AA" className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent" />
                        <input type="text" placeholder="CVC" className="w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <LockClosedIcon className="w-4 h-4"/>
                        <span>Tus datos están seguros y encriptados.</span>
                      </div>
                    </div>
                  </PaymentOption>
                  <PaymentOption method="wallet" label="Nequi / DaviPlata" icon={<WalletIcon className="w-6 h-6 text-gray-600"/>}>
                    <p className="text-sm text-gray-600">Serás redirigido a la plataforma de pago para completar tu transacción de forma segura.</p>
                  </PaymentOption>
                   <PaymentOption method="cash" label="Efectivo (Contraentrega)" icon={<CashIcon className="w-6 h-6 text-gray-600"/>}>
                     <p className="text-sm text-gray-600">Paga en efectivo al repartidor cuando recibas tu pedido.</p>
                  </PaymentOption>
                   <PaymentOption method="paypal" label="PayPal" icon={<CreditCardIcon className="w-6 h-6 text-gray-600"/>}>
                     <p className="text-sm text-gray-600">Serás redirigido a PayPal para completar tu compra de forma segura.</p>
                  </PaymentOption>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="bg-gray-50 p-6 rounded-lg h-fit sticky top-0">
              <h3 className="text-xl font-bold text-dark mb-4">Resumen del Pedido</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-start">
                    <span className="font-semibold pr-2">{item.quantity} x {item.menuItem.name}</span>
                    <span className="font-medium whitespace-nowrap">{item.totalPrice.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span>
                  </div>
                ))}
              </div>
              <div className="border-t my-4"></div>
              <div>
                <h4 className="font-semibold mb-3">Añadir Propina</h4>
                <div className="flex gap-2">
                    {[0.10, 0.15, 0.20].map(p => (
                        <button key={p} type="button" onClick={() => handleSelectTip(p)} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${tipPercentage === p ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
                            {(p * 100).toFixed(0)}%
                        </button>
                    ))}
                    <button type="button" onClick={() => handleSelectTip(null)} className={`py-2 px-4 text-sm font-semibold rounded-lg transition-colors ${tipPercentage === null ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
                        Otro
                    </button>
                </div>
                {tipPercentage === null && (
                    <input type="number" value={customTip} onChange={e => setCustomTip(e.target.value)} placeholder="Monto personalizado" className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent" />
                )}
              </div>
              <div className="border-t my-4"></div>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{subtotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                <div className="flex justify-between text-gray-600"><span>Propina</span><span>{tipAmount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span></div>
                <div className="flex justify-between font-bold text-xl text-dark pt-2 border-t mt-2">
                  <span>Total</span><span>{total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50 border-t sticky bottom-0 rounded-b-2xl">
            <button
              type="submit"
              className="w-full bg-primary text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-red-500 transition-all transform hover:scale-105"
            >
              Realizar Pedido por {total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};