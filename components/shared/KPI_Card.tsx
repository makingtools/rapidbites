import React from 'react';

interface KPI_CardProps {
    title: string;
    value: string;
    icon?: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

const KPI_Card: React.FC<KPI_CardProps> = React.memo(({ title, value, icon, className, onClick }) => (
    <div 
        className={`relative overflow-hidden p-5 rounded-xl transition-all duration-300 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 ${className} ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
        onClick={onClick}
    >
        <div className="relative z-10">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="p-2 bg-slate-100 dark:bg-neutral-800/50 rounded-lg">
                        {icon}
                    </div>
                )}
                <h3 className="text-sm font-medium text-slate-500 dark:text-neutral-400">{title}</h3>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-white truncate">{value}</p>
        </div>
    </div>
));

export default KPI_Card;