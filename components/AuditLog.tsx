import React, { useState, useMemo } from 'react';
import { AuditLogEntry } from '../types';
import { ShieldCheckIcon, SearchIcon } from './Icons';

interface AuditLogProps {
  auditLog: AuditLogEntry[];
}

const AuditLog: React.FC<AuditLogProps> = ({ auditLog }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const filteredLog = useMemo(() => {
        return auditLog
            .filter(entry => 
                entry.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.details.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [auditLog, searchTerm]);
    
    const totalPages = Math.ceil(filteredLog.length / itemsPerPage);
    const paginatedLog = filteredLog.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <header className="mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                    <ShieldCheckIcon className="h-8 w-8 mr-3 text-primary-500" />
                    Bitácora de Auditoría
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Registro inmutable de todas las acciones críticas del sistema.</p>
                <div className="mt-4 relative w-full max-w-lg">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por usuario, acción, detalles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha y Hora</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acción</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedLog.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{new Date(entry.timestamp).toLocaleString('es-CO')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{entry.userName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-primary-600 dark:text-primary-400">{entry.action}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{entry.details}</td>
                                </tr>
                            ))}
                            {filteredLog.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        No se encontraron registros de auditoría.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                 {totalPages > 1 && (
                     <div className="p-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Página {currentPage} de {totalPages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50">Anterior</button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50">Siguiente</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLog;