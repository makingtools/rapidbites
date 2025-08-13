
import React, { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { MenuItemCard } from './MenuItemCard';
import { fetchDailySpecial } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';

interface MenuSectionProps {
  menuItems: MenuItem[];
  onCustomizeClick: (item: MenuItem) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({ menuItems, onCustomizeClick }) => {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [filteredItems, setFilteredItems] = useState(menuItems);
  const [special, setSpecial] = useState<{name: string, description: string, price: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const menuCategories = ["Todos", ...Array.from(new Set(menuItems.map(item => item.category)))];

  useEffect(() => {
    if (activeCategory === 'Todos') {
      setFilteredItems(menuItems);
    } else {
      setFilteredItems(menuItems.filter(item => item.category === activeCategory));
    }
  }, [activeCategory, menuItems]);

  const handleGetSpecial = async () => {
    setIsLoading(true);
    setError('');
    setSpecial(null);
    try {
      const result = await fetchDailySpecial();
      setSpecial(result);
    } catch (err) {
      setError('No pudimos obtener la sugerencia. Inténtalo de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="menu" className="py-16 sm:py-24 bg-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-display font-bold text-dark sm:text-5xl">Nuestro Menú</h2>
          <p className="mt-4 text-lg text-gray-600">Explora nuestras delicias, preparadas con los mejores ingredientes.</p>
        </div>

        <div className="mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-secondary p-3 rounded-full">
                        <SparklesIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-display font-bold text-dark">¿No sabes qué pedir?</h3>
                        <p className="text-gray-600">Deja que nuestro Chef AI te dé una recomendación única.</p>
                    </div>
                </div>
                <button 
                    onClick={handleGetSpecial}
                    disabled={isLoading}
                    className="w-full md:w-auto bg-primary text-white font-bold py-3 px-6 rounded-full hover:bg-red-500 transition-all disabled:bg-gray-400 disabled:cursor-wait flex items-center justify-center gap-2"
                >
                    {isLoading ? 'Pensando...' : 'Sugerencia del Chef'}
                </button>
            </div>
            {isLoading && <p className="text-center mt-4 text-gray-600">Nuestro chef está cocinando una idea para ti...</p>}
            {error && <p className="text-center mt-4 text-red-500">{error}</p>}
            {special && (
                <div className="mt-6 bg-yellow-50 border-2 border-secondary rounded-xl p-6 shadow-md animate-fade-in">
                    <h4 className="text-2xl font-display font-bold text-primary">{special.name}</h4>
                    <p className="mt-2 text-gray-700">{special.description}</p>
                    <p className="mt-4 text-xl font-bold text-dark">{special.price}</p>
                </div>
            )}
        </div>

        <div className="flex justify-center flex-wrap gap-2 mb-12">
          {menuCategories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 font-semibold rounded-full transition-colors ${
                activeCategory === category
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredItems.map(item => (
            <MenuItemCard key={item.id} item={item} onCustomizeClick={onCustomizeClick} />
          ))}
        </div>
      </div>
    </section>
  );
};
