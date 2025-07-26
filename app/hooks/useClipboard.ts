import { useCallback, useState } from 'react';

export interface ClipboardHook {
  pasteFromClipboard: () => Promise<string | null>;
  supportsClipboard: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useClipboard(): ClipboardHook {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Clipboard API is supported
  const supportsClipboard = typeof navigator !== 'undefined' && Boolean(
    navigator.clipboard && typeof navigator.clipboard.readText === 'function'
  );

  const pasteFromClipboard = useCallback(async (): Promise<string | null> => {
    if (!supportsClipboard) {
      setError('Clipboard API is not supported in this browser');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request clipboard permission and read text
      const text = await navigator.clipboard.readText();

      if (!text || text.trim().length === 0) {
        setError('Clipboard is empty or contains no text');
        return null;
      }

      return text;
    } catch (err) {
      console.error('Clipboard read error:', err);

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError(
            'Clipboard access denied. Please grant permission to read clipboard.',
          );
        } else if (err.name === 'NotFoundError') {
          setError('No text found in clipboard');
        } else {
          setError(`Failed to read clipboard: ${err.message}`);
        }
      } else {
        setError('Failed to read clipboard: Unknown error');
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supportsClipboard]);

  return {
    pasteFromClipboard,
    supportsClipboard,
    isLoading,
    error,
  };
}