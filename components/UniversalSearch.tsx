import React, { useState, useEffect, useRef } from 'react';
import { AppDataState, Customer, Product, Invoice, Salesperson, User, View } from '../types';
import { SearchIcon, CloseIcon, CubeIcon, DocumentTextIcon, UserGroupIcon, UsersIcon } from './Icons';

type SearchResult = {
  type: 'customer' | 'product' | 'invoice' | 'salesperson' | 'user';
  item: Customer | Product | Invoice | Salesperson | User;
};

interface UniversalSearchProps {
  data: AppDataState;
  onSelect: (item: any, type: 'customer' | 'product' | 'invoice' | 'salesperson' | 'user', view?: View, payload?: any) => void;
}

const UniversalSearch: React.FC<UniversalSearchProps> = ({ data, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const typeLabels: { [key: string]: string } = {
      customer: 'cliente',
      product: 'producto',
      invoice: 'factura',
      salesperson: 'vendedor',
      user: 'usuario',
  };
   const typeIcons: { [key: string]: React.ReactNode } = {
      customer: <UsersIcon className="h-5 w-5 text-blue-500" />,
      product: <CubeIcon className="h-5 w-5 text-green-500" />,
      invoice: <DocumentTextIcon className="h-5 w-5 text-yellow-500" />,
      salesperson: <UserGroupIcon className="h-5 w-5 text-purple-500" />,
      user: <UserGroupIcon className="h-5 w-5 text-indigo-500" />,
  };

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const { customers, products, invoices, salespeople, users } = data;
    const lowerCaseQuery = query.toLowerCase();

    const customerResults: SearchResult[] = customers
      .filter(c => c.name.toLowerCase().includes(lowerCaseQuery) || c.email.toLowerCase().includes(lowerCaseQuery))
      .map(item => ({ type: 'customer', item }));

    const productResults: SearchResult[] = products
      .filter(p => p.name.toLowerCase().includes(lowerCaseQuery) || p.description.toLowerCase().includes(lowerCaseQuery))
      .map(item => ({ type: 'product', item }));

    const invoiceResults: SearchResult[] = invoices
      .filter(i => i.id.toLowerCase().includes(lowerCaseQuery) || i.customerName?.toLowerCase().includes(lowerCaseQuery))
      .map(item => ({ type: 'invoice', item }));
      
    const salespersonResults: SearchResult[] = salespeople
      .filter(s => s.name.toLowerCase().includes(lowerCaseQuery))
      .map(item => ({ type: 'salesperson', item }));
      
    const userResults: SearchResult[] = users
      .filter(u => u.name.toLowerCase().includes(lowerCaseQuery) || u.email.toLowerCase().includes(lowerCaseQuery))
      .map(item => ({ type: 'user', item }));

    setResults([...customerResults, ...invoiceResults, ...productResults, ...salespersonResults, ...userResults].slice(0, 10));
  }, [query, data]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'customer') {
      onSelect(result.item, result.type, 'customer_profile', (result.item as Customer).id);
    } else {
        onSelect(result.item, result.type);
    }
    setQuery('');
    setIsFocused(false);
  };

  const getResultTitle = (item: any, type: string) => {
      if (type === 'invoice') return `${item.id} - ${item.customerName}`;
      return item.name;
  }
  
   const getResultSubtitle = (item: any, type: string) => {
      if (type === 'invoice') return `Total: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.total)}`;
      if (type === 'customer') return item.email;
      if (type === 'product') {
         const totalStock = Object.values((item as Product).stockByWarehouse || {}).reduce((sum, val) => sum + val, 0);
         return `Precio: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.price)} | Stock: ${totalStock}`;
      }
      if (type === 'salesperson') return `Vendedor`;
      if (type === 'user') return item.email;
      return '';
  }

  return (
    <div className="relative w-full max-w-lg" ref={searchContainerRef}>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Buscar clientes, facturas, productos, usuarios..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute inset-y-0 right-0 flex items-center pr-3">
            <CloseIcon className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {isFocused && query.length > 1 && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-neutral-900 rounded-lg shadow-2xl border dark:border-neutral-800 z-30 max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <ul>
              {results.map((result, index) => (
                <li key={`${result.type}-${(result.item as any).id}-${index}`}>
                  <button
                    onClick={() => handleSelect(result)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center gap-4 transition-colors"
                  >
                    <div className="flex-shrink-0">
                        {typeIcons[result.type] || <CubeIcon className="h-5 w-5 text-gray-400" />}
                    </div>
                    <div className="flex-grow">
                        <span className="font-semibold text-gray-800 dark:text-neutral-100">{getResultTitle(result.item, result.type)}</span>
                        <p className="text-sm text-gray-500 dark:text-neutral-400">{getResultSubtitle(result.item, result.type)}</p>
                    </div>
                    <span className="text-xs font-semibold uppercase text-primary-500 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/50 px-2 py-1 rounded-full">{typeLabels[result.type] || result.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-neutral-400">
              No se encontraron resultados para "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UniversalSearch;