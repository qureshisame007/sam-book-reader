import React, { useRef, useState } from 'react';
import { Book } from '../types';
import { Plus, Trash2, BookOpen, Settings, UploadCloud } from 'lucide-react';
import { parseBookFile } from '../utils/bookParser';

interface LibraryProps {
  books: Book[];
  onOpenBook: (book: Book) => void;
  onAddBook: (newBook: Book) => void;
  onRemoveBook: (bookId: string) => void;
  onOpenSettings: () => void;
}

export const Library: React.FC<LibraryProps> = ({
  books,
  onOpenBook,
  onAddBook,
  onRemoveBook,
  onOpenSettings,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['epub', 'pdf', 'txt'].includes(ext || '')) {
      setImportError('Please select a valid EPUB, PDF, or TXT book file.');
      setTimeout(() => setImportError(null), 4000);
      return;
    }

    setImporting(true);
    setImportError(null);
    try {
      const parsed = await parseBookFile(file);
      onAddBook(parsed);
    } catch (err: any) {
      console.error('Import error:', err);
      setImportError(err.message || 'Failed to parse book file.');
      setTimeout(() => setImportError(null), 4500);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // Color palette for minimalist clothbound book covers
  const getCoverPattern = (id: string) => {
    const hues = [
      { bg: 'bg-[#2A2724]', text: 'text-[#F8F3E9]', accent: '#A68A64', border: 'border-[#3D3934]' },
      { bg: 'bg-[#362E28]', text: 'text-[#F8F3E9]', accent: '#C49F74', border: 'border-[#4B4038]' },
      { bg: 'bg-[#252A26]', text: 'text-[#F8F3E9]', accent: '#95A48B', border: 'border-[#353C36]' },
      { bg: 'bg-[#282C35]', text: 'text-[#F8F3E9]', accent: '#8F9FB5', border: 'border-[#363B48]' },
      { bg: 'bg-[#332A30]', text: 'text-[#F8F3E9]', accent: '#B48A9C', border: 'border-[#483B44]' },
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % hues.length;
    return hues[Math.abs(hash)];
  };

  return (
    <div
      id="library-view"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 flex flex-col bg-[#F8F3E9] text-[#2D2926] overflow-y-auto relative select-none"
    >
      {/* Clean Header Bar */}
      <div className="border-b border-[#E0D8C8] bg-[#FDFBF7] px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-4">
          <h1 className="text-xs font-bold tracking-[0.2em] uppercase text-[#8C8375] flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-[#A68A64]" />
            Bookshelf
          </h1>
          <div className="w-px h-3 bg-[#D6CDBA]" />
          <span className="text-[10px] font-medium tracking-wider text-[#A68A64] uppercase">
            {books.length} {books.length === 1 ? 'Volume' : 'Volumes'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".epub,.pdf,.txt"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            id="book-file-input"
          />

          <button
            id="btn-add-book"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 bg-[#A68A64] hover:bg-[#947854] active:bg-[#836946] text-[#FAF4EA] px-4 py-2 rounded text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{importing ? 'Importing...' : 'Add Book'}</span>
          </button>

          <button
            id="btn-library-settings"
            onClick={onOpenSettings}
            className="p-2 text-[#8C8375] hover:text-[#2D2926] hover:bg-[#EAE2D2] rounded transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error notification */}
      {importError && (
        <div className="mx-8 mt-4 p-3.5 rounded bg-[#FBEBEB] border border-[#F0C2C2] text-[#8C2E2E] text-xs flex items-center justify-between">
          <span>{importError}</span>
          <button
            onClick={() => setImportError(null)}
            className="text-[#8C2E2E] hover:text-black font-bold text-sm ml-4 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Drag & drop overlay indicator */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#F8F3E9]/95 border-2 border-dashed border-[#A68A64] z-30 flex flex-col items-center justify-center pointer-events-none">
          <UploadCloud className="w-12 h-12 text-[#A68A64] mb-3 animate-bounce" />
          <p className="text-base font-serif text-[#2D2926] font-medium">Drop your EPUB, PDF, or TXT book here</p>
          <p className="text-xs text-[#8C8375] mt-1 tracking-wider uppercase">Will be added directly to your bookshelf</p>
        </div>
      )}

      {/* Books Grid */}
      <div className="p-8 md:p-12 flex-1">
        {books.length === 0 ? (
          <div
            id="empty-library-prompt"
            onClick={() => fileInputRef.current?.click()}
            className="h-80 border border-dashed border-[#D6CDBA] hover:border-[#A68A64] rounded-lg bg-[#FAF6EE] flex flex-col items-center justify-center text-center p-8 transition-colors cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-[#EFE7D3] group-hover:bg-[#E8DECA] flex items-center justify-center mb-4 transition-colors">
              <BookOpen className="w-5 h-5 text-[#A68A64]" />
            </div>
            <h3 className="font-serif text-base text-[#2D2926] mb-1 font-bold">Your Bookshelf is Empty</h3>
            <p className="text-xs text-[#8C8375] max-w-sm mb-4 leading-relaxed">
              Import your reading collection in <span className="text-[#A68A64] font-semibold">EPUB</span>,{' '}
              <span className="text-[#A68A64] font-semibold">PDF</span>, or{' '}
              <span className="text-[#A68A64] font-semibold">TXT</span> format.
            </p>
            <span className="text-[10px] font-bold tracking-widest uppercase bg-[#E8DECA] group-hover:bg-[#A68A64] group-hover:text-white text-[#5D5447] px-3.5 py-1.5 rounded transition-colors">
              Browse Files or Drag & Drop
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {books.map((book) => {
              const pattern = getCoverPattern(book.id);
              const progressPercent =
                book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;

              return (
                <div
                  key={book.id}
                  id={`book-card-${book.id}`}
                  className="group flex flex-col relative"
                >
                  {/* Book Spine / Cover Container */}
                  <div
                    onClick={() => onOpenBook(book)}
                    className="relative aspect-[1/1.48] w-full rounded shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-[#D6CDBA] group-hover:-translate-y-1"
                  >
                    {book.coverDataUrl ? (
                      <img
                        src={book.coverDataUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      /* Clean Minimalist Clothbound Cover */
                      <div
                        className={`w-full h-full ${pattern.bg} flex flex-col justify-between p-4 relative overflow-hidden`}
                      >
                        {/* Book Spine Crease Effect */}
                        <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-black/35 to-transparent pointer-events-none" />
                        <div className="absolute top-0 bottom-0 left-2.5 w-px bg-black/15 pointer-events-none" />

                        {/* Minimalist Border Inset */}
                        <div className="absolute inset-2 border border-white/10 rounded-xs pointer-events-none" />

                        {/* Top Format Tag */}
                        <div className="flex justify-between items-start z-10">
                          <span className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 bg-black/30 rounded text-[#D6CDBA]">
                            {book.format}
                          </span>
                        </div>

                        {/* Center Title & Author */}
                        <div className="my-auto text-center z-10 px-1">
                          <h4
                            className={`font-serif text-xs sm:text-sm font-bold line-clamp-3 leading-snug tracking-normal ${pattern.text}`}
                          >
                            {book.title}
                          </h4>
                          <div className="w-5 h-px bg-[#A68A64]/60 mx-auto my-2" />
                          <p className="text-[10px] text-[#C4B7A5] font-serif italic truncate">
                            {book.author}
                          </p>
                        </div>

                        {/* Bottom Detail */}
                        <div className="z-10 text-[9px] text-center font-mono text-[#9C8F7E]">
                          {book.totalPages} Pages
                        </div>
                      </div>
                    )}

                    {/* Format Badge Overlay for Image Covers */}
                    {book.coverDataUrl && (
                      <div className="absolute top-2 left-2 z-10">
                        <span className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 bg-black/60 backdrop-blur-xs rounded text-[#D6CDBA]">
                          {book.format}
                        </span>
                      </div>
                    )}

                    {/* Hover Quick Open Glow */}
                    <div className="absolute inset-0 bg-[#2D2926]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-[#FAF4EA] text-[#2D2926] text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded shadow-sm border border-[#D6CDBA] flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-[#A68A64]" /> Read
                      </span>
                    </div>

                    {/* Delete action button */}
                    <button
                      id={`btn-delete-${book.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setBookToDelete(book.id);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 rounded bg-black/60 hover:bg-[#8C2E2E] text-[#D6CDBA] hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-20"
                      title="Remove volume"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Metadata Below Cover */}
                  <div className="mt-3 px-0.5">
                    <h3
                      onClick={() => onOpenBook(book)}
                      className="font-serif text-xs font-bold text-[#2D2926] line-clamp-1 hover:text-[#A68A64] transition-colors cursor-pointer"
                      title={book.title}
                    >
                      {book.title}
                    </h3>
                    <p className="text-[10px] text-[#8C8375] truncate font-serif italic mt-0.5">
                      {book.author}
                    </p>

                    {/* Reading Progress Indicator */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex-1 h-[2px] bg-[#E0D8C8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#A68A64] rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-[#8C8375] font-mono">
                        {book.currentPage}/{book.totalPages}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {bookToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#FAF6EE] border border-[#D6CDBA] rounded-md p-6 max-w-sm w-full shadow-xl text-[#2D2926]">
            <h3 className="font-serif text-sm font-bold uppercase tracking-wider mb-2">Remove Book?</h3>
            <p className="text-xs text-[#5D5447] mb-6 leading-relaxed">
              Are you sure you want to remove this book from your bookshelf? Reading progress and bookmarks will be cleared.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBookToDelete(null)}
                className="px-3.5 py-1.5 text-xs text-[#5D5447] hover:text-[#2D2926] bg-[#EAE2D2] hover:bg-[#E0D8C8] rounded transition-colors cursor-pointer font-medium tracking-wide uppercase"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRemoveBook(bookToDelete);
                  setBookToDelete(null);
                }}
                className="px-3.5 py-1.5 text-xs text-white bg-[#8C2E2E] hover:bg-[#A33838] rounded transition-colors cursor-pointer font-bold tracking-wide uppercase"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
