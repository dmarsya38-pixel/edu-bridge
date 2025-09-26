'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { navigateToSearch } from '@/lib/dashboard-navigation';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  autoFocus?: boolean;
  showSuggestions?: boolean;
  value?: string;
}

export function SearchBar({
  placeholder = "Search materials, subjects, programmes...",
  className = "",
  onSearch,
  autoFocus = false,
  showSuggestions = true,
  value: controlledValue
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(controlledValue || '');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Handle controlled value changes
  useEffect(() => {
    if (controlledValue !== undefined) {
      setQuery(controlledValue);
    }
  }, [controlledValue]);

  // Handle keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }

      // Escape key to clear search
      if (event.key === 'Escape' && isFocused) {
        setQuery('');
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  // Load suggestions based on query
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2 || !showSuggestions) {
      setSuggestions([]);
      return;
    }

    const loadSuggestions = async () => {
      setIsLoading(true);
      try {
        // This would be implemented later with actual suggestion logic
        // For now, we'll use mock suggestions
        const mockSuggestions = [
          `${debouncedQuery} notes`,
          `${debouncedQuery} exam papers`,
          `${debouncedQuery} database`,
          `${debouncedQuery} programming`
        ].filter(s => s.toLowerCase().includes(debouncedQuery.toLowerCase()));

        setSuggestions(mockSuggestions.slice(0, 5));
      } catch (error) {
        console.error('Error loading suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSuggestions();
  }, [debouncedQuery, showSuggestions]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (onSearch) {
      onSearch(query.trim());
    } else {
      navigateToSearch(router, query.trim());
    }

    setIsFocused(false);
    setSuggestions([]);
  }, [query, onSearch, router]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
    if (onSearch) {
      onSearch(suggestion);
    } else {
      navigateToSearch(router, suggestion);
    }
    setIsFocused(false);
    setSuggestions([]);
  }, [onSearch, router]);

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Search Input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Delay hiding suggestions to allow clicking
              setTimeout(() => setIsFocused(false), 200);
            }}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`
              w-full pl-10 pr-4 py-2.5
              bg-white dark:bg-gray-800
              border border-gray-300 dark:border-gray-600
              rounded-lg
              text-gray-900 dark:text-gray-100
              placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-colors
              ${isFocused ? 'ring-2 ring-blue-500 border-transparent' : ''}
            `}
          />

          {/* Search Icon */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2
                text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Keyboard Shortcut Hint */}
          {!query && !isFocused && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2
              text-xs text-gray-400 dark:text-gray-500 pointer-events-none">
              <span className="hidden sm:inline">Ctrl+K</span>
            </div>
          )}
        </div>

        {/* Search Button (hidden, form submits on Enter) */}
        <button type="submit" className="hidden" />
      </form>

      {/* Suggestions Dropdown */}
      {isFocused && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-1
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          rounded-lg shadow-lg
          z-50 max-h-60 overflow-y-auto">

          {isLoading ? (
            <div className="p-4 text-center">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Loading suggestions...
              </p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left
                    text-gray-900 dark:text-gray-100
                    hover:bg-gray-50 dark:hover:bg-gray-700
                    transition-colors
                    flex items-center space-x-2"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-sm">{suggestion}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No suggestions found
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}