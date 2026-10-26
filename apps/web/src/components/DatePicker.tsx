import React, { forwardRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string | number | readonly string[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, name, className, required, disabled, placeholder, ...props }, ref) => {
    const [internalDate, setInternalDate] = React.useState<Date | null>(null);

    // Parse the incoming 'YYYY-MM-DD' string to a local Date object without UTC shifts
    let dateValue: Date | null = null;
    if (value !== undefined) {
      if (value && typeof value === 'string' && value.trim() !== '') {
        const parts = value.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          dateValue = new Date(y, m, d);
        } else {
          dateValue = new Date(value);
        }
        if (isNaN(dateValue.getTime())) {
          dateValue = null;
        }
      }
    } else {
      dateValue = internalDate;
    }

    let hiddenValue = '';
    if (dateValue) {
      const y = dateValue.getFullYear();
      const m = String(dateValue.getMonth() + 1).padStart(2, '0');
      const d = String(dateValue.getDate()).padStart(2, '0');
      hiddenValue = `${y}-${m}-${d}`;
    }

    const handleChange = (date: Date | null) => {
      if (value === undefined) {
        setInternalDate(date);
      }
      
      let stringValue = '';
      if (date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        stringValue = `${y}-${m}-${d}`;
      }
      
      if (onChange) {
        const event = {
          target: {
            name,
            value: stringValue,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        
        onChange(event);
      }
    };

    return (
      <div className="relative w-full">
        <input 
          type="hidden" 
          name={name} 
          ref={ref} 
          value={hiddenValue} 
          required={required}
        />
        <ReactDatePicker
          {...(props as any)}
          selected={dateValue}
          onChange={handleChange}
          dateFormat="dd/MM/yyyy"
          className={className}
          disabled={disabled}
          placeholderText={placeholder || "DD/MM/YYYY"}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
