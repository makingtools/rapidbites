import React from 'react';
import { Notification, View } from '../types';
import { CloseIcon, BellIcon, CheckCircleIcon, EyeIcon } from './Icons';

interface NotificationCenterProps {
    isOpen: boolean;
    notifications: Notification[];
    onClose: () => void;
    onNavigate: (view: View, payload?: any) => void;
    onMarkAsRead: (id: number) => void;
    onMarkAllAsRead: () => void;
    onClearAll: () => void;
}

const NotificationItem: React.FC<{ notification: Notification; onNavigate: (view: View, payload?: any) => void; onMarkAsRead: (id: number) => void; }> = ({ notification, onNavigate, onMarkAsRead }) => {
    const handleNotificationClick = () => {
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }
        if (notification.link) {
            onNavigate(notification.link.view, notification.link.payload);
        }
    };

    const getIcon = () => {
        switch(notification.type) {
            case 'alert': return <BellIcon className="h-5 w-5 text-red-500" />;
            case 'success': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            default: return <BellIcon className="h-5 w-5 text-blue-500" />;
        }
    }

    return (
        <li className={`p-3 rounded-lg transition-colors duration-200 ${notification.read ? 'bg-gray-100 dark:bg-neutral-800/50' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">{getIcon()}</div>
                <div className="flex-grow">
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{notification.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{notification.message}</p>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(notification.date).toLocaleString('es-CO')}</span>
                        {notification.link && (
                             <button onClick={handleNotificationClick} className="flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                                <EyeIcon className="h-3 w-3" /> Ver
                            </button>
                        )}
                    </div>
                </div>
                {!notification.read && (
                    <button onClick={() => onMarkAsRead(notification.id)} className="p-1 -mr-1 -mt-1 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700" title="Marcar como leída">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    </button>
                )}
            </div>
        </li>
    );
};


const NotificationCenter: React.FC<NotificationCenterProps> = ({
    isOpen, notifications, onClose, onNavigate, onMarkAsRead, onMarkAllAsRead, onClearAll
}) => {
    if (!isOpen) return null;
    
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose}>
            <div 
                className="fixed top-0 right-0 h-full w-full max-w-sm bg-gray-50 dark:bg-neutral-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out"
                onClick={e => e.stopPropagation()}
                style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
            >
                <header className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BellIcon className="h-6 w-6" /> Centro de Notificaciones
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:text-gray-800 dark:hover:text-white">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-2">
                    {notifications.length > 0 ? (
                        <ul className="space-y-2">
                           {notifications.map(n => <NotificationItem key={n.id} notification={n} onNavigate={onNavigate} onMarkAsRead={onMarkAsRead} />)}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-neutral-400">
                            <BellIcon className="h-12 w-12 mb-4" />
                            <p className="font-semibold">Todo está en calma</p>
                            <p className="text-sm">No tienes notificaciones nuevas.</p>
                        </div>
                    )}
                </main>

                {notifications.length > 0 && (
                     <footer className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-neutral-800 flex justify-between items-center">
                        <button onClick={onMarkAllAsRead} disabled={unreadCount === 0} className="text-xs font-semibold text-primary-600 hover:underline disabled:opacity-50 disabled:no-underline">Marcar todas como leídas</button>
                        <button onClick={onClearAll} className="text-xs font-semibold text-red-600 hover:underline">Limpiar todo</button>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default NotificationCenter;