import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Book, ReaderSettings, SearchResult, ReadingTheme } from '../types';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bookmark as BookmarkIcon,
  BookmarkCheck,
  Search,
  Settings,
  Languages,
  X,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReaderProps {
  book: Book;
  settings: ReaderSettings;
  onUpdatePosition: (bookId: string, page: number) => void;
  onToggleBookmark: (bookId: string, page: number) => void;
  onBackToLibrary: () => void;
  onOpenSettings: () => void;
  onRequestTranslate: (text: string) => void;
}

export const Reader: React.FC<ReaderProps> = ({
  book,
  settings,
  onUpdatePosition,
  onToggleBookmark,
  onBackToLibrary,
  onOpenSettings,
  onRequestTranslate,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(book.currentPage || 1);
  const [isTwoPage, setIsTwoPage] = useState<boolean>(false);
  const [turnDirection, setTurnDirection] = useState<'next' | 'prev'>('next');
  
  // Panels
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);

  // Text selection for translation
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect two-page vs single-page layout based on window width
  useEffect(() => {
    const checkLayout = () => {
      const width = window.innerWidth;
      setIsTwoPage(width >= 960);
    };
    checkLayout();
    window.addEventListener('resize', checkLayout);
    return () => window.removeEventListener('resize', checkLayout);
  }, []);

  // Update book reading position when page changes
  useEffect(() => {
    onUpdatePosition(book.id, currentPage);
  }, [book.id, currentPage, onUpdatePosition]);

  // Turn page handlers
  const goToNextPage = useCallback(() => {
    const step = isTwoPage ? 2 : 1;
    if (currentPage + step <= book.totalPages + (isTwoPage && (book.totalPages % 2 !== 0) ? 1 : 0)) {
      setTurnDirection('next');
      setCurrentPage((prev) => Math.min(prev + step, book.totalPages));
    }
  }, [currentPage, isTwoPage, book.totalPages]);

  const goToPrevPage = useCallback(() => {
    const step = isTwoPage ? 2 : 1;
    if (currentPage > 1) {
      setTurnDirection('prev');
      setCurrentPage((prev) => Math.max(1, prev - step));
    }
  }, [currentPage, isTwoPage]);

  // Keyboard navigation: Right Arrow / Left Arrow / Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSearchOpen && document.activeElement === searchInputRef.current) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevPage();
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsBookmarksOpen(false);
        setSelectedText('');
        setSelectionPosition(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPrevPage, isSearchOpen]);

  // Text selection handler for Hinglish translation
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectedText('');
      setSelectionPosition(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 2) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(text);
      setSelectionPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    } else {
      setSelectedText('');
      setSelectionPosition(null);
    }
  };

  // Search inside book
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    book.pages.forEach((pageText, idx) => {
      const lower = pageText.toLowerCase();
      let matchIdx = lower.indexOf(q);
      while (matchIdx !== -1 && results.length < 50) {
        const start = Math.max(0, matchIdx - 40);
        const end = Math.min(pageText.length, matchIdx + q.length + 50);
        let snippet = pageText.substring(start, end).replace(/\n+/g, ' ');
        if (start > 0) snippet = '...' + snippet;
        if (end < pageText.length) snippet = snippet + '...';

        results.push({
          pageNumber: idx + 1,
          snippet,
          matchIndex: matchIdx,
        });

        matchIdx = lower.indexOf(q, matchIdx + q.length);
      }
    });

    setSearchResults(results);
  };

  // Determine current page indices
  const leftPageNum = isTwoPage
    ? currentPage % 2 === 1
      ? currentPage
      : currentPage - 1
    : currentPage;
  const rightPageNum = isTwoPage ? leftPageNum + 1 : null;

  const leftPageText = book.pages[leftPageNum - 1] || '';
  const rightPageText = rightPageNum && rightPageNum <= book.totalPages ? book.pages[rightPageNum - 1] : '';

  const isCurrentBookmarked =
    book.bookmarks.includes(leftPageNum) || (rightPageNum ? book.bookmarks.includes(rightPageNum) : false);

  const readingPercentage = Math.round((currentPage / (book.totalPages || 1)) * 100);

  // Theme styling definitions matching Clean Minimalism
  const getThemeStyles = (theme: ReadingTheme) => {
    switch (theme) {
      case 'old':
        return {
          wrapperBg: 'bg-[#EFE7D3]',
          paperBg: 'paper-texture-old',
          textColor: 'text-[#33251A]',
          secondaryText: 'text-[#85735F]',
          pageBorder: 'border-[#DAC8A8]',
          spineGradient: 'from-transparent via-[#C7B799] to-transparent',
          topBarBg: 'bg-[#EFE7D3]',
          topBarBorder: 'border-[#D8C7A5]',
          headerTitle: 'text-[#7D6B5A]',
          headerAuthor: 'text-[#A68A64]',
          progressBarBg: 'bg-[#DAC8A8]',
          progressFill: 'bg-[#9A7D58]',
          drawerBg: 'bg-[#FAF4E6]',
          drawerBorder: 'border-[#D8C7A5]',
        };
      case 'dark':
        return {
          wrapperBg: 'bg-[#181818]',
          paperBg: 'paper-texture-dark',
          textColor: 'text-[#E5DDD0]',
          secondaryText: 'text-[#968E82]',
          pageBorder: 'border-[#2C2926]',
          spineGradient: 'from-transparent via-[#332F2B] to-transparent',
          topBarBg: 'bg-[#1A1A1A]',
          topBarBorder: 'border-[#2D2A26]',
          headerTitle: 'text-[#8C8375]',
          headerAuthor: 'text-[#A68A64]',
          progressBarBg: 'bg-[#2E2A26]',
          progressFill: 'bg-[#A68A64]',
          drawerBg: 'bg-[#22201D]',
          drawerBorder: 'border-[#38332E]',
        };
      case 'natural':
      default:
        return {
          wrapperBg: 'bg-[#F8F3E9]',
          paperBg: 'paper-texture-natural',
          textColor: 'text-[#332F2C]',
          secondaryText: 'text-[#8C8375]',
          pageBorder: 'border-[#E0D8C8]',
          spineGradient: 'from-transparent via-[#D6CDBA] to-transparent',
          topBarBg: 'bg-[#F8F3E9]',
          topBarBorder: 'border-[#E0D8C8]',
          headerTitle: 'text-[#8C8375]',
          headerAuthor: 'text-[#A68A64]',
          progressBarBg: 'bg-[#E0D8C8]',
          progressFill: 'bg-[#A68A64]',
          drawerBg: 'bg-[#FAF6EE]',
          drawerBorder: 'border-[#D6CDBA]',
        };
    }
  };

  const themeStyle = getThemeStyles(settings.theme);

  return (
    <div
      ref={containerRef}
      id="reader-view"
      onMouseUp={handleMouseUp}
      className={`flex-1 flex flex-col ${themeStyle.wrapperBg} relative select-none overflow-hidden h-full`}
    >
      {/* ── CLEAN MINIMALIST HEADER ── */}
      <header
        id="reader-top-bar"
        className={`h-14 px-6 sm:px-10 ${themeStyle.topBarBg} border-b ${themeStyle.topBarBorder} flex items-center justify-between z-30 flex-shrink-0`}
      >
        {/* Left: Return to Library + Book Metadata */}
        <div className="flex items-center gap-4">
          <button
            id="btn-back-library"
            onClick={onBackToLibrary}
            className="flex items-center gap-1.5 text-xs text-[#8C8375] hover:text-[#2D2926] transition-colors cursor-pointer py-1"
            title="Return to bookshelf"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-bold uppercase tracking-widest text-[10px]">Library</span>
          </button>

          <div className="w-px h-3 bg-[#D6CDBA]" />

          <div className="flex items-center gap-3 truncate max-w-[220px] sm:max-w-xs md:max-w-md">
            <h1 className={`text-xs font-bold tracking-[0.2em] uppercase ${themeStyle.headerTitle} truncate`}>
              {book.title}
            </h1>
            <div className="w-px h-3 bg-[#D6CDBA] hidden sm:block" />
            <span className={`text-[10px] font-medium ${themeStyle.headerAuthor} uppercase tracking-wider hidden sm:inline truncate`}>
              {book.author}
            </span>
          </div>
        </div>

        {/* Right: Actions (Search, Bookmark, Settings, Page Number) */}
        <div className="flex items-center gap-6 sm:gap-8">
          {/* Search Toggle */}
          <div
            id="btn-toggle-search"
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              setIsBookmarksOpen(false);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className={`flex items-center gap-1.5 cursor-pointer hover:opacity-75 transition-opacity ${
              isSearchOpen ? 'text-[#A68A64]' : 'text-[#8C8375]'
            }`}
            title="Search inside book"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold tracking-widest uppercase hidden sm:inline">
              Search
            </span>
          </div>

          {/* Bookmark Toggle */}
          <div
            id="btn-toggle-bookmark"
            onClick={() => onToggleBookmark(book.id, currentPage)}
            className={`flex items-center gap-1.5 cursor-pointer hover:opacity-75 transition-opacity ${
              isCurrentBookmarked ? 'text-[#A68A64]' : 'text-[#8C8375]'
            }`}
            title={isCurrentBookmarked ? 'Remove saved bookmark' : 'Bookmark this page'}
          >
            {isCurrentBookmarked ? (
              <BookmarkCheck className="w-3.5 h-3.5" />
            ) : (
              <BookmarkIcon className="w-3.5 h-3.5" />
            )}
            <span className="text-[10px] font-bold tracking-widest uppercase hidden sm:inline">
              Bookmark
            </span>
          </div>

          {/* Bookmarks Drawer Trigger */}
          {book.bookmarks.length > 0 && (
            <div
              id="btn-view-bookmarks"
              onClick={() => {
                setIsBookmarksOpen(!isBookmarksOpen);
                setIsSearchOpen(false);
              }}
              className="text-[10px] font-bold tracking-widest uppercase text-[#8C8375] hover:text-[#A68A64] cursor-pointer transition-colors"
              title="View bookmarks list"
            >
              Saved ({book.bookmarks.length})
            </div>
          )}

          {/* Settings */}
          <button
            id="btn-reader-settings"
            onClick={onOpenSettings}
            className="p-1 text-[#8C8375] hover:text-[#2D2926] transition-colors cursor-pointer"
            title="Reading Preferences"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Page indicator */}
          <span className="text-xs font-mono font-medium text-[#5D5447]">
            {isTwoPage && rightPageNum && rightPageNum <= book.totalPages
              ? `${leftPageNum}-${rightPageNum} / ${book.totalPages}`
              : `${leftPageNum} / ${book.totalPages}`}
          </span>
        </div>
      </header>

      {/* ── SEARCH DRAWER ── */}
      {isSearchOpen && (
        <div
          id="reader-search-drawer"
          className={`absolute top-14 right-0 w-80 max-w-full ${themeStyle.drawerBg} border-l border-b ${themeStyle.drawerBorder} shadow-lg z-40 p-4 flex flex-col text-[#2D2926]`}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#8C8375] flex items-center gap-2">
              <Search className="w-3 h-3 text-[#A68A64]" /> Search inside book
            </span>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="p-1 text-[#8C8375] hover:text-black rounded cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="relative mb-3">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Type phrase to search..."
              className="w-full bg-white/70 border border-[#D6CDBA] focus:border-[#A68A64] rounded px-3 py-1.5 text-xs text-[#2D2926] placeholder-[#8C8375] focus:outline-none"
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {searchQuery && searchResults.length === 0 ? (
              <p className="text-xs text-[#8C8375] text-center py-4 italic font-serif">
                No matching passages found.
              </p>
            ) : (
              searchResults.map((res, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setCurrentPage(res.pageNumber);
                    setIsSearchOpen(false);
                  }}
                  className="p-2 bg-white/60 hover:bg-white rounded border border-[#E0D8C8] hover:border-[#A68A64] transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] text-[#A68A64] font-mono mb-1 font-bold">
                    <span>PAGE {res.pageNumber}</span>
                  </div>
                  <p className="font-serif text-[#332F2C] line-clamp-2 text-[11px] leading-relaxed">
                    {res.snippet}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── BOOKMARKS DRAWER ── */}
      {isBookmarksOpen && (
        <div
          id="reader-bookmarks-drawer"
          className={`absolute top-14 right-0 w-72 max-w-full ${themeStyle.drawerBg} border-l border-b ${themeStyle.drawerBorder} shadow-lg z-40 p-4 flex flex-col text-[#2D2926]`}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#8C8375] flex items-center gap-2">
              <BookmarkIcon className="w-3 h-3 text-[#A68A64]" /> Bookmarked Pages
            </span>
            <button
              onClick={() => setIsBookmarksOpen(false)}
              className="p-1 text-[#8C8375] hover:text-black rounded cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {book.bookmarks.length === 0 ? (
              <p className="text-xs text-[#8C8375] text-center py-4 italic font-serif">
                No saved bookmarks yet.
              </p>
            ) : (
              book.bookmarks
                .sort((a, b) => a - b)
                .map((pg) => {
                  const snippet = book.pages[pg - 1]?.slice(0, 75).replace(/\n+/g, ' ') || '';
                  return (
                    <div
                      key={pg}
                      onClick={() => {
                        setCurrentPage(pg);
                        setIsBookmarksOpen(false);
                      }}
                      className="p-2.5 bg-white/60 hover:bg-white rounded border border-[#E0D8C8] hover:border-[#A68A64] transition-colors cursor-pointer text-xs flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-mono text-[10px] font-bold text-[#A68A64] block tracking-wider uppercase">
                          Page {pg}
                        </span>
                        <p className="text-[10px] text-[#5D5447] font-serif line-clamp-1 italic">
                          {snippet}...
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(book.id, pg);
                        }}
                        className="p-1 text-[#8C8375] hover:text-[#8C2E2E] opacity-60 group-hover:opacity-100 transition-opacity"
                        title="Delete bookmark"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* ── FLOATING TRANSLATE PILL ON TEXT SELECTION ── */}
      {selectedText && selectionPosition && (
        <div
          id="floating-translate-pill"
          style={{
            position: 'fixed',
            left: `${selectionPosition.x}px`,
            top: `${selectionPosition.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-50 shadow-md"
        >
          <button
            onClick={() => {
              onRequestTranslate(selectedText);
              setSelectedText('');
              setSelectionPosition(null);
            }}
            className="flex items-center gap-1.5 bg-[#A68A64] hover:bg-[#947854] text-[#FAF4EA] px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95"
          >
            <Languages className="w-3 h-3" />
            <span>Translate</span>
          </button>
        </div>
      )}

      {/* ── PHYSICAL CLEAN MINIMALIST BOOK READING CANVAS ── */}
      <div className="flex-1 flex items-stretch px-6 sm:px-12 md:px-16 py-6 sm:py-8 overflow-hidden relative">
        {/* Previous page arrow */}
        <button
          id="btn-prev-page"
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#EFE7D3]/80 hover:bg-[#EAE0CA] text-[#5D5447] disabled:opacity-0 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer shadow-xs"
          title="Previous Page (Left Arrow)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Next page arrow */}
        <button
          id="btn-next-page"
          onClick={goToNextPage}
          disabled={currentPage >= book.totalPages}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#EFE7D3]/80 hover:bg-[#EAE0CA] text-[#5D5447] disabled:opacity-0 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer shadow-xs"
          title="Next Page (Right Arrow or Space)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Book Container with Central Subtle Gradient Divider */}
        <div
          id="physical-book-container"
          className="w-full max-w-5xl mx-auto flex items-stretch relative overflow-hidden"
        >
          {/* Subtle Vertical Spine Divider in 2-page mode */}
          {isTwoPage && (
            <div
              className={`absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b ${themeStyle.spineGradient} z-10 pointer-events-none`}
            />
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${currentPage}-${isTwoPage}`}
              initial={{ opacity: 0.85, x: turnDirection === 'next' ? 8 : -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0.85, x: turnDirection === 'next' ? -8 : 8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-full h-full flex gap-8 sm:gap-12"
            >
              {/* ── LEFT PAGE ── */}
              <div
                id={`page-${leftPageNum}`}
                className="flex-1 h-full flex flex-col justify-start overflow-hidden px-2 sm:px-4"
              >
                <article
                  className={`flex-1 overflow-y-auto reader-text-content font-serif ${themeStyle.textColor} text-justify tracking-tight pr-2`}
                  style={{
                    fontSize: `${settings.fontSize}px`,
                    lineHeight: '1.8',
                  }}
                >
                  {leftPageText.split(/\n\s*\n/).map((para, pIdx) => {
                    const isFirstPara = pIdx === 0 && (leftPageNum === 1 || para.length > 50);
                    return (
                      <p
                        key={pIdx}
                        className={`mb-6 ${
                          isFirstPara
                            ? 'first-letter:text-4xl sm:first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-2.5 first-letter:mt-0.5 first-letter:text-[#A68A64]'
                            : ''
                        }`}
                      >
                        {para}
                      </p>
                    );
                  })}
                </article>
              </div>

              {/* ── RIGHT PAGE (in 2-page mode) ── */}
              {isTwoPage && (
                <div
                  id={`page-${rightPageNum}`}
                  className="flex-1 h-full flex flex-col justify-start overflow-hidden px-2 sm:px-4"
                >
                  <article
                    className={`flex-1 overflow-y-auto reader-text-content font-serif ${themeStyle.textColor} text-justify tracking-tight pr-2`}
                    style={{
                      fontSize: `${settings.fontSize}px`,
                      lineHeight: '1.8',
                    }}
                  >
                    {rightPageText ? (
                      rightPageText.split(/\n\s*\n/).map((para, pIdx) => (
                        <p key={pIdx} className="mb-6">
                          {para}
                        </p>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs font-serif italic text-[#8C8375]">
                        End of volume
                      </div>
                    )}
                  </article>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── MINIMALIST FOOTER (Matching Design HTML) ── */}
      <footer
        id="reader-bottom-bar"
        className={`h-16 flex flex-col justify-center px-8 sm:px-16 border-t ${themeStyle.topBarBorder} ${themeStyle.topBarBg} z-30 flex-shrink-0`}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-[#8C8375] uppercase tracking-[0.2em]">
            Page {leftPageNum} {rightPageNum && rightPageNum <= book.totalPages ? `& ${rightPageNum}` : ''}
          </span>
          <span className="text-[10px] font-bold text-[#8C8375] uppercase tracking-[0.2em]">
            {readingPercentage}% Read
          </span>
        </div>

        {/* Thin minimalist progress bar */}
        <div className={`w-full h-[2px] ${themeStyle.progressBarBg} rounded-full overflow-hidden`}>
          <div
            className={`h-full ${themeStyle.progressFill} transition-all duration-300`}
            style={{ width: `${Math.min(100, Math.max(0, readingPercentage))}%` }}
          />
        </div>
      </footer>
    </div>
  );
};
