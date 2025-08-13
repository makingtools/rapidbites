
import React from 'react';
import { HomeIcon } from '../icons/HomeIcon';
import { ClipboardDocumentListIcon } from '../icons/ClipboardDocumentListIcon';
import { ArrowRightOnRectangleIcon } from '../icons/ArrowRightOnRectangleIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';
import { XMarkIcon } from '../icons/XMarkIcon';


interface AdminSidebarProps {
    onLogout: () => void;
    activePage: string;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const NavLink: React.FC<{ href: string; icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ href, icon, label, isActive, onClick }) => (
    <a href={href} onClick={onClick} className={`flex items-center px-4 py-3 text-gray-100 hover:bg-gray-700 rounded-lg transition-colors ${isActive ? 'bg-gray-700 font-bold' : ''}`}>
        {icon}
        <span className="mx-4 font-medium">{label}</span>
    </a>
);


export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onLogout, activePage, isOpen, setIsOpen }) => {
    
    const handleLogout = () => {
        setIsOpen(false);
        onLogout();
    };

    return (
       <>
            {/* Backdrop for mobile */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            ></div>
       
            <div className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-gray-800 text-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-30 shadow-lg md:shadow-none`}>
                <div className="flex items-center justify-between h-20 shadow-md px-4">
                    <h1 className="text-3xl font-display font-bold text-primary">RapidBites</h1>
                     <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <nav className="flex-grow px-4 py-4 space-y-2">
                    <NavLink href="#/admin/dashboard" icon={<HomeIcon className="w-6 h-6" />} label="Dashboard" isActive={activePage === 'dashboard'} onClick={() => setIsOpen(false)} />
                    <NavLink href="#/admin/orders" icon={<ClipboardDocumentListIcon className="w-6 h-6" />} label="Pedidos" isActive={activePage === 'orders'} onClick={() => setIsOpen(false)} />
                    <NavLink href="#/admin/menu" icon={<BookOpenIcon className="w-6 h-6" />} label="Gestión de Menú" isActive={activePage === 'menu'} onClick={() => setIsOpen(false)} />
                </nav>
                <div className="px-4 pb-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ArrowRightOnRectangleIcon className="w-6 h-6"/>
                        <span className="mx-4 font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </div>
       </>
    );
};
