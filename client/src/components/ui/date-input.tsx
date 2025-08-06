import React from "react";
import DatePicker from "react-datepicker";
import InputMask from "react-input-mask";
import "react-datepicker/dist/react-datepicker.css";

interface DateInputProps {
  value?: string | Date | null;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function DateInput({ 
  value, 
  onChange, 
  placeholder = "DD/MM/YYYY", 
  className,
  id 
}: DateInputProps) {
  // Convert value to Date object for react-datepicker
  const dateValue = value ? new Date(value) : null;

  const handleDateChange = (date: Date | null) => {
    if (date) {
      onChange(date.toISOString());
    } else {
      onChange("");
    }
  };

  // Custom input component with mask
  const MaskedInput = React.forwardRef<HTMLInputElement, any>((props, ref) => {
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // When focused, select all text so typing overwrites
      setTimeout(() => {
        e.target.select();
      }, 0);
      
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      // On click, if at the beginning (position 0), select all
      const target = e.target as HTMLInputElement;
      if (target.selectionStart === 0) {
        setTimeout(() => {
          target.select();
        }, 0);
      }
      
      if (props.onClick) {
        props.onClick(e);
      }
    };

    return (
      <InputMask
        {...props}
        ref={ref}
        mask="99/99/9999"
        placeholder="DD/MM/YYYY"
        maskChar="_"
        onFocus={handleFocus}
        onClick={handleClick}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
      />
    );
  });

  MaskedInput.displayName = "MaskedInput";

  return (
    <DatePicker
      id={id}
      selected={dateValue}
      onChange={handleDateChange}
      dateFormat="dd/MM/yyyy"
      customInput={<MaskedInput />}
      autoComplete="off"
      showYearDropdown
      showMonthDropdown
      dropdownMode="select"
      yearDropdownItemNumber={15}
      scrollableYearDropdown
    />
  );
}