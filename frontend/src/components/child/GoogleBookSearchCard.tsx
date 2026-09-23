import React, { useState } from 'react';
import { ExternalLink, Send, Loader2 } from 'lucide-react';
import { Story } from '../../types';

interface GoogleBookSearchCardProps {
  book: Story & { googleBookId?: string };
  onRequest: (book: any) => Promise<void>;
  isLoading?: boolean;
}

const GoogleBookSearchCard: React.FC<GoogleBookSearchCardProps> = ({ 
  book, 
  onRequest,
  isLoading = false
}) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsRequesting(true);
      await onRequest(book);
    } finally {
      setIsRequesting(false);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    if (book.previewLink) {
      e.preventDefault();
      e.stopPropagation();
      window.open(book.previewLink, '_blank');
    }
  };

  return (
    <div className="group flex flex-col gap-3 h-full transition-all duration-300">
      {/* Book Cover Container */}
      <div 
        className="relative aspect-[3/4.2] rounded-[2rem] overflow-hidden bg-white shadow-xl shadow-gray-200/40 border-4 border-white group-hover:shadow-2xl group-hover:shadow-rose-500/10 group-hover:-translate-y-2 transition-all"
      >
        <img 
          src={book.coverImage} 
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Playful Overlay with Buttons */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8 p-4">
          <div className="flex gap-3 w-full max-w-xs">
            {/* Request Book Button */}
            <button
              onClick={handleRequest}
              disabled={isRequesting || isLoading}
              className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl p-4 transform transition-all active:scale-95 flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-wide shadow-lg"
            >
              {isRequesting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Request
                </>
              )}
            </button>

            {/* Preview Button */}
            {book.previewLink && (
              <button
                onClick={handlePreviewClick}
                className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-2xl p-4 transform transition-all active:scale-95 flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-wide border border-white/30"
              >
                <ExternalLink size={16} />
                Preview
              </button>
            )}
          </div>
        </div>

        {/* Google Badge */}
        <div className="absolute top-4 right-4">
          <span className="p-1 px-2 rounded-lg bg-orange-400 text-white text-[8px] font-black uppercase">Google</span>
        </div>
      </div>

      {/* Book Info */}
      <div className="flex flex-col px-1">
        <h3 className="text-base font-black text-gray-800 line-clamp-2 leading-tight mb-1 group-hover:text-rose-500 transition-colors">
          {book.title}
        </h3>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {book.author}
        </span>
      </div>
    </div>
  );
};

export default GoogleBookSearchCard;
