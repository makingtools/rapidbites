


import React, { useState, useEffect } from 'react';
import { GenericCrudConfig, NavSection, ViewPermissions, View } from '../types';
import { NAVIGATION_STRUCTURE } from '../constants';
import { SparklesIcon } from './Icons';
import { generateProductDescription } from '../services/geminiService';

interface GenericFormProps {
  config: GenericCrudConfig;
  item: any | null;
  onSave: (item: any) => void;
  onCancel: () => void;
}

const PermissionChecklist: React.FC<{
    selectedPermissions: Partial<Record<View, ViewPermissions>>;
    onChange: (permissions: Partial<Record<View, ViewPermissions>>) => void;
}> = ({ selectedPermissions, onChange }) => {
    
    const allActions: (keyof ViewPermissions)[] = ['view', 'create', 'edit', 'delete'];

    const handlePermissionChange = (viewId: View, action: keyof ViewPermissions, isChecked: boolean) => {
        const newPermissions = { ...selectedPermissions };
        if (!newPermissions[viewId]) {
            newPermissions[viewId] = {};
        }
        
        if (isChecked) {
            newPermissions[viewId]![action] = true;
            if (action !== 'view') {
                 newPermissions[viewId]!.view = true;
            }
        } else {
            delete newPermissions[viewId]![action];
            if (action === 'view') {
                delete newPermissions[viewId];
            }
        }
        onChange(newPermissions);
    };
    
    return (
        <div className="space-y-4 max-h-96 overflow-y-auto p-2 border rounded-lg bg-gray-50 dark:bg-neutral-800/50">
            {NAVIGATION_STRUCTURE.map((section: NavSection) => (
                <div key={section.label}>
                    <h4 className="font-bold text-gray-700 dark:text-gray-200 px-2">{section.label}</h4>
                    <div className="space-y-1 mt-2">
                        {section.groups.flatMap(g => g.links).map(link => (
                             <div key={link.id} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-700">
                                <span className="text-sm font-semibold">{link.label}</span>
                                <div className="grid grid-cols-4 gap-2 mt-1 pl-2">
                                     {allActions.map(action => (
                                        <label key={action} className="flex items-center space-x-1 text-xs">
                                             <input
                                                type="checkbox"
                                                checked={!!selectedPermissions[link.id]?.[action]}
                                                onChange={(e) => handlePermissionChange(link.id, action, e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span>{action}</span>
                                        </label>
                                     ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};


const GenericForm: React.FC<GenericFormProps> = ({ config, item, onSave, onCancel }) => {
  const [formData, setFormData] = useState<any>({});
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      // Initialize form with default values
      const initialData: any = {};
      config.formFields.forEach(field => {
        initialData[field.name] = field.type === 'number' ? 0 : (field.type === 'permission-checklist' ? {} : (field.type === 'checkbox' ? true : ''));
      });
      setFormData(initialData);
    }
  }, [item, config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData((prev: any) => ({ ...prev, [name]: checked }));
        return;
    }
    
    // @ts-ignore
    const isNumber = type === 'number' || config.formFields.find(f => f.name === name)?.type === 'number';
    
    setFormData((prev: any) => ({
      ...prev,
      [name]: isNumber ? parseFloat(value) || 0 : value,
    }));
  };

  const handlePermissionChange = (permissions: Partial<Record<View, ViewPermissions>>) => {
    setFormData((prev: any) => ({
        ...prev,
        permissions: permissions
    }));
  };
  
  const handleGenerateDescription = async () => {
      if (!formData.name || !formData.category) {
          alert("Por favor, completa el nombre y la categoría del producto primero.");
          return;
      }
      setIsGeneratingDesc(true);
      try {
          const description = await generateProductDescription(formData.name, formData.category);
          setFormData((prev: any) => ({ ...prev, description }));
      } catch (error) {
          console.error("Error generating description", error);
          alert("No se pudo generar la descripción.");
      } finally {
          setIsGeneratingDesc(false);
      }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const renderField = (field: typeof config.formFields[0]) => {
    const isProductDescription = config.view === 'inventory_items_services' && field.name === 'description';
    
    const commonProps = {
        name: String(field.name),
        id: String(field.name),
        value: formData[field.name] || '',
        onChange: handleChange,
        required: field.required,
        className: "mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
    };

    switch (field.type) {
        case 'select':
            return <select {...commonProps}>
                <option value="">Seleccionar...</option>
                {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>;
        case 'permission-checklist':
            return <PermissionChecklist selectedPermissions={formData[field.name] || {}} onChange={handlePermissionChange} />;
        case 'checkbox':
            return <input type="checkbox" {...commonProps} checked={!!formData[field.name]} className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />;
        default:
             if (isProductDescription) {
                 return (
                    <div className="relative">
                        <textarea {...commonProps} rows={4}></textarea>
                        <button 
                            type="button" 
                            onClick={handleGenerateDescription}
                            disabled={isGeneratingDesc}
                            className="absolute top-2 right-2 p-1.5 bg-accent text-white rounded-full hover:bg-pink-700 transition-colors disabled:opacity-50"
                            title="Generar descripción con IA"
                        >
                            {isGeneratingDesc 
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                : <SparklesIcon className="w-4 h-4" />
                            }
                        </button>
                    </div>
                );
            }
            return <input type={field.type} {...commonProps} />;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {config.formFields.map(field => (
        <div key={String(field.name)}>
          <label htmlFor={String(field.name)} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {field.label}
          </label>
          {renderField(field)}
        </div>
      ))}
      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-100 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={item?.id === 'UP-SUPERADMIN'}
          className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Guardar {config.singular}
        </button>
      </div>
    </form>
  );
};

export default GenericForm;