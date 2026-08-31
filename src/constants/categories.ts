import { CategoryInfo, Category } from '../types';

export const CATEGORIES: Record<Category, CategoryInfo> = {
  food: {
    id: 'food',
    label: 'Food & Drinks',
    icon: 'UtensilsCrossed',
    color: '#10b981', // Emerald
    bgLight: 'rgba(16, 185, 129, 0.15)',
  },
  transport: {
    id: 'transport',
    label: 'Transportation',
    icon: 'Car',
    color: '#3b82f6', // Blue
    bgLight: 'rgba(59, 130, 246, 0.15)',
  },
  lodging: {
    id: 'lodging',
    label: 'Stay & Hotels',
    icon: 'Hotel',
    color: '#8b5cf6', // Purple
    bgLight: 'rgba(139, 92, 246, 0.15)',
  },
  entertainment: {
    id: 'entertainment',
    label: 'Entertainment',
    icon: 'Ticket',
    color: '#ec4899', // Pink
    bgLight: 'rgba(236, 72, 153, 0.15)',
  },
  groceries: {
    id: 'groceries',
    label: 'Groceries',
    icon: 'ShoppingCart',
    color: '#f59e0b', // Amber
    bgLight: 'rgba(245, 158, 11, 0.15)',
  },
  utilities: {
    id: 'utilities',
    label: 'Bills & Utilities',
    icon: 'Zap',
    color: '#06b6d4', // Cyan
    bgLight: 'rgba(6, 182, 212, 0.15)',
  },
  general: {
    id: 'general',
    label: 'General & Other',
    icon: 'Package',
    color: '#64748b', // Slate
    bgLight: 'rgba(100, 116, 139, 0.15)',
  },
};
