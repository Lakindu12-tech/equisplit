import React from 'react';
import { 
  UtensilsCrossed, 
  Car, 
  Hotel, 
  Ticket, 
  ShoppingCart, 
  Zap, 
  Package,
  LucideIcon 
} from 'lucide-react';
import { Category } from '../../types';
import { CATEGORIES } from '../../constants/categories';

const ICON_MAP: Record<Category, LucideIcon> = {
  food: UtensilsCrossed,
  transport: Car,
  lodging: Hotel,
  entertainment: Ticket,
  groceries: ShoppingCart,
  utilities: Zap,
  general: Package,
};

interface CategoryIconProps {
  category: Category;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  category, 
  size = 'md',
  showLabel = false 
}) => {
  const cat = CATEGORIES[category] || CATEGORIES.general;
  const Icon = ICON_MAP[category] || Package;

  const sizeClasses = {
    sm: 'w-7 h-7 p-1.5 text-xs',
    md: 'w-10 h-10 p-2.5 text-sm',
    lg: 'w-12 h-12 p-3 text-base',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  return (
    <div className="inline-flex items-center gap-2">
      <div 
        className={`rounded-xl flex items-center justify-center transition-all ${sizeClasses[size]}`}
        style={{ 
          backgroundColor: cat.bgLight, 
          color: cat.color,
          border: `1px solid ${cat.color}33`
        }}
      >
        <Icon size={iconSizes[size]} />
      </div>
      {showLabel && (
        <span className="font-medium text-sm text-foreground/90">{cat.label}</span>
      )}
    </div>
  );
};
