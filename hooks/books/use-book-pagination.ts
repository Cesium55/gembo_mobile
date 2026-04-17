import { useMemo } from 'react';

const DEFAULT_CHARS_PER_PAGE = 1600;

function normalizeContent(value: string): string {
  return value.replace(/\r\n/g, '\n').trim();
}

function splitLongParagraph(paragraph: string, charsPerPage: number): string[] {
  if (paragraph.length <= charsPerPage) {
    return [paragraph];
  }

  const words = paragraph.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const word of words) {
    const candidate = currentChunk ? `${currentChunk} ${word}` : word;

    if (candidate.length <= charsPerPage) {
      currentChunk = candidate;
      continue;
    }

    if (currentChunk) {
      chunks.push(currentChunk);
      currentChunk = '';
    }

    let remainingWord = word;
    while (remainingWord.length > charsPerPage) {
      chunks.push(remainingWord.slice(0, charsPerPage));
      remainingWord = remainingWord.slice(charsPerPage);
    }

    currentChunk = remainingWord;
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function paginateContent(content: string, charsPerPage: number): string[] {
  const normalized = normalizeContent(content);

  if (!normalized) {
    return [''];
  }

  const paragraphs = normalized.split(/\n{2,}/).flatMap((paragraph) => splitLongParagraph(paragraph.trim(), charsPerPage));

  const pages: string[] = [];
  let currentPage = '';

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      continue;
    }

    const candidate = currentPage ? `${currentPage}\n\n${paragraph}` : paragraph;

    if (candidate.length <= charsPerPage) {
      currentPage = candidate;
      continue;
    }

    if (currentPage) {
      pages.push(currentPage);
    }

    currentPage = paragraph;
  }

  if (currentPage) {
    pages.push(currentPage);
  }

  return pages.length ? pages : [''];
}

export function useBookPagination(content: string, charsPerPage = DEFAULT_CHARS_PER_PAGE) {
  return useMemo(() => paginateContent(content, charsPerPage), [charsPerPage, content]);
}
