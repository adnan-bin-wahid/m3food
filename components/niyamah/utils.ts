import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function discountPercent(original: number, price: number) { return original > 0 ? Math.round((1 - price / original) * 100) : 0; }
export function formatCurrency(value: number) { return `BDT ${value.toLocaleString('en-US')}`; }
