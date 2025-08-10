import React, { useState } from 'react';
import { PuzzlePieceIcon, CheckCircleIcon, Cog6ToothIcon } from './Icons';
import { Integration, IntegrationStatus, Module } from '../types';

// Data for integrations
const allIntegrations: Integration[] = [
    { 
        name: 'Siigo', 
        description: 'Automatiza la contabilidad con el software líder en Colombia.', 
        logo: 'https://assets.website-files.com/623381a73461e71158a72036/623381a73461e7651ba720a9_siigo-logo.svg',
        category: 'ERP y Contabilidad',
        status: 'available',
        tags: ['Contabilidad', 'Facturación Electrónica']
    },
    { 
        name: 'SAP Business One', 
        description: 'Sincroniza facturas, clientes y productos con tu ERP de SAP.', 
        logo: 'https://cdn.icon-icons.com/icons2/2699/PNG/512/sap_logo_icon_169344.png',
        category: 'ERP y Contabilidad',
        status: 'available',
        tags: ['ERP', 'Empresarial']
    },
    { 
        name: 'Wompi', 
        description: 'Pasarela de pagos de Bancolombia para el mercado local.', 
        logo: 'https://pbs.twimg.com/profile_images/1549487498075734018/iI5i2x02_400x400.png',
        category: 'Pasarelas de Pago',
        status: 'connected',
        tags: ['Pagos Online', 'Colombia']
    },
    { 
        name: 'Shopify', 
        description: 'Sincroniza automáticamente tu inventario y ventas desde tu tienda Shopify.', 
        logo: 'https://cdn.icon-icons.com/icons2/2699/PNG/512/shopify_logo_icon_169203.png',
        category: 'E-commerce',
        status: 'coming_soon',
        tags: ['Ventas', 'Inventario']
    },
];

// Data for modules
const internalModules: Module[] = [
    {
        id: 'module-restaurants',
        name: 'POS para Restaurantes',
        description: 'Gestiona mesas, pedidos a cocina y comandas. Ideal para el sector gastronómico.',
        category: 'Industry',
        isActive: false,
    },
    {
        id: 'module-logistics',
        name: 'Logística Avanzada',
        description: 'Optimiza rutas de entrega, gestiona flotas y realiza seguimiento en tiempo real.',
        category: 'Operations',
        isActive: true,
    },
    {
        id: 'module-marketing',
        name: 'Marketing Automation',
        description: 'Crea flujos de email automáticos, segmentación avanzada y seguimiento de leads.',
        category: 'Growth',
        isActive: true,
    }
];


const IntegrationCard: React.FC<{ integration: Integration }> = ({ integration }) => {
    
    const renderStatusBadge = (status: IntegrationStatus) => {
        switch(status) {
            case 'connected':
                return <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-300"><CheckCircleIcon className="h-3 w-3" /> Conectado</span>;
            case 'coming_soon':
                return <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-300">Próximamente</span>;
            default:
                return null;
        }
    };

    const renderActionButton = (status: IntegrationStatus) => {
        switch(status) {
            case 'connected':
                return <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-700 border border-slate-300 dark:border-neutral-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-600 transition"><Cog6ToothIcon className="h-5 w-5"/> Gestionar</button>;
            case 'available':
                 return <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition shadow-sm"><PuzzlePieceIcon className="h-5 w-5"/> Conectar</button>;
            case 'coming_soon':
                 return <button disabled className="px-4 py-2 bg-slate-200 dark:bg-neutral-700 text-slate-500 dark:text-slate-400 font-semibold rounded-lg cursor-not-allowed">Notificarme</button>;
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-800/50 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-neutral-800 flex flex-col gap-4 transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="flex justify-between items-start">
                <div className="w-16 h-16 flex items-center justify-center bg-slate-100 dark:bg-neutral-700 rounded-2xl p-2">
                    <img src={integration.logo} alt={`${integration.name} logo`} className="h-full w-full object-contain" />
                </div>
                {renderStatusBadge(integration.status)}
            </div>
            <div className="flex-grow">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{integration.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{integration.description}</p>
                 <div className="flex flex-wrap gap-2 mt-4">
                    {integration.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full dark:bg-neutral-700 dark:text-neutral-300">{tag}</span>
                    ))}
                </div>
            </div>
            <div className="mt-2">
                {renderActionButton(integration.status)}
            </div>
        </div>
    );
};

const ModuleCard: React.FC<{ module: Module }> = ({ module }) => {
    const [isActive, setIsActive] = useState(module.isActive);

    return (
         <div className="bg-white dark:bg-neutral-800/50 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-neutral-800 flex flex-col gap-4">
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{module.name}</h3>
                 <div className="flex items-center">
                    <span className={`text-xs font-semibold mr-2 ${isActive ? 'text-green-600' : 'text-slate-500'}`}>{isActive ? 'Activo' : 'Inactivo'}</span>
                    <label htmlFor={`toggle-${module.id}`} className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" id={`toggle-${module.id}`} className="sr-only" checked={isActive} onChange={() => setIsActive(!isActive)} />
                            <div className="block bg-slate-300 dark:bg-neutral-700 w-12 h-6 rounded-full"></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${isActive ? 'translate-x-6 bg-primary-500' : ''}`}></div>
                        </div>
                    </label>
                </div>
            </div>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex-grow">{module.description}</p>
             <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full dark:bg-neutral-700 dark:text-neutral-300 self-start">{module.category}</span>
        </div>
    );
};


const ModulesAndIntegrations: React.FC = () => {
    
    const integrationsByCategory = allIntegrations.reduce((acc, int) => {
        if (!acc[int.category]) {
            acc[int.category] = [];
        }
        acc[int.category].push(int);
        return acc;
    }, {} as Record<string, Integration[]>);
    
    const categories = Object.keys(integrationsByCategory) as (keyof typeof integrationsByCategory)[];

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
             <header className="mb-10 text-center max-w-3xl mx-auto">
                <div className="inline-block p-4 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-4">
                    <PuzzlePieceIcon className="h-10 w-10 text-primary-500" />
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Potencia tu Operación
                </h1>
                <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
                    Activa módulos y conecta integraciones para adaptar el sistema a las necesidades únicas de tu negocio.
                </p>
            </header>

            <div className="space-y-12">
                <section>
                    <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-200 border-b pb-2">Módulos del Sistema</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {internalModules.map(module => <ModuleCard key={module.id} module={module} />)}
                    </div>
                </section>

                {categories.map(category => (
                    <section key={category}>
                        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-200 border-b pb-2">Integraciones: {category}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {integrationsByCategory[category].map(integration => <IntegrationCard key={integration.name} integration={integration} />)}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
};

export default ModulesAndIntegrations;
