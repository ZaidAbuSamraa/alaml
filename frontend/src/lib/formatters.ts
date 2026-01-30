// Date and number formatting utilities
// All dates and numbers will be displayed in English with numeric months

/**
 * Format date as DD/MM/YYYY with English numbers
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format time as HH:MM with English numbers
 */
export function formatTime(date: string | Date): string {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format datetime as DD/MM/YYYY HH:MM with English numbers
 */
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Convert any number to English digits (in case Arabic numerals are used)
 */
export function toEnglishNumber(num: number | string): string {
  return num.toString();
}
