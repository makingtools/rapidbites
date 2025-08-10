

import React from 'react';
import { StrategicInsight } from '../types';
import { JohanIcon, ExclamationCircleIcon, StarIcon, ArrowRightIcon, ShieldCheckIcon, SparklesIcon, BanknotesIcon } from './Icons';

interface ProactiveAssistantProps {
  insights: StrategicInsight[];
  isLoading: boolean;
  onAction: (action: StrategicInsight['action']) => void;
}

const SkeletonLoader: React.FC = () => (
    <div className="space-y-4 animate-pulse">
        {[...Array(2)].map((_, i) => (
             <div key={i} className="p-4 bg-gray-200 dark:bg-neutral-800/50 rounded-lg">
                <div className="h-4 bg-gray-300 dark:bg-neutral-700 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-300 dark:bg-neutral-700 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-300 dark:bg-neutral-700 rounded w-full"></div>
            </div>
        ))}
    </div>
);

const ProactiveAssistant: React.FC<ProactiveAssistantProps> = ({ insights, isLoading, onAction }) => {

  const getUrgencyClasses = (insight: StrategicInsight) => {
    
    switch(insight.type){
        case 'anomaly':
            return {
                border: 'border-red-500', 
                bg: 'bg-red-50 dark:bg-red-900/20',
                icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
                titleText: 'text-red-800 dark:text-red-300',
            };
        case 'suggestion':
            return {
                border: 'border-purple-500', 
                bg: 'bg-purple-50 dark:bg-purple-900/20',
                icon: <SparklesIcon className="h-5 w-5 text-purple-500" />,
                titleText: 'text-purple-800 dark:text-purple-300',
            };
        case 'trend':
            return {
                border: 'border-blue-500', 
                bg: 'bg-blue-50 dark:bg-blue-900/20',
                icon: <StarIcon className="h-5 w-5 text-blue-500" />,
                titleText: 'text-blue-800 dark:text-blue-300',
            };
        case 'financial_health_alert':
            return {
                border: 'border-amber-500', 
                bg: 'bg-amber-50 dark:bg-amber-900/20',
                icon: <BanknotesIcon className="h-5 w-5 text-amber-500" />,
                titleText: 'text-amber-800 dark:text-amber-300',
            };
        default:
            return {
                border: 'border-gray-400', 
                bg: 'bg-gray-50 dark:bg-neutral-800/50',
                icon: <StarIcon className="h-5 w-5 text-gray-500" />,
                titleText: 'text-gray-800 dark:text-neutral-300',
            };
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg h-full">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
        <JohanIcon className="h-6 w-6 mr-2 text-primary-500" />
        Síntesis Estratégica
      </h2>

      <div className="space-y-4">
        {isLoading ? (
            <SkeletonLoader />
        ) : insights.length > 0 ? (
          insights.map((insight, index) => {
            const classes = getUrgencyClasses(insight);
            return (
              <div key={index} className={`p-4 rounded-lg border-l-4 transition-all duration-300 hover:shadow-md ${classes.border} ${classes.bg}`}>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">{classes.icon}</div>
                  <h4 className={`font-bold ${classes.titleText}`}>{insight.title}</h4>
                </div>
                <div className="pl-8 mt-1">
                    <p className="text-sm text-gray-700 dark:text-neutral-300">{insight.summary}</p>
                    {insight.kpi && <p className="text-xs font-bold text-gray-500 dark:text-neutral-400 mt-1">{insight.kpi} | {insight.financialImpact}</p>}
                </div>
                {insight.action && (
                  <div className="pl-8 mt-3">
                    <button 
                        onClick={() => onAction(insight.action)}
                        className="flex items-center gap-1 text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline"
                    >
                        {insight.action.label}
                        <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })
        ) : (
            <div className="text-center py-8">
                <p className="text-gray-500 dark:text-neutral-400">Johan está monitoreando...</p>
                <p className="text-sm text-gray-400 dark:text-neutral-500">Se te notificará sobre cualquier anomalía u oportunidad estratégica.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProactiveAssistant;