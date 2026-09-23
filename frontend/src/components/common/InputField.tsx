import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputFieldProps {
  label?: string;
  type?: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  required?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  icon: Icon,
  disabled = false,
  required = false,
  min,
  max,
  step,
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
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-nestory-500 transition-colors pointer-events-none">
            <Icon size={18} strokeWidth={2.5} />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={`input-base ${Icon ? 'pl-12' : ''} ${
            error ? 'border-red-500 focus:ring-red-500/10' : ''
          } ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100' : ''}`}
        />
        {error && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs font-bold mt-2 ml-1 animate-fade-in">{error}</p>}
    </div>
  );
};

export default InputField;
