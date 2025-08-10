import React, { useState } from 'react';
import { SparklesIcon, PuzzlePieceIcon, CubeIcon, CheckCircleIcon } from './Icons';
import { Warehouse, User } from '../types';

interface LoginProps {
  onLogin: (email: string, pass: string, warehouseId: string) => Promise<User | null>;
  warehouses: Warehouse[];
}

const Login: React.FC<LoginProps> = ({ onLogin, warehouses }) => {
  const [email, setEmail] = useState('kairo');
  const [password, setPassword] = useState('J0j4t4n***');
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouses[0]?.id || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedWarehouse) {
        setError('Por favor, selecciona una sucursal para operar.');
        return;
    }
    setIsLoading(true);
    try {
        const user = await onLogin(email, password, selectedWarehouse);
        if (!user) {
          setError('Usuario o contraseña incorrectos.');
        } else if (!user.isActive) {
          setError('Este usuario se encuentra inactivo. Contacta al administrador.');
        }
    } catch (err) {
        setError('Ocurrió un error al intentar iniciar sesión. Inténtalo de nuevo.');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-neutral-950">
      <div className="w-full max-w-5xl m-4 flex rounded-2xl shadow-2xl overflow-hidden animate-fade-in bg-white dark:bg-neutral-900">
          {/* Left Panel */}
          <div className="hidden md:flex w-1/2 flex-col justify-center p-12 bg-gradient-to-br from-primary-600 to-accent text-white">
               <div className="p-4 bg-white/20 rounded-2xl inline-block mb-6 self-start">
                  <SparklesIcon className="h-10 w-10 text-white"/>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight">El Sistema Operativo para Comercios Inteligentes</h1>
              <p className="mt-4 text-lg text-primary-100">
                  Una plataforma unificada que automatiza tus operaciones, optimiza tu inventario y escala con tu crecimiento.
              </p>
              <ul className="mt-8 space-y-6 text-left">
                  <li className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-2 bg-white/20 rounded-full"><SparklesIcon className="h-5 w-5"/></div>
                      <div>
                          <h3 className="font-bold">Velocidad y Automatización IA</h3>
                          <p className="text-sm text-primary-200">Operaciones en menos de 90ms. Elimina la entrada manual de datos y automatiza facturas y recordatorios de pago.</p>
                      </div>
                  </li>
                  <li className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-2 bg-white/20 rounded-full"><PuzzlePieceIcon className="h-5 w-5"/></div>
                      <div>
                          <h3 className="font-bold">Integración Total con tu ERP</h3>
                          <p className="text-sm text-primary-200">Sincronización fluida del POS con inventario, ventas, contabilidad y CRM en tiempo real.</p>
                      </div>
                  </li>
                  <li className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-2 bg-white/20 rounded-full"><CubeIcon className="h-5 w-5"/></div>
                      <div>
                          <h3 className="font-bold">Optimización de Inventario</h3>
                          <p className="text-sm text-primary-200">Anticipa la demanda con IA para evitar roturas de stock y mantén un control de inventario preciso.</p>
                      </div>
                  </li>
                  <li className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-2 bg-white/20 rounded-full"><CheckCircleIcon className="h-5 w-5"/></div>
                      <div>
                          <h3 className="font-bold">Facilidad de Uso y Escalabilidad</h3>
                          <p className="text-sm text-primary-200">Una interfaz intuitiva diseñada para crecer con tu negocio, adaptándose a nuevas necesidades sin complicaciones.</p>
                      </div>
                  </li>
              </ul>
          </div>
          {/* Right Panel (Form) */}
          <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
               <div className="text-center md:text-left mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  Iniciar Sesión
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Bienvenido de nuevo.
                </p>
              </div>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email-address" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Usuario
                    </label>
                    <input
                      id="email-address"
                      name="email"
                      type="text"
                      autoComplete="username"
                      required
                      className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-neutral-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-neutral-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                      placeholder="kairo"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="password"  className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contraseña
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-neutral-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-neutral-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                   <div>
                    <label htmlFor="warehouse"  className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sucursal / Bodega
                    </label>
                    <select
                      id="warehouse"
                      name="warehouse"
                      required
                      value={selectedWarehouse}
                      onChange={(e) => setSelectedWarehouse(e.target.value)}
                      className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-neutral-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-neutral-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    >
                      <option value="" disabled>Selecciona una Sucursal</option>
                      {warehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-center text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-75"
                  >
                    {isLoading ? 'Ingresando...' : 'Ingresar al Sistema'}
                  </button>
                </div>
              </form>
          </div>
      </div>
    </div>
  );
};

export default Login;