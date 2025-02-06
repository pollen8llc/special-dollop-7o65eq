import React, { useState, useCallback, useEffect, useRef } from 'react';
import debounce from 'lodash/debounce'; // v4.0.8
import { Button } from '../common/Button';
import { useProfiles } from '../../hooks/useProfiles';
import { QueryParams } from '../../types/common.types';
import { COLORS, TRANSITIONS } from '../../constants/theme';

interface SearchFormProps {
  /**
   * Callback function triggered when search is performed
   */
  onSearch: (term: string) => void;
  
  /**
   * Callback function triggered when search is cleared
   */
  onClear: () => void;
  
  /**
   * Initial search value
   */
  initialValue?: string;
  
  /**
   * Placeholder text for the search input
   */
  placeholder?: string;
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
  
  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
  
  /**
   * Loading state of the search
   */
  isLoading?: boolean;
  
  /**
   * Error message to display
   */
  error?: string;
}

/**
 * A reusable search form component with real-time search capabilities,
 * debounced input handling, and accessibility features.
 */
export const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  onClear,
  initialValue = '',
  placeholder = 'Search profiles...',
  className = '',
  ariaLabel = 'Search profiles',
  isLoading = false,
  error
}) => {
  // State management
  const [searchTerm, setSearchTerm] = useState<string>(initialValue);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { refreshProfiles } = useProfiles({});

  // Create debounced search handler
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      // Sanitize search term
      const sanitizedTerm = term.trim().toLowerCase();
      
      // Update URL query params
      const searchParams = new URLSearchParams(window.location.search);
      if (sanitizedTerm) {
        searchParams.set('search', sanitizedTerm);
      } else {
        searchParams.delete('search');
      }
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}?${searchParams.toString()}`
      );

      onSearch(sanitizedTerm);
      refreshProfiles();
    }, 300),
    [onSearch, refreshProfiles]
  );

  // Handle input changes
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = event.target.value;
    setSearchTerm(newTerm);
    debouncedSearch(newTerm);
  };

  // Handle form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    debouncedSearch.flush();
  };

  // Handle search clear
  const handleClear = () => {
    setSearchTerm('');
    onClear();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative w-full ${className}`}
      role="search"
      aria-label={ariaLabel}
    >
      <div className={`
        relative flex items-center w-full rounded-md
        border transition-all duration-200
        ${isFocused ? `border-[${COLORS.primary[500]}] ring-2 ring-[${COLORS.primary[100]}]` : 'border-input'}
        ${error ? `border-[${COLORS.error[500]}]` : ''}
        dark:bg-background
      `}>
        {/* Search Icon */}
        <span className="absolute left-3 flex items-center pointer-events-none">
          <svg
            className={`w-5 h-5 transition-colors ${
              isFocused ? `text-[${COLORS.primary[500]}]` : 'text-muted-foreground'
            }`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="search"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`
            w-full py-2 pl-10 pr-12
            bg-transparent text-foreground
            placeholder:text-muted-foreground
            focus:outline-none
            disabled:cursor-not-allowed
            disabled:opacity-50
          `}
          disabled={isLoading}
          aria-invalid={!!error}
          aria-describedby={error ? "search-error" : undefined}
        />

        {/* Clear Button */}
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2"
            aria-label="Clear search"
          >
            <svg
              className="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          id="search-error"
          className={`mt-1 text-sm text-[${COLORS.error[500]}] dark:text-[${COLORS.error.dark}]`}
          role="alert"
        >
          {error}
        </div>
      )}
    </form>
  );
};

export type { SearchFormProps };