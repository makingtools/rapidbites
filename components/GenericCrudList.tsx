


import React, { useState, useMemo, useEffect } from 'react';
import { AppDataState, GenericCrudConfig, View } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon, DocumentDownloadIcon } from './Icons';
import { exportToPdf, exportToXlsx } from '../services/downloadService';
import PageHeader from './PageHeader';

interface GenericCrudListProps {
  config: GenericCrudConfig;
  data: any[];
  onAdd?: () => void;
  onEdit?: (item: any) => void;
  onDelete?: (id: string | number) => void;
  isReadOnly?: boolean;
  appDataState: AppDataState;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  initialFilter?: { key: string; value: any };
  onNavigate?: (view: View, payload?: any) => void;
}

const GenericCrudList: React.FC<GenericCrudListProps> = ({
  config, data, onAdd, onEdit, onDelete, isReadOnly = false, appDataState,
  canCreate = true, canEdit = true, canDelete = true, initialFilter, onNavigate = () => {}
}) => {
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (initialFilter) {
      const initialSearch = String(initialFilter.value);
      setInputValue(initialSearch);
      setSearchTerm(initialSearch);
    }
  }, [initialFilter]);
  
  useEffect(() => {
      const timer = setTimeout(() => {
          setSearchTerm(inputValue);
      }, 300);

      return () => {
          clearTimeout(timer);
      };
  }, [inputValue]);

  const filteredData = useMemo(() => {
    // A specific initial filter is applied and hasn't been changed by the user
    if (initialFilter && searchTerm === String(initialFilter.value)) {
        if (initialFilter.key === 'stockByWarehouse') {
            if (initialFilter.value === '<20') {
                 return data.filter(item => Object.values(item.stockByWarehouse || {}).reduce<number>((s, q) => s + Number(q), 0) < 20);
            }
            if (initialFilter.value === '0') {
                 return data.filter(item => Object.values(item.stockByWarehouse || {}).reduce<number>((s, q) => s + Number(q), 0) === 0);
            }
        } else {
             return data.filter(item => item[initialFilter.key] === initialFilter.value);
        }
    }

    // If there is no search term (or it was cleared), return all data
    if (!searchTerm) {
        return data;
    }
    
    // Apply generic search based on user input
    const lowerCaseSearch = searchTerm.toLowerCase();
    return data.filter(item => {
      return Object.values(item).some(val => 
        String(val).toLowerCase().includes(lowerCaseSearch)
      );
    });
  }, [data, searchTerm, initialFilter]);
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const handleExportPdf = () => {
    const pdfColumns = config.columns.map(col => ({ header: col.header, dataKey: col.key as string }));
    exportToPdf(pdfColumns, filteredData, config.title);
  };
  
  const handleExportXlsx = () => {
    exportToXlsx(filteredData, `${config.title.toLowerCase().replace(' ', '_')}.xlsx`);
  };

  const actions = (
      <>
        {config.customActions && config.customActions(onNavigate)}
        {!isReadOnly && onAdd && canCreate && (
            <button
            onClick={onAdd}
            className="flex items-center bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-300 shadow-lg shrink-0"
            >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo {config.singular}
            </button>
        )}
      </>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        <PageHeader 
            icon={config.icon}
            title={config.title}
            description={`Gestiona todos los registros de ${config.title.toLowerCase()}.`}
            actions={actions}
        />
        
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
             <div className="relative w-full sm:w-auto sm:flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Buscar en esta tabla..."
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
                <button onClick={handleExportPdf} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700">
                    <DocumentDownloadIcon className="h-5 w-5" /> PDF
                </button>
                 <button onClick={handleExportXlsx} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700">
                    <DocumentDownloadIcon className="h-5 w-5" /> Excel
                </button>
            </div>
        </div>
      

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-neutral-800/50">
              <tr>
                {config.columns.map(col => (
                  <th key={String(col.key)} className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{col.header}</th>
                ))}
                {!isReadOnly && <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/40">
                  {config.columns.map(col => (
                    <td key={`${item.id}-${String(col.key)}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-neutral-300">
                      {col.render ? col.render(item, appDataState, onNavigate) : item[col.key]}
                    </td>
                  ))}
                  {!isReadOnly && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex justify-center items-center space-x-2">
                        {onEdit && canEdit && <button onClick={() => onEdit(item)} className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 p-1" title="Editar"><PencilIcon className="h-5 w-5" /></button>}
                        {onDelete && canDelete && <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 p-1" title="Eliminar"><TrashIcon className="h-5 w-5" /></button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={config.columns.length + (isReadOnly ? 0 : 1)} className="text-center py-10 text-gray-500 dark:text-neutral-400">
                    {data.length > 0 ? 'No se encontraron registros con ese criterio.' : 'No hay registros para mostrar. ¡Añade uno para empezar!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
             <div className="p-4 flex items-center justify-between border-t border-gray-200 dark:border-neutral-800">
                <span className="text-sm text-gray-600 dark:text-neutral-400">Página {currentPage} de {totalPages}</span>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm bg-gray-200 dark:bg-neutral-800 rounded-md disabled:opacity-50 text-gray-800 dark:text-neutral-200">Anterior</button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm bg-gray-200 dark:bg-neutral-800 rounded-md disabled:opacity-50 text-gray-800 dark:text-neutral-200">Siguiente</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default GenericCrudList;
