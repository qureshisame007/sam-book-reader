export type BookFormat = 'epub' | 'pdf' | 'txt';

export interface Book {
  id: string;
  title: string;
  author: string;
  format: BookFormat;
  coverDataUrl?: string;
  totalPages: number;
  currentPage: number;
  bookmarks: number[];
  dateAdded: number;
  fileSize?: number;
  // Page contents (strings for TXT/EPUB, or array buffer / ref for PDF)
  pages: string[]; 
  pdfData?: string; // base64 string for PDF raw data if needed
}

export type ReadingTheme = 'natural' | 'old' | 'dark';

export interface ReaderSettings {
  fontSize: number; // 14 to 26
  theme: ReadingTheme;
}

export interface SearchResult {
  pageNumber: number;
  snippet: string;
  matchIndex: number;
}

export interface TranslationState {
  isOpen: boolean;
  original: string;
  hinglish: string;
  loading: boolean;
  error?: string;
}
