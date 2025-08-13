
import React from 'react';
import { ShoppingCartIcon } from './icons/ShoppingCartIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';

interface HeaderProps {
  onCartClick: () => void;
  cartCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onCartClick, cartCount }) => {
  return (
    <header className="bg-light/80 backdrop-blur-lg sticky top-0 z-40 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <a href="#" className="text-3xl font-display font-bold text-primary">
              RapidBites
            </a>
          </div>
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#menu" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">Menú</a>
              <a href="#about" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">Nosotros</a>
              <a href="#contact" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">Contacto</a>
            </div>
          </nav>
          <div className="flex items-center">
            <a
              href="#/admin"
              className="text-gray-500 hover:text-primary p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all mr-2"
              aria-label="Panel de Administrador (Pruebas)"
            >
              <UserCircleIcon className="h-7 w-7" />
            </a>
            <button
              onClick={onCartClick}
              className="relative bg-primary text-white p-2 rounded-full hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
              aria-label="Ver carrito"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-primary text-xs font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
