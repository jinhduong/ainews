import React from 'react';
import { Zap } from 'lucide-react';

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeCategory, onCategoryChange }) => {
  // Category configuration with icons and labels
  // Note: Only AI category remains - keeping this component for future extensibility
  const categories = [
    { id: 'artificial intelligence', label: 'AI', icon: Zap },
  ];

  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {categories.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onCategoryChange(id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200
            ${activeCategory === id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }
          `}
          aria-pressed={activeCategory === id}
          aria-label={`Switch to ${label} news category`}
        >
          {/* Category icon with semantic meaning */}
          <Icon className="w-4 h-4" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs; 