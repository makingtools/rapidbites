
import React from 'react';
import { FacebookIcon } from './icons/FacebookIcon';
import { InstagramIcon } from './icons/InstagramIcon';
import { TwitterIcon } from './icons/TwitterIcon';

export const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-dark text-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="text-2xl font-display font-bold text-primary">RapidBites</h3>
            <p className="mt-2 text-gray-400">Tu comida favorita, a un clic de distancia.</p>
            <div className="flex justify-center md:justify-start space-x-4 mt-4">
              <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-white transition-colors">
                <FacebookIcon className="w-6 h-6" />
              </a>
              <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-white transition-colors">
                <InstagramIcon className="w-6 h-6" />
              </a>
              <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-white transition-colors">
                <TwitterIcon className="w-6 h-6" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-lg text-white">Enlaces Rápidos</h4>
            <ul className="mt-4 space-y-2">
              <li><a href="#menu" className="text-gray-400 hover:text-white">Menú</a></li>
              <li><a href="#about" className="text-gray-400 hover:text-white">Nosotros</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Reservas</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg text-white">Contacto</h4>
            <ul className="mt-4 space-y-2 text-gray-400">
              <li>123 Calle Falsa, Ciudad</li>
              <li>(555) 123-4567</li>
              <li>hola@rapidbites.com</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} RapidBites. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
