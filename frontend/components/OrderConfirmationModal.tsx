
import React from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

export const OrderConfirmationModal: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-8 m-4">
        <div className="flex justify-center mb-4">
            <CheckCircleIcon className="w-20 h-20 text-green-500" />
        </div>
        <h2 className="text-3xl font-display font-bold text-dark">¡Pedido Realizado!</h2>
        <p className="text-gray-600 mt-4">
            Gracias por tu compra. Ya estamos preparando tu pedido. Recibirás una confirmación por correo electrónico en breve.
        </p>
      </div>
    </div>
  );
};
