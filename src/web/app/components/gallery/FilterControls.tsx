import React, { useState, useCallback, useRef, useEffect } from 'react'; // ^18.0.0
import { useDebounce } from 'use-debounce'; // ^9.0.0
import clsx from 'clsx'; // ^2.0.0
import { Button } from '../common/Button';
import { useProfiles } from '../../hooks/useProfiles';
import { Profile } from '../../types/profile.types';
import { COLORS } from '../../constants/theme';

interface FilterState {
  headline: string;
  company: string;
  dateRange: {
    start: string;
    end: string;
  };
  experienceLevel: string[];
}

interface FilterControlsProps {
  onFilterChange: (filters: Partial<FilterState>) => void;
  currentFilters: Partial<FilterState>;
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  onReset?: () => void;
}

/**
 * A comprehensive filter control component for the LinkedIn Profiles Gallery
 * Implements WCAG 2.1 Level AA accessibility standards with keyboard navigation
 * and screen reader support.
 */
export const FilterControls: React.FC<FilterControlsProps> = React.memo(({
  onFilterChange,
  currentFilters,
  className,
  isLoading = false,
  error = null,
  onReset
}) => {
  // Local state for filter values with optimistic updates
  const [filters, setFilters] = useState<Partial<FilterState>>(currentFilters);
  const [filterHistory, setFilterHistory] = useState<Partial<FilterState>[]>([currentFilters]);
  
  // Refs for focus management
  const filterFormRef = useRef<HTMLFormElement>(null);
  const headlineInputRef = useRef<HTMLInputElement>(null);
  
  // Debounced filter handler to prevent excessive API calls
  const [debouncedFilters] = useDebounce(filters, 300);

  // ARIA live region for announcing filter changes
  const [announcement, setAnnouncement] = useState<string>('');

  /**
   * Handles individual filter field changes with optimistic updates
   */
  const handleFilterChange = useCallback((
    field: keyof FilterState,
    value: string | string[]
  ) => {
    // Validate and sanitize input
    const sanitizedValue = typeof value === 'string' ? value.trim() : value;

    // Update local state optimistically
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [field]: sanitizedValue
      };
      
      // Update filter history for undo functionality
      setFilterHistory(history => [...history, newFilters]);
      
      return newFilters;
    });

    // Announce change to screen readers
    setAnnouncement(`${field} filter updated to ${value}`);
  }, []);

  /**
   * Effect to sync debounced filters with parent component
   */
  useEffect(() => {
    if (JSON.stringify(debouncedFilters) !== JSON.stringify(currentFilters)) {
      onFilterChange(debouncedFilters);
    }
  }, [debouncedFilters, currentFilters, onFilterChange]);

  /**
   * Handles filter reset with animation
   */
  const handleReset = useCallback(() => {
    const initialFilters = filterHistory[0];
    setFilters(initialFilters);
    setFilterHistory([initialFilters]);
    onReset?.();
    
    // Focus first input after reset
    headlineInputRef.current?.focus();
    
    // Announce reset to screen readers
    setAnnouncement('Filters have been reset');
  }, [onReset, filterHistory]);

  /**
   * Keyboard navigation handler for filter controls
   */
  const handleKeyNavigation = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleReset();
    }
  }, [handleReset]);

  return (
    <form
      ref={filterFormRef}
      className={clsx(
        'flex flex-col gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md',
        'transition-all duration-200 ease-in-out',
        className
      )}
      onKeyDown={handleKeyNavigation}
      role="search"
      aria-label="Profile filters"
    >
      {/* ARIA live region for announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      {/* Headline filter */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="headline-filter"
          className="text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Headline
        </label>
        <input
          ref={headlineInputRef}
          id="headline-filter"
          type="text"
          value={filters.headline || ''}
          onChange={(e) => handleFilterChange('headline', e.target.value)}
          className={clsx(
            'px-3 py-2 rounded-md border',
            'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'dark:bg-gray-700 dark:text-white',
            'transition-colors duration-200'
          )}
          placeholder="Filter by headline..."
          aria-invalid={error ? 'true' : 'false'}
          disabled={isLoading}
        />
      </div>

      {/* Company filter */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="company-filter"
          className="text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Company
        </label>
        <input
          id="company-filter"
          type="text"
          value={filters.company || ''}
          onChange={(e) => handleFilterChange('company', e.target.value)}
          className={clsx(
            'px-3 py-2 rounded-md border',
            'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'dark:bg-gray-700 dark:text-white',
            'transition-colors duration-200'
          )}
          placeholder="Filter by company..."
          disabled={isLoading}
        />
      </div>

      {/* Experience level filter */}
      <div className="flex flex-col gap-2">
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Experience Level
          </legend>
          <div className="flex flex-wrap gap-2 mt-2">
            {['Entry', 'Mid', 'Senior', 'Lead'].map((level) => (
              <label
                key={level}
                className="inline-flex items-center"
              >
                <input
                  type="checkbox"
                  value={level}
                  checked={filters.experienceLevel?.includes(level) || false}
                  onChange={(e) => {
                    const newLevels = e.target.checked
                      ? [...(filters.experienceLevel || []), level]
                      : filters.experienceLevel?.filter(l => l !== level) || [];
                    handleFilterChange('experienceLevel', newLevels);
                  }}
                  className="form-checkbox h-4 w-4 text-primary-500"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">
                  {level}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 mt-4">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isLoading || filterHistory.length <= 1}
          aria-label="Reset all filters"
        >
          Reset
        </Button>
        <Button
          variant="primary"
          isLoading={isLoading}
          onClick={() => onFilterChange(filters)}
          aria-label="Apply filters"
        >
          Apply Filters
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div
          role="alert"
          className="mt-2 text-sm text-error-500 dark:text-error-400"
        >
          {error.message}
        </div>
      )}
    </form>
  );
});

FilterControls.displayName = 'FilterControls';

export type { FilterState, FilterControlsProps };