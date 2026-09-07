import React from 'react';

export function AuthInput({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  icon: Icon,
  disabled = false,
  autoComplete,
  children,
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wider text-gray-700 select-none flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-[#00a36f] ml-0.5">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center w-full">
        {Icon && (
          <div className="absolute left-3.5 pointer-events-none text-gray-400">
            <Icon className="w-5 h-5" />
          </div>
        )}

        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`
            w-full h-11 text-sm font-medium text-gray-900 bg-white placeholder-gray-400
            border rounded-lg shadow-xs transition-all duration-200 outline-none
            ${Icon ? 'pl-11' : 'pl-3.5'}
            ${children ? 'pr-11' : 'pr-3.5'}
            ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-gray-300 hover:border-gray-400 focus:border-[#00a36f] focus:ring-2 focus:ring-[#00a36f]/20'
            }
            ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200' : ''}
          `}
        />

        {children}
      </div>

      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-red-600 mt-0.5 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-600" />
          {error}
        </p>
      )}
    </div>
  );
}
