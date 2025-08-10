import React, { useState, useMemo } from 'react';
import { Quote } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

const OpportunitiesCalendar: React.FC<{ quotes: Quote[] }> = ({ quotes }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday

        const days: { key: string; date: Date; quotes: Quote[]; isCurrentMonth: boolean; }[] = [];
        
        // Days from previous month
        for (let i = startDayOfWeek; i > 0; i--) {
            const date = new Date(year, month, 1 - i);
            days.push({ key: `prev-${i}`, date, quotes: [], isCurrentMonth: false });
        }

        // Days of the current month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            date.setHours(0,0,0,0);
            const dateString = new Date(year, month, day).toISOString().split('T')[0];
            const dayQuotes = quotes.filter(q => q.expiryDate === dateString);
            days.push({ key: `current-${day}`, date, quotes: dayQuotes, isCurrentMonth: true });
        }
        
        // Days from next month
        const gridCells = 42; // 6 rows * 7 days
        let i = 1;
        while (days.length < gridCells) {
            const date = new Date(year, month + 1, i);
            days.push({ key: `next-${i}`, date, quotes: [], isCurrentMonth: false });
            i++;
        }

        return days;
    }, [currentDate, quotes]);

    const handlePrevMonth = () => {
        setCurrentDate(current => new Date(current.getFullYear(), current.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(current => new Date(current.getFullYear(), current.getMonth() + 1, 1));
    };

    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg shadow-md h-full flex flex-col">
            <header className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800" aria-label="Mes anterior">
                    <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <h2 className="text-xl font-bold capitalize">
                    {currentDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800" aria-label="Mes siguiente">
                    <ChevronRightIcon className="h-6 w-6" />
                </button>
            </header>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
                {weekDays.map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-grow">
                {calendarData.map(day => {
                    const isToday = day.date && day.date.getTime() === today.getTime();
                    return (
                        <div key={day.key} className={`border border-slate-200 dark:border-neutral-800 rounded-md p-1.5 flex flex-col ${!day.isCurrentMonth ? 'bg-slate-50 dark:bg-neutral-900/50' : 'bg-white dark:bg-neutral-900'}`}>
                            {day.date && (
                                <span className={`font-semibold text-sm w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary-600 text-white' : ''} ${!day.isCurrentMonth ? 'text-slate-400 dark:text-neutral-600' : ''}`}>
                                    {day.date.getDate()}
                                </span>
                            )}
                            <div className="mt-1 space-y-1 overflow-y-auto text-left flex-grow">
                                {day.quotes.map(quote => (
                                    <div key={quote.id} className="p-1.5 bg-primary-100 dark:bg-primary-900/40 rounded-md text-xs cursor-pointer hover:shadow-lg">
                                        <p className="font-bold text-primary-800 dark:text-primary-300 truncate">{quote.customerName}</p>
                                        <p className="font-semibold">{formatCurrency(quote.total)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OpportunitiesCalendar;
