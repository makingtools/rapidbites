import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, CustomizationType, CustomizationOptionChoice } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';

interface MenuItemModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, customizations: Record<string, CustomizationOptionChoice>, totalPrice: number) => void;
}

export const MenuItemModal: React.FC<MenuItemModalProps> = ({ item, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<Record<string, CustomizationOptionChoice | CustomizationOptionChoice[]>>({});

  useEffect(() => {
    const initialCustomizations: Record<string, CustomizationOptionChoice | CustomizationOptionChoice[]> = {};
    item.customizableOptions?.forEach(option => {
      if (option.type === CustomizationType.RADIO && option.options.length > 0) {
        initialCustomizations[option.title] = option.options[0];
      } else {
        initialCustomizations[option.title] = [];
      }
    });
    setSelectedCustomizations(initialCustomizations);
  }, [item]);
  
  const totalPrice = useMemo(() => {
    let customPrice = 0;
    for (const value of Object.values(selectedCustomizations)) {
      if (Array.isArray(value)) {
        // value is CustomizationOptionChoice[]
        customPrice += value.reduce((acc, curr) => acc + curr.priceModifier, 0);
      } else if (value) {
        // value is CustomizationOptionChoice
        customPrice += value.priceModifier;
      }
    }
    return (item.price + customPrice) * quantity;
  }, [item.price, quantity, selectedCustomizations]);

  const handleCustomizationChange = (optionTitle: string, choice: CustomizationOptionChoice, type: CustomizationType) => {
    setSelectedCustomizations(prev => {
      const newCustomizations = { ...prev };
      if (type === CustomizationType.RADIO) {
        newCustomizations[optionTitle] = choice;
      } else {
        const currentSelection = (newCustomizations[optionTitle] as CustomizationOptionChoice[]) || [];
        const isSelected = currentSelection.some(c => c.name === choice.name);
        if (isSelected) {
          newCustomizations[optionTitle] = currentSelection.filter(c => c.name !== choice.name);
        } else {
          newCustomizations[optionTitle] = [...currentSelection, choice];
        }
      }
      return newCustomizations;
    });
  };

  const handleFinalAddToCart = () => {
    const flatCustomizations: Record<string, CustomizationOptionChoice> = {};
    for (const [title, value] of Object.entries(selectedCustomizations)) {
      if (Array.isArray(value)) {
        value.forEach(v => {
          flatCustomizations[`${title}-${v.name}`] = v;
        });
      } else if (value) {
        flatCustomizations[title] = value;
      }
    }
    onAddToCart(item, quantity, flatCustomizations, totalPrice);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-display font-bold text-dark">Personaliza tu pedido</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <img src={item.image} alt={item.name} className="w-full md:w-1/3 h-48 object-cover rounded-lg" />
            <div>
              <h3 className="text-3xl font-bold font-display text-primary">{item.name}</h3>
              <p className="text-gray-600 mt-2">{item.description}</p>
            </div>
          </div>
          <div className="mt-6 space-y-6">
            {item.customizableOptions?.map(option => (
              <div key={option.title}>
                <h4 className="text-lg font-bold text-dark border-b pb-2 mb-3">{option.title}</h4>
                <div className="space-y-2">
                  {option.options.map(choice => (
                    <label key={choice.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type={option.type}
                          name={option.title}
                          onChange={() => handleCustomizationChange(option.title, choice, option.type)}
                          checked={option.type === 'radio' ? (selectedCustomizations[option.title] as CustomizationOptionChoice)?.name === choice.name : ((selectedCustomizations[option.title] as CustomizationOptionChoice[]) || []).some(c => c.name === choice.name)}
                          className={`h-5 w-5 ${option.type === 'radio' ? 'rounded-full' : 'rounded'} text-primary focus:ring-accent`}
                        />
                        <span className="ml-3 text-gray-700">{choice.name}</span>
                      </div>
                      <span className="font-semibold text-gray-800">
                        {choice.priceModifier > 0 ? `+${choice.priceModifier.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}` : 'Gratis'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 bg-gray-50 border-t rounded-b-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="bg-gray-200 text-dark font-bold h-10 w-10 rounded-full">-</button>
              <span className="text-xl font-bold w-8 text-center">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} className="bg-gray-200 text-dark font-bold h-10 w-10 rounded-full">+</button>
            </div>
            <button
              onClick={handleFinalAddToCart}
              className="w-full sm:w-auto bg-primary text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-red-500 transition-all transform hover:scale-105"
            >
              Añadir por {totalPrice.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};