import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectFieldProps {
  label?: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  required?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  error,
  icon: Icon,
  disabled = false,
  required = false,
}) => {
  return (
    <div className="w-full group">
      {label && (
        <label className="block text-sm font-black text-gray-700 mb-2.5 transition-colors group-focus-within:text-nestory-600">
          {label}
          {required && <span className="text-nestory-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-nestory-500 transition-colors pointer-events-none z-10">
            <Icon size={18} strokeWidth={2.5} />
          </div>
        )}
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`input-base appearance-none ${Icon ? 'pl-12' : ''} ${
            error ? 'border-red-500 focus:ring-red-500/10' : ''
          } ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100' : ''} pr-12`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-nestory-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
      {error && <p className="text-red-500 text-xs font-bold mt-2 ml-1 animate-fade-in">{error}</p>}
    </div>
  );
};

export default SelectField;
