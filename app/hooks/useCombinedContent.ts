import { useMemo } from 'react';
import type { FileItem } from './useMultipleFiles';

interface CombinedContentOptions {
  showFileHeaders?: boolean;
  separator?: string;
}

export function useCombinedContent(
  files: FileItem[],
  options: CombinedContentOptions = {},
) {
  const { showFileHeaders = true, separator = '\n\n---\n\n' } = options;

  const combinedContent = useMemo(() => {
    if (files.length === 0) return '';
    if (files.length === 1) return files[0].content;

    return files
      .map((file, index) => {
        const sectionSeparator = index > 0 ? separator : '';
        const header = showFileHeaders ? `# ${file.name}\n\n` : '';
        return sectionSeparator + header + file.content;
      })
      .join('');
  }, [files, showFileHeaders, separator]);

  const stats = useMemo(() => {
    const totalChars = combinedContent.length;
    const totalWords = combinedContent
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const totalLines = combinedContent.split('\n').length;

    return {
      files: files.length,
      characters: totalChars,
      words: totalWords,
      lines: totalLines,
    };
  }, [combinedContent, files.length]);

  return {
    combinedContent,
    stats,
  };
}