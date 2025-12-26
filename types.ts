
import { 
  Utensils, 
  ShoppingBag, 
  Car, 
  ReceiptText, 
  Ticket, 
  HeartPulse, 
  Briefcase, 
  Plane, 
  MoreHorizontal,
  HelpCircle
} from 'lucide-react';

export interface ReceiptData {
  id: string;
  amount: number;
  currency: string;
  date: string;
  vendor: string;
  category: string;
  description: string;
  imageUrl?: string;
  status: 'pending' | 'submitted';
}

export type FormFieldKey = 'amount' | 'date' | 'vendor' | 'category' | 'description';

export interface GoogleFormConfig {
  formUrl: string;
  fields: Record<FormFieldKey, string>;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CAPTURE = 'CAPTURE',
  REVIEW = 'REVIEW',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS',
  STATS = 'STATS'
}

export const CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transport',
  'Bills & Utilities',
  'Entertainment',
  'Health & Wellness',
  'Business',
  'Travel',
  'Other'
];

export const CATEGORY_ICONS: Record<string, any> = {
  'Food & Dining': Utensils,
  'Shopping': ShoppingBag,
  'Transport': Car,
  'Bills & Utilities': ReceiptText,
  'Entertainment': Ticket,
  'Health & Wellness': HeartPulse,
  'Business': Briefcase,
  'Travel': Plane,
  'Other': MoreHorizontal,
  'Fallback': HelpCircle
};

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#f59e0b',
  'Shopping': '#ec4899',
  'Transport': '#3b82f6',
  'Bills & Utilities': '#10b981',
  'Entertainment': '#8b5cf6',
  'Health & Wellness': '#ef4444',
  'Business': '#6366f1',
  'Travel': '#06b6d4',
  'Other': '#64748b'
};
