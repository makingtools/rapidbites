
import React from 'react';
import { CartItem, CustomizationOptionChoice } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateCart: (items: CartItem[]) => void;
  onCheckout: () => void;
}

export const Cart: React.FC<CartProps> = ({ isOpen, onClose, items, onUpdateCart, onCheckout }) => {
  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const basePrice = item.totalPrice / item.quantity;
        return { ...item, quantity: newQuantity, totalPrice: basePrice * newQuantity };
      }
      return item;
    });
    onUpdateCart(updatedItems.filter(item => item.quantity > 0));
  };
  
  const handleRemoveItem = (id: string) => {
     onUpdateCart(items.filter(item => item.id !== id));
  };

  return (
    <div className={`fixed inset-0 z-50 transition-transform transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className={`relative w-full max-w-md ml-auto h-full bg-light flex flex-col shadow-2xl transition-all duration-300 ${isOpen ? '' : 'translate-x-full'}`}>
        <div className="p-4 border-b flex justify-between items-center bg-white">
          <h2 className="text-2xl font-display font-bold text-dark">Tu Pedido ({totalItems})</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>
        
        {items.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
            <img src="https://images.unsplash.com/photo-1577741314755-325d502129b6?q=80&w=200&h=200&auto=format&fit=crop" alt="Carrito vacío" className="w-40 h-40 opacity-50 rounded-full" />
            <h3 className="text-xl font-bold mt-4">Tu carrito está vacío</h3>
            <p className="text-gray-500 mt-2">Añade algunos platos deliciosos para empezar.</p>
            <button onClick={onClose} className="mt-6 bg-primary text-white font-bold py-2 px-6 rounded-full">
              Ver Menú
            </button>
          </div>
        ) : (
          <>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-4 bg-white p-3 rounded-lg shadow-sm">
                  <img src={item.menuItem.image} alt={item.menuItem.name} className="w-20 h-20 object-cover rounded-md" />
                  <div className="flex-grow">
                    <h4 className="font-bold">{item.menuItem.name}</h4>
                    <div className="text-xs text-gray-500">
                        {Object.values(item.customizations).map((c) => c.name).join(', ')}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)} className="bg-gray-200 h-6 w-6 rounded-full font-bold text-sm">-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)} className="bg-gray-200 h-6 w-6 rounded-full font-bold text-sm">+</button>
                      </div>
                      <span className="font-bold text-dark">{item.totalPrice.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                   <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-500 self-start">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t bg-white rounded-t-lg">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{subtotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Impuestos y Tasas</span>
                  <span>Calculado al pagar</span>
                </div>
                <div className="flex justify-between font-bold text-xl border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>{subtotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span>
                </div>
              </div>
              <button 
                onClick={onCheckout}
                className="w-full bg-primary text-white font-bold py-3 rounded-full text-lg hover:bg-red-500 transition-all"
              >
                Ir a Pagar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};