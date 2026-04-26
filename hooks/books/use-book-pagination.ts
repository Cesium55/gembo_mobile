import { useMemo } from 'react';

import { Fonts } from '@/constants/theme';
import { BookChapter } from '@/hooks/use-books-api';
import { ReaderFontFamily } from '@/providers/reader-preferences-provider';

const PAGE_TOP_PADDING = 12;
const PAGE_BOTTOM_PADDING = 32;
const PAGE_RIGHT_PADDING = 2;
const AVG_CHAR_WIDTH_FACTOR = 0.52;
const TITLE_LINES_RESERVE = 2;

type UseBookPaginationOptions = {
  fontFamily: ReaderFontFamily;
  fontSize: number;
  pageWidth: number;
  pageHeight: number;
};

export type PaginatedChapter = {
  chapterId: number;
  title: string;
  startPage: number;
};

export type ReaderPage = {
  chapterId: number;
  title: string | null;
  content: string;
};

export type ReaderTypography = {
  fontFamily: string | undefined;
  fontSize: number;
  lineHeight: number;
};

function normalizeContent(value: string): string {
  return value.replace(/\r\n/g, '\n').trim();
}

function getReaderFontFamily(fontFamily: ReaderFontFamily) {
  return Fonts[fontFamily];
}

function getReaderTypography(fontSize: number) {
  const normalizedSize = Math.round(fontSize);

  return {
    fontSize: normalizedSize,
    lineHeight: Math.round(normalizedSize * 1.65),
  };
}

function getChapterLabel(chapter: BookChapter) {
  return chapter.title?.trim() || `Глава ${chapter.position}`;
}

function splitLineByWidth(line: string, charsPerLine: number) {
  if (!line.trim()) {
    return [''];
  }

  const words = line.split(/\s+/).filter(Boolean);
  const wrapped: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length <= charsPerLine) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      wrapped.push(currentLine);
      currentLine = word;
      continue;
    }

    wrapped.push(word);
  }

  if (currentLine) {
    wrapped.push(currentLine);
  }

  return wrapped.length ? wrapped : [''];
}

function splitContentIntoLines(content: string, charsPerLine: number) {
  if (!content) {
    return [''];
  }

  return content.split('\n').flatMap((line) => splitLineByWidth(line, charsPerLine));
}

function paginateChapter(chapter: BookChapter, charsPerLine: number, linesPerPage: number): ReaderPage[] {
  const title = getChapterLabel(chapter);
  const lines = splitContentIntoLines(normalizeContent(chapter.content ?? ''), charsPerLine);
  const pages: ReaderPage[] = [];
  let lineIndex = 0;
  let isFirstPage = true;

  while (lineIndex < lines.length || (isFirstPage && !pages.length)) {
    const reservedLines = isFirstPage ? TITLE_LINES_RESERVE : 0;
    const availableLines = Math.max(linesPerPage - reservedLines, 1);
    const pageLines = lines.slice(lineIndex, lineIndex + availableLines);

    pages.push({
      chapterId: chapter.id,
      title: isFirstPage ? title : null,
      content: pageLines.join('\n').trimEnd(),
    });

    lineIndex += availableLines;
    isFirstPage = false;
  }

  return pages.length ? pages : [{ chapterId: chapter.id, title, content: '' }];
}

export function useBookPagination(chapters: BookChapter[], options: UseBookPaginationOptions) {
  const typography = useMemo<ReaderTypography>(() => {
    const metrics = getReaderTypography(options.fontSize);

    return {
      fontFamily: getReaderFontFamily(options.fontFamily),
      fontSize: metrics.fontSize,
      lineHeight: metrics.lineHeight,
    };
  }, [options.fontFamily, options.fontSize]);

  const charsPerLine = useMemo(() => {
    if (options.pageWidth <= 0) {
      return 0;
    }

    const availableWidth = Math.max(options.pageWidth - PAGE_RIGHT_PADDING, typography.fontSize);
    return Math.max(Math.floor(availableWidth / (typography.fontSize * AVG_CHAR_WIDTH_FACTOR)), 1);
  }, [options.pageWidth, typography.fontSize]);

  const linesPerPage = useMemo(() => {
    if (options.pageHeight <= 0) {
      return 0;
    }

    const availableHeight = Math.max(options.pageHeight - PAGE_TOP_PADDING - PAGE_BOTTOM_PADDING, typography.lineHeight);
    return Math.max(Math.floor(availableHeight / typography.lineHeight), 1);
  }, [options.pageHeight, typography.lineHeight]);

  const paginated = useMemo(() => {
    if (!chapters.length || charsPerLine <= 0 || linesPerPage <= 0) {
      return {
        pages: [] as ReaderPage[],
        chapters: [] as PaginatedChapter[],
      };
    }

    const pages: ReaderPage[] = [];
    const chapterPages: PaginatedChapter[] = [];

    chapters
      .slice()
      .sort((left, right) => left.position - right.position)
      .forEach((chapter) => {
        chapterPages.push({
          chapterId: chapter.id,
          title: getChapterLabel(chapter),
          startPage: pages.length,
        });
        pages.push(...paginateChapter(chapter, charsPerLine, linesPerPage));
      });

    return {
      pages,
      chapters: chapterPages,
    };
  }, [chapters, charsPerLine, linesPerPage]);

  return {
    ...paginated,
    typography,
  };
}
