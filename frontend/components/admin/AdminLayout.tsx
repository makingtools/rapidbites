
import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminOrders } from './pages/AdminOrders';
import { AdminMenu } from './pages/AdminMenu';
import { Bars3Icon } from '../icons/Bars3Icon';

interface AdminLayoutProps {
    onLogout: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout }) => {
    const [page, setPage] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            const newPage = hash.split('/')[2] || 'dashboard';
            setPage(newPage);
        };
        
        handleHashChange(); // Set initial page
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const renderPage = () => {
        switch (page) {
            case 'orders':
                return <AdminOrders />;
            case 'menu':
                return <AdminMenu />;
            case 'dashboard':
            default:
                return <AdminDashboard />;
        }
    };

    return (
        <div className="relative min-h-screen md:flex bg-gray-50 font-sans">
            <AdminSidebar onLogout={onLogout} activePage={page} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            <div className="flex-1 flex flex-col">
                 <header className="md:hidden bg-white shadow-md flex items-center justify-between p-4 h-20">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-500 focus:outline-none">
                        <Bars3Icon className="h-6 w-6" />
                    </button>
                     <h1 className="text-2xl font-display font-bold text-primary">RapidBites</h1>
                     {/* Empty div for spacing */}
                     <div className="w-6"></div>
                </header>
                <main className="flex-1 overflow-y-auto">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {renderPage()}
                    </div>
                </main>
            </div>
        </div>
    );
};
