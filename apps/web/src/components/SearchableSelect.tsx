'use client';

import React, { forwardRef, useId, useMemo } from 'react';
import Select, { Props as SelectProps } from 'react-select';
import AsyncSelect from 'react-select/async';

export interface SearchableSelectOption {
  label: string;
  value: string;
  subtitle?: string;
  [key: string]: any;
}

export interface SearchableSelectProps extends Omit<SelectProps, 'value' | 'onChange' | 'options'> {
  options?: SearchableSelectOption[];
  loadOptions?: (inputValue: string, callback?: (options: SearchableSelectOption[]) => void) => Promise<SearchableSelectOption[]> | void;
  defaultOptions?: boolean | SearchableSelectOption[];
  value?: string | number | null;
  onChange?: (e: { target: { name?: string; value: string } }) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  maxRenderedOptions?: number;
}

export const SearchableSelect = forwardRef<any, SearchableSelectProps>(
  (
    {
      options = [],
      loadOptions,
      defaultOptions = true,
      value,
      onChange,
      name,
      required,
      disabled,
      placeholder,
      className,
      maxRenderedOptions = 50,
      ...props
    },
    ref,
  ) => {
    // Find the currently selected option object based on the string value
    const selectedOption =
      (options || []).find((opt) => String(opt.value) === String(value)) ||
      (value ? { label: String(value), value: String(value) } : null);

    const handleChange = (selected: any) => {
      if (onChange) {
        onChange({
          target: {
            name,
            value: selected ? selected.value : '',
          },
        });
      }
    };

    // Fallback ID to prevent SSR hydration mismatch for react-select instanceId
    const id = useId();

    // Assign indexes to options so we can efficiently limit the rendered items in DOM
    const indexedOptions = useMemo(() => {
      return (options || []).map((opt, idx) => ({
        ...opt,
        __index: idx,
      }));
    }, [options]);

    // High performance filter that limits initial open rendering to maxRenderedOptions
    const customFilterOption = (candidate: any, input: string) => {
      if (!input) {
        return candidate.data.__index < maxRenderedOptions;
      }
      const q = input.toLowerCase();
      const label = String(candidate.label || '').toLowerCase();
      const subtitle = String(candidate.data?.subtitle || '').toLowerCase();
      return label.includes(q) || subtitle.includes(q);
    };

    const commonClassNames = {
      control: (state: any) =>
        `!min-h-[40px] !bg-background !border-input !rounded-lg !shadow-sm hover:!border-accent ${
          state.isFocused ? '!border-primary !ring-1 !ring-primary' : ''
        } ${disabled ? '!opacity-50 !cursor-not-allowed' : ''} ${className || ''}`,
      menu: () => '!bg-popover !border !border-border !rounded-md !shadow-md !mt-1 !z-50',
      option: (state: any) =>
        `!cursor-pointer !px-3 !py-2 ${
          state.isSelected
            ? '!bg-primary !text-primary-foreground'
            : state.isFocused
            ? '!bg-accent !text-accent-foreground'
            : '!text-foreground hover:!bg-accent hover:!text-accent-foreground'
        }`,
      singleValue: () => '!text-foreground',
      input: () => '!text-foreground',
      placeholder: () => '!text-muted-foreground',
      dropdownIndicator: () => '!text-muted-foreground hover:!text-foreground',
      clearIndicator: () => '!text-muted-foreground hover:!text-foreground',
    };

    const commonStyles = {
      control: (base: any) => ({
        ...base,
        boxShadow: 'none',
        border: '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--background))',
      }),
      menuPortal: (base: any) => ({
        ...base,
        zIndex: 9999,
      }),
      menu: (base: any) => ({
        ...base,
        backgroundColor: 'hsl(var(--popover))',
      }),
      option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected
          ? 'hsl(var(--primary))'
          : state.isFocused
          ? 'hsl(var(--accent))'
          : 'transparent',
        color: state.isSelected
          ? 'hsl(var(--primary-foreground))'
          : 'hsl(var(--foreground))',
      }),
      singleValue: (base: any) => ({ ...base, color: 'hsl(var(--foreground))' }),
      input: (base: any) => ({ ...base, color: 'hsl(var(--foreground))' }),
    };

    const formatOptionLabel = (option: any) => (
      <div className="flex flex-col text-left">
        <span className="font-medium text-sm leading-tight">{option.label}</span>
        {option.subtitle && (
          <span className="text-xs text-muted-foreground mt-0.5 leading-tight">{option.subtitle}</span>
        )}
      </div>
    );

    if (loadOptions) {
      return (
        <AsyncSelect
          ref={ref}
          instanceId={id}
          name={name}
          value={selectedOption}
          onChange={handleChange}
          loadOptions={loadOptions}
          defaultOptions={defaultOptions}
          cacheOptions
          isDisabled={disabled}
          placeholder={placeholder || '-- Select --'}
          isClearable={!required}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
          menuPosition="fixed"
          classNames={commonClassNames}
          styles={commonStyles}
          formatOptionLabel={formatOptionLabel}
          {...(props as any)}
        />
      );
    }

    return (
      <Select
        ref={ref}
        instanceId={id}
        name={name}
        value={selectedOption}
        onChange={handleChange}
        options={indexedOptions}
        filterOption={customFilterOption}
        isDisabled={disabled}
        placeholder={placeholder || '-- Select --'}
        isClearable={!required}
        isSearchable={true}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        menuPosition="fixed"
        classNames={commonClassNames}
        styles={commonStyles}
        formatOptionLabel={formatOptionLabel}
        {...props}
      />
    );
  },
);

SearchableSelect.displayName = 'SearchableSelect';
