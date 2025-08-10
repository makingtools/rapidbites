import React from 'react';
import { DateRange, DashboardFilter, DashboardFilterItem } from '../types';
import { SearchIcon, CloseIcon } from './Icons';

type DatePreset = 'today' | 'this_week' | 'this_month' | 'this_year' | 'all';

interface FilterBarProps {
    dateRange?: DateRange;
    onDateRangeChange?: (newRange: DateRange) => void;
    searchTerm?: string;
    onSearchTermChange?: (newTerm: string) => void;
    searchPlaceholder?: string;
    extraFilters?: React.ReactNode;
    activeFilters?: DashboardFilter;
    onRemoveFilter?: (filterToRemove: DashboardFilterItem) => void;
    onClearFilters?: () => void;
    showDatePresets?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
    dateRange,
    onDateRangeChange,
    searchTerm,
    onSearchTermChange,
    searchPlaceholder = "Buscar...",
    extraFilters,
    activeFilters,
    onRemoveFilter,
    onClearFilters,
    showDatePresets = true,
}) => {
    
    const handlePresetClick = (preset: DatePreset) => {
        if (!onDateRangeChange) return;

        const end = new Date();
        let start: Date | null;

        switch (preset) {
            case 'today':
                start = new Date();
                start.setHours(0, 0, 0, 0);
                break;
            case 'this_week':
                start = new Date();
                start.setHours(0, 0, 0, 0);
                const day = start.getDay();
                const diffToMonday = day === 0 ? -6 : 1 - day;
                start.setDate(start.getDate() + diffToMonday);
                break;
            case 'this_month':
                start = new Date(end.getFullYear(), end.getMonth(), 1);
                break;
            case 'this_year':
                 start = new Date(end.getFullYear(), 0, 1);
                break;
            case 'all':
                start = null;
                break;
            default:
                start = new Date();
        }
        onDateRangeChange({ start, end });
    };

    const presets: { id: DatePreset, label: string }[] = [
        { id: 'today', label: 'Hoy' },
        { id: 'this_week', label: 'Semana' },
        { id: 'this_month', label: 'Este Mes' },
        { id: 'this_year', label: 'Este Año' },
        { id: 'all', label: 'Todo' },
    ];
    
    return (
        <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap">
                {onSearchTermChange !== undefined && (
                    <div className="relative flex-grow w-full sm:w-auto">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon className="h-5 w-5 text-slate-400" />
                        </span>
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm || ''}
                            onChange={(e) => onSearchTermChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                )}
                
                <div className="flex-grow flex items-center justify-start sm:justify-end gap-2 flex-wrap w-full">
                    {onDateRangeChange && showDatePresets && (
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-900 p-1 rounded-lg">
                            {presets.map(p => (
                                <button key={p.id} onClick={() => handlePresetClick(p.id)} 
                                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800`}>
                                    { p.label }
                                </button>
                            ))}
                        </div>
                     )}
                     {onDateRangeChange && !showDatePresets && (
                        <div className="flex items-center gap-2">
                            <input type="date" value={dateRange?.start ? dateRange.start.toISOString().split('T')[0] : ''} onChange={e => onDateRangeChange({...(dateRange || {end: new Date()}), start: e.target.value ? new Date(e.target.value) : null})} className="py-1 px-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm focus:ring-1 focus:ring-primary-500"/>
                            <span className="text-slate-500">-</span>
                            <input type="date" value={dateRange?.end ? dateRange.end.toISOString().split('T')[0] : ''} onChange={e => onDateRangeChange({...(dateRange || {start: new Date()}), end: e.target.value ? new Date(e.target.value) : null})} className="py-1 px-2 border border-slate-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm focus:ring-1 focus:ring-primary-500"/>
                        </div>
                     )}
                    {extraFilters}
                </div>
            </div>
            {activeFilters && activeFilters.length > 0 && onRemoveFilter && onClearFilters && (
                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center gap-2 text-sm">
                    <span className="font-semibold text-primary-800 dark:text-primary-200">Filtros Activos:</span>
                    <div className="flex flex-wrap gap-1">
                        {activeFilters.map(filter => (
                            <div key={`${filter.type}-${filter.value}`} className="flex items-center gap-1.5 bg-white dark:bg-primary-900/50 px-2 py-0.5 rounded-full">
                                <span className="text-primary-700 dark:text-primary-300 font-medium">{filter.label}</span>
                                <button onClick={() => onRemoveFilter(filter)} className="text-primary-400 hover:text-primary-600"><CloseIcon className="h-3 w-3" /></button>
                            </div>
                        ))}
                    </div>
                    <button onClick={onClearFilters} className="ml-auto text-xs font-bold text-slate-500 hover:underline">LIMPIAR</button>
                </div>
            )}
        </div>
    );
};

export default FilterBar;