import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../../components/common/Navbar';
import GoogleBookCard from '../../../components/storyLibrary/GoogleBookCard';
import StoryService from '../../../services/storyService';
import toast from 'react-hot-toast';
import { Story } from '../../../types';
import { 
  Search, 
  ArrowLeft, 
  BookOpen, 
  Globe, 
  Sparkles, 
  Loader2, 
  BookCheck
} from 'lucide-react';

interface GoogleBook {
  googleBookId: string;
  title: string;
  author: string;
  description?: string;
  coverImage?: string;
  previewLink?: string;
  pageCount?: number;
}

const GoogleBooksImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('prefill') || '');
  const [books, setBooks] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [importedGoogleBookIds, setImportedGoogleBookIds] = useState<string[]>(
    []
  );

  const importedSet = useMemo(
    () => new Set(importedGoogleBookIds),
    [importedGoogleBookIds]
  );

  const loadImportedBooks = async () => {
    try {
      const response = await StoryService.getStories(1, 200, {
        source: 'google',
      });

      const ids = (response.stories || [])
        .map((story: Story) => story.googleBookId)
        .filter((id): id is string => Boolean(id && id.trim()));

      setImportedGoogleBookIds(ids);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadImportedBooks();
  }, []);

  const searchBooks = async (overrideQuery?: string) => {
    const finalQuery = (overrideQuery ?? query).trim();

    if (!finalQuery) {
      toast.error('Enter a search term');
      return;
    }

    try {
      setLoading(true);
      const results = await StoryService.searchGoogle(finalQuery);
      setBooks(results || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to search books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const prefill = searchParams.get('prefill');
    if (prefill) {
      searchBooks(prefill);
    }
  }, [searchParams]);

  const handleImport = async (
    googleBookId: string,
    config: {
      ageGroup: string;
      genres: string[];
      readingLevel: string;
    },
    book: GoogleBook
  ) => {
    if (importedSet.has(googleBookId)) {
      toast('This book is already imported');
      return;
    }

    try {
      await StoryService.importFromGoogle(googleBookId, {
        ...config,
        metadata: {
          googleBookId: book.googleBookId,
          title: book.title,
          author: book.author,
          description: book.description || '',
          coverImage: book.coverImage || '',
          previewLink: book.previewLink || '',
          pageCount: book.pageCount || 0,
        },
      });

      toast.success('Book imported successfully');

      setImportedGoogleBookIds((prev) =>
        prev.includes(googleBookId) ? prev : [...prev, googleBookId]
      );
    } catch (error: any) {
      console.error(error);

      const message = error?.response?.data?.message || 'Import failed';

      if (
        typeof message === 'string' &&
        message.toLowerCase().includes('already been imported')
      ) {
        toast('This book is already imported');
        setImportedGoogleBookIds((prev) =>
          prev.includes(googleBookId) ? prev : [...prev, googleBookId]
        );
        return;
      }

      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <Navbar title="Google Books Catalog" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-2">
            <button 
              onClick={() => navigate('/admin/stories')}
              className="group flex items-center gap-2 text-sm font-bold text-nestory-500 hover:text-nestory-600 transition-colors bg-nestory-500/5 px-3 py-1.5 rounded-full border border-nestory-500/10 mb-4"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Library
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/20">
                <Globe className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                  Global Search
                </h1>
                <p className="text-slate-500 font-medium flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  Import high-quality metadata directly from Google Books
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/50 p-2 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-sm">
            <div className="text-right px-4 border-r border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database</p>
              <p className="text-sm font-bold text-slate-700">Google Books API</p>
            </div>
            <div className="text-right px-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Library Matches</p>
              <p className="text-sm font-bold text-nestory-600 flex items-center gap-1 justify-end">
                <BookCheck size={14} />
                {importedSet.size} Synced
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar Section */}
        <div className="relative mb-12 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex flex-col sm:flex-row gap-3 p-3 bg-white border border-slate-200 rounded-[1.5rem] shadow-xl shadow-slate-200/50 transition-all duration-300 focus-within:ring-4 focus-within:ring-amber-500/10 focus-within:border-amber-500/30">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-nestory-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search millions of books by title, author, or ISBN..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') searchBooks();
                }}
                className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-none rounded-2xl text-slate-800 font-bold placeholder:text-slate-400 focus:ring-0 text-lg transition-all"
              />
            </div>

            <button
              onClick={() => searchBooks()}
              disabled={loading}
              className="relative px-10 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 shadow-lg shadow-slate-900/20 group/btn overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <Loader2 className="animate-spin" size={22} />
                ) : (
                  <Search size={22} />
                )}
                {loading ? 'Searching...' : 'Search'}
              </span>
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-20 animate-pulse"></div>
                <Loader2 className="text-amber-500 animate-spin relative" size={64} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Querying Database</h3>
              <p className="text-slate-500 font-medium">Fetching high-res covers and book details...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
              <div className="w-20 h-20 bg-white shadow-inner rounded-3xl flex items-center justify-center mb-6 border border-slate-100">
                <BookOpen className="text-slate-300" size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">What are we finding today?</h3>
              <p className="max-w-xs text-slate-500 font-medium">
                Try searching for specific titles or legendary authors like Charles Dickens.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {books.map((book) => (
                <GoogleBookCard
                  key={book.googleBookId}
                  book={book}
                  isImported={importedSet.has(book.googleBookId)}
                  onAlreadyImported={() => toast('This book is already in your library')}
                  onImport={(googleBookId, config) =>
                    handleImport(googleBookId, config, book)
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleBooksImportPage;