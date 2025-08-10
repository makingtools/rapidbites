import React, { useState, useEffect } from 'react';
import { SystemSettings } from '../types';
import { WrenchScrewdriverIcon } from './Icons';

interface SystemConfigProps {
    settings: SystemSettings;
    onSave: (settings: SystemSettings) => void;
}

const SystemConfig: React.FC<SystemConfigProps> = ({ settings, onSave }) => {
    const [formData, setFormData] = useState<SystemSettings>(settings);
    
    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <header className="mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                    <WrenchScrewdriverIcon className="h-8 w-8 mr-3 text-primary-500" />
                    Configuración del Sistema
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Gestiona la información y los parámetros de tu empresa.</p>
            </header>

            <div className="max-w-2xl mx-auto bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-lg space-y-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de la Empresa</label>
                        <input
                            type="text"
                            name="companyName"
                            id="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="companyNit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">NIT</label>
                        <input
                            type="text"
                            name="companyNit"
                            id="companyNit"
                            value={formData.companyNit}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
                        <input
                            type="text"
                            name="companyAddress"
                            id="companyAddress"
                            value={formData.companyAddress}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-md"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </form>

                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Información de Despliegue</h3>
                    <div className="mt-2 p-4 bg-slate-100 dark:bg-neutral-800/50 rounded-lg border dark:border-neutral-700">
                        <p><strong>Edición Actual:</strong> Cloud Enterprise</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Tu sistema se mantiene actualizado automáticamente con las últimas mejoras y parches de seguridad.</p>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">La opción de despliegue en servidores locales (On-Premise) está disponible para planes corporativos.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemConfig;
