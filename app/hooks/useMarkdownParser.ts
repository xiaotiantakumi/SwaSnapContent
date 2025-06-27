import { useMemo } from 'react';
import { useDebounce } from './useDebounce';
import { DEBOUNCE_DELAY } from '../lib/markdown-constants';

/**
 * Custom hook for debounced markdown parsing
 * Prevents excessive re-renders during typing
 */
export function useMarkdownParser(
  content: string,
  delay: number = DEBOUNCE_DELAY,
) {
  const debouncedContent = useDebounce(content, delay);

  // Memoize the parsed content to avoid unnecessary processing
  const parsedContent = useMemo(() => {
    return debouncedContent;
  }, [debouncedContent]);

  return {
    parsedContent,
    isDebouncing: content !== debouncedContent,
  };
}