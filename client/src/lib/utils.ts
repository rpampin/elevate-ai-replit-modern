import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date utility functions for DD/MM/YYYY format
export function formatDateForDisplay(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

export function parseDateFromInput(dateString: string): string {
  if (!dateString) return '';
  
  try {
    // Handle DD/MM/YYYY format
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString().split('T')[0]; // Return YYYY-MM-DD for storage
      }
    }
    
    // Fallback for other formats
    const dateObj = new Date(dateString);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
    
    return '';
  } catch {
    return '';
  }
}

export function convertInputDateToISO(dateString: string): string | null {
  if (!dateString) return null;
  
  try {
    // Handle DD/MM/YYYY format
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts.map(p => p.trim());
      
      // Validate each part
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (dayNum >= 1 && dayNum <= 31 && 
          monthNum >= 1 && monthNum <= 12 && 
          yearNum >= 1900 && yearNum <= 2100) {
        
        const dateObj = new Date(yearNum, monthNum - 1, dayNum);
        if (!isNaN(dateObj.getTime()) && 
            dateObj.getDate() === dayNum && 
            dateObj.getMonth() === monthNum - 1 && 
            dateObj.getFullYear() === yearNum) {
          return dateObj.toISOString();
        }
      }
    }
    
    return null;
  } catch {
    return null;
  }
}
