
import React from 'react';
import { MenuItem } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onCustomizeClick: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onCustomizeClick }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 flex flex-col">
      <div className="h-48 overflow-hidden">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-display font-bold text-dark">{item.name}</h3>
        <p className="mt-2 text-gray-600 text-sm flex-grow">{item.description}</p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-2xl font-bold font-display text-primary">{item.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span>
          <button
            onClick={() => onCustomizeClick(item)}
            className="bg-accent text-white font-semibold py-2 px-4 rounded-full hover:bg-teal-500 transition-colors"
          >
            {item.customizableOptions ? 'Personalizar' : 'Añadir'}
          </button>
        </div>
      </div>
    </div>
  );
};