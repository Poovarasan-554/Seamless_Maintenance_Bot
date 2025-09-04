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
