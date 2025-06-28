import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationInfo } from '../types/news';

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ pagination, onPageChange }) => {
  const { page, totalPages, hasPreviousPage, hasNextPage } = pagination;

  // Don't render pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  // Generate array of page numbers to display
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisible = 5; // Maximum number of page buttons to show
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, current page area, and last page with ellipsis
      pages.push(1);
      
      if (page > 3) {
        pages.push(-1); // Represents ellipsis
      }
      
      // Show current page and adjacent pages
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (page < totalPages - 2) {
        pages.push(-1); // Represents ellipsis
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex items-center justify-center space-x-2 mt-8" aria-label="Pagination">
      {/* Previous page button */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPreviousPage}
        className={`
          flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-colors
          ${hasPreviousPage
            ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            : 'text-gray-300 cursor-not-allowed'
          }
        `}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Previous
      </button>

      {/* Page number buttons */}
      <div className="flex items-center space-x-1">
        {pageNumbers.map((pageNum, index) => {
          if (pageNum === -1) {
            // Ellipsis
            return (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
                ...
              </span>
            );
          }

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`
                px-3 py-2 rounded-lg font-medium transition-colors
                ${pageNum === page
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
              aria-label={`Go to page ${pageNum}`}
              aria-current={pageNum === page ? 'page' : undefined}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Next page button */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage}
        className={`
          flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-colors
          ${hasNextPage
            ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            : 'text-gray-300 cursor-not-allowed'
          }
        `}
        aria-label="Go to next page"
      >
        Next
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </nav>
  );
};

export default Pagination; 