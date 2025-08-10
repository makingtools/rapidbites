import React from 'react';

interface PageHeaderProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ icon, title, description, actions }) => {
    return (
        <header className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <div className="flex items-center">
                    <div className="flex-shrink-0 mr-4 text-primary-500">
                      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-8 w-8' })}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {title}
                        </h1>
                        <p className="mt-1 text-md text-slate-500 dark:text-slate-400">{description}</p>
                    </div>
                </div>
            </div>
            {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
        </header>
    );
};

export default PageHeader;