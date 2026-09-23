import React, { useState } from 'react';
import { ExternalLink, BookOpen, CheckCircle2, User, FileText, ArrowRightCircle, PlusCircle, Loader2 } from 'lucide-react';
import SelectField from '../common/SelectField';
import InputField from '../common/InputField';

interface GoogleBook {
  googleBookId: string;
  title: string;
  author: string;
  description?: string;
  coverImage?: string;
  previewLink?: string;
  pageCount?: number;
}

interface Props {
  book: GoogleBook;
  isImported?: boolean;
  onAlreadyImported?: () => void;
  onImport: (
    googleBookId: string,
    config: {
      ageGroup: string;
      genres: string[];
      readingLevel: string;
    }
  ) => Promise<void>;
}

const GoogleBookCard: React.FC<Props> = ({
  book,
  isImported = false,
  onAlreadyImported,
  onImport,
}) => {
  const [ageGroup, setAgeGroup] = useState('middle-grade');
  const [readingLevel, setReadingLevel] = useState('intermediate');
  const [genres, setGenres] = useState('General');
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    if (isImported) {
      onAlreadyImported?.();
      return;
    }

    const parsedGenres = genres
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (!ageGroup || parsedGenres.length === 0) return;

    try {
      setIsImporting(true);
      await onImport(book.googleBookId, {
        ageGroup,
        genres: parsedGenres,
        readingLevel,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className={`group bg-white rounded-[2rem] border overflow-hidden flex flex-col h-full shadow-lg transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-2 ${isImported ? 'border-amber-200 ring-2 ring-amber-500/10' : 'border-slate-100'}`}>
      {/* Cover Image Section */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={book.coverImage || 'https://via.placeholder.com/150'}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
        
        {isImported && (
          <div className="absolute top-4 right-4 bg-amber-500 text-white px-4 py-2 rounded-full font-black text-xs flex items-center gap-2 shadow-xl shadow-amber-500/40 animate-in fade-in zoom-in">
            <CheckCircle2 size={14} />
            SYNCED
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">Book Identity</p>
          <h3 className="font-black text-lg line-clamp-1 group-hover:text-amber-300 transition-colors uppercase leading-tight tracking-tight">{book.title}</h3>
          <p className="text-sm font-medium opacity-80 flex items-center gap-1">
            <User size={12} className="text-amber-500" />
            {book.author}
          </p>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1 space-y-5 bg-[#FDFCFB]/50 backdrop-blur-sm">
        {/* Stats Row */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="p-1.5 bg-slate-100 rounded-lg">
              <FileText size={14} className="text-slate-500" />
            </div>
            <span className="text-xs font-black uppercase tracking-wide">
              {book.pageCount && book.pageCount > 0
                ? `${book.pageCount} Pages`
                : 'P/N'}
            </span>
          </div>
          <button 
            onClick={() => window.open(book.previewLink, '_blank')}
            className="text-xs font-black text-nestory-500 hover:text-nestory-600 flex items-center gap-1 uppercase transition-colors"
          >
            Preview <ExternalLink size={12} />
          </button>
        </div>

        <p className="text-sm text-slate-500 font-medium line-clamp-2 italic leading-relaxed">
          "{book.description || 'No digital abstract available for this publication.'}"
        </p>

        {/* Configuration Forms */}
        <div className="space-y-4 bg-white/40 p-1 rounded-2xl border border-slate-50">
          <SelectField
            label="Age Group"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            disabled={isImported}
            options={[
              { label: '👶 Toddler (0-3)', value: 'toddler' },
              { label: '🚀 Early Reader (4-7)', value: 'early-reader' },
              { label: '📖 Middle Grade (8-12)', value: 'middle-grade' },
              { label: '🎭 Young Adult (13+)', value: 'young-adult' },
            ]}
          />

          <SelectField
            label="Reading Level"
            value={readingLevel}
            onChange={(e) => setReadingLevel(e.target.value)}
            disabled={isImported}
            options={[
              { label: '🟢 Beginner', value: 'beginner' },
              { label: '🟡 Intermediate', value: 'intermediate' },
              { label: '🔴 Advanced', value: 'advanced' },
            ]}
          />

          <InputField
            label="Categorization (Genres)"
            type="text"
            value={genres}
            onChange={(e) => setGenres(e.target.value)}
            placeholder="Fiction, Mystery, etc."
            disabled={isImported}
          />
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleImport}
            disabled={isImporting || isImported}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 group/btn ${
              isImported
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-100 shadow-none'
                : 'bg-black text-white hover:bg-slate-900 shadow-slate-900/10'
            }`}
          >
            {isImporting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : isImported ? (
              <CheckCircle2 size={18} className="text-amber-500" />
            ) : (
              <PlusCircle size={18} className="text-white group-hover/btn:rotate-90 transition-transform duration-300" />
            )}
            {isImporting ? 'Syncing...' : isImported ? 'Already Synced' : 'Sync to Library'}
          </button>
          {!isImported && (
            <p className="text-[10px] text-center font-black text-slate-300 uppercase mt-3 flex items-center justify-center gap-2">
              <ArrowRightCircle size={12} /> Click to finalize import
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleBookCard;