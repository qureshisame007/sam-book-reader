import { useState, useEffect, useCallback } from 'react';
import { Book, ReaderSettings, TranslationState } from './types';
import { TitleBar } from './components/TitleBar';
import { Library } from './components/Library';
import { Reader } from './components/Reader';
import { SettingsModal } from './components/SettingsModal';
import { TranslationModal } from './components/TranslationModal';
import { DownloadModal } from './components/DownloadModal';
import {
  getAllBooks,
  saveBook,
  deleteBook,
  updateReadingPosition,
  getSettings,
  saveSettings,
} from './utils/db';
import { SAMPLE_BOOKS } from './utils/bookParser';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [settings, setSettingsState] = useState<ReaderSettings>({
    fontSize: 18,
    theme: 'natural',
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [translationState, setTranslationState] = useState<TranslationState>({
    isOpen: false,
    original: '',
    hinglish: '',
    loading: false,
  });

  // Load books and settings from local IndexedDB on startup
  useEffect(() => {
    async function initData() {
      try {
        const storedSettings = await getSettings();
        setSettingsState(storedSettings);

        let storedBooks = await getAllBooks();
        if (!storedBooks || storedBooks.length === 0) {
          // Seed with preloaded sample classics so user can immediately read
          for (const sample of SAMPLE_BOOKS) {
            await saveBook(sample);
          }
          storedBooks = await getAllBooks();
        }
        setBooks(storedBooks);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    initData();
  }, []);

  const activeBook = books.find((b) => b.id === activeBookId) || null;

  // Handle book selection
  const handleOpenBook = (book: Book) => {
    setActiveBookId(book.id);
  };

  // Handle return to library
  const handleBackToLibrary = () => {
    setActiveBookId(null);
  };

  // Handle adding a new book
  const handleAddBook = async (newBook: Book) => {
    await saveBook(newBook);
    setBooks((prev) => [newBook, ...prev]);
    setActiveBookId(newBook.id);
  };

  // Handle removing a book
  const handleRemoveBook = async (bookId: string) => {
    await deleteBook(bookId);
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    if (activeBookId === bookId) {
      setActiveBookId(null);
    }
  };

  // Handle reading position update
  const handleUpdatePosition = useCallback(async (bookId: string, page: number) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, currentPage: page } : b))
    );
    await updateReadingPosition(bookId, page);
  }, []);

  // Handle bookmark toggle
  const handleToggleBookmark = useCallback(async (bookId: string, page: number) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === bookId) {
          const exists = b.bookmarks.includes(page);
          const updatedBookmarks = exists
            ? b.bookmarks.filter((p) => p !== page)
            : [...b.bookmarks, page].sort((x, y) => x - y);
          const updated = { ...b, bookmarks: updatedBookmarks };
          saveBook(updated);
          return updated;
        }
        return b;
      })
    );
  }, []);

  // Handle settings update
  const handleUpdateSettings = async (newSettings: ReaderSettings) => {
    setSettingsState(newSettings);
    await saveSettings(newSettings);
  };

  // Handle Hinglish Translation request
  const handleRequestTranslate = async (text: string) => {
    if (!text || !text.trim()) return;

    setTranslationState({
      isOpen: true,
      original: text,
      hinglish: '',
      loading: true,
      error: undefined,
    });

    try {
      const res = await fetch('/api/translate-hinglish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setTranslationState({
        isOpen: true,
        original: data.original || text,
        hinglish: data.hinglish || 'No translation received.',
        loading: false,
      });
    } catch (err: any) {
      console.error('Translation error:', err);
      setTranslationState({
        isOpen: true,
        original: text,
        hinglish: '',
        loading: false,
        error: err.message || 'Failed to generate Hinglish translation.',
      });
    }
  };

  return (
    <div id="app-root" className="w-screen h-screen flex flex-col bg-[#F8F3E9] overflow-hidden">
      {/* Windows Application Header / Titlebar */}
      <TitleBar
        currentBookTitle={activeBook?.title}
        onBackToLibrary={handleBackToLibrary}
        isReading={!!activeBook}
        onOpenDownload={() => setIsDownloadOpen(true)}
      />

      {/* Main App Canvas */}
      <main id="app-main-canvas" className="flex-1 flex flex-col overflow-hidden relative">
        {activeBook ? (
          <Reader
            book={activeBook}
            settings={settings}
            onUpdatePosition={handleUpdatePosition}
            onToggleBookmark={handleToggleBookmark}
            onBackToLibrary={handleBackToLibrary}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onRequestTranslate={handleRequestTranslate}
          />
        ) : (
          <Library
            books={books}
            onOpenBook={handleOpenBook}
            onAddBook={handleAddBook}
            onRemoveBook={handleRemoveBook}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onClose={() => setIsSettingsOpen(false)}
        onOpenDownload={() => setIsDownloadOpen(true)}
      />

      {/* Download / Windows EXE Package Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />

      {/* Side-by-Side Hinglish Translation Modal */}
      <TranslationModal
        translation={translationState}
        onClose={() =>
          setTranslationState((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </div>
  );
}
