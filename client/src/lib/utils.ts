import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripHtmlTags(text: string): string {
  if (!text) return '';
  
  // Remove HTML tags
  let stripped = text.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  stripped = stripped
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
  
  // Clean up multiple spaces and line breaks
  stripped = stripped
    .replace(/\s+/g, ' ')
    .trim();
  
  return stripped;
}

export function formatToIST(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    // Parse the date string
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original if invalid
    }
    
    // Format using Intl API for proper IST conversion
    const istFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const formattedDate = istFormatter.format(date);
    // Convert from DD/MM/YYYY, HH:mm:ss to DD-MM-YYYY HH:mm:ss (IST)
    const formatted = formattedDate.replace(/\//g, '-').replace(',', '');
    return `${formatted} (IST)`;
  } catch (error) {
    return dateString; // Return original if error occurs
  }
}
