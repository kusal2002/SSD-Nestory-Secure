import React, { useState } from 'react';
import { Story } from '../../types';
import { BookOpen, Users, ExternalLink, FileText } from 'lucide-react';

interface StoryCardProps {
  story: Partial<Story>;
  onSelect?: (story: Partial<Story>) => void;
  isSelected?: boolean;
  clickable?: boolean;
  disabled?: boolean;
}

const DEFAULT_BOOK_COVER =
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80';

const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onSelect,
  isSelected = false,
  clickable = true,
  disabled = false,
}) => {
  const [imageLoadError, setImageLoadError] = useState(false);

  const normalizeImageUrl = (url?: string): string | null => {
    if (!url || !url.trim()) return null;
    return url.replace(/^http:\/\//i, 'https://');
  };

  const getCoverImageUrl = (): string => {
    if (!imageLoadError) {
      const normalizedUrl = normalizeImageUrl(story.coverImage);
      if (normalizedUrl) return normalizedUrl;
    }
    return DEFAULT_BOOK_COVER;
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'advanced':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgeGroupLabel = (ageGroup?: string) => {
    switch (ageGroup) {
      case 'toddler':
        return 'Toddler';
      case 'early-reader':
        return 'Early Reader';
      case 'middle-grade':
        return 'Middle Grade';
      case 'young-adult':
        return 'Young Adult';
      default:
        return 'N/A';
    }
  };

  const hasGooglePreview = Boolean(story.previewLink && story.previewLink.trim());
  const isGoogleBook = story.source === 'google';
  const pageCount =
    typeof story.pageCount === 'number' && story.pageCount > 0 ? story.pageCount : null;

  const canInteract = clickable && !disabled;

  const handleClick = () => {
    if (!canInteract) return;
    onSelect?.(story);
  };

  return (
    <button
      type="button"
      className={`relative w-full text-left card-interactive flex flex-col h-full transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-nestory-600 shadow-lg' : ''
      } ${canInteract ? 'cursor-pointer active:scale-95' : ''} ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      onClick={handleClick}
      disabled={!canInteract}
    >
      <div className="w-full h-44 bg-gray-200 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
        <img
          src={getCoverImageUrl()}
          alt={story.title || 'Book cover'}
          className="w-full h-full object-cover pointer-events-none"
          onError={() => setImageLoadError(true)}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {story.readingLevel && (
          <span className={`badge ${getLevelColor(story.readingLevel)} text-xs capitalize`}>
            {story.readingLevel}
          </span>
        )}

        <span
          className={`badge text-xs ${
            isGoogleBook
              ? 'bg-amber-100 text-amber-800'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {isGoogleBook ? 'Google Book' : 'Library Book'}
        </span>

        {hasGooglePreview && (
          <span className="badge bg-indigo-100 text-indigo-800 text-xs flex items-center gap-1">
            <ExternalLink size={12} />
            Preview
          </span>
        )}
      </div>

      <h3 className="font-bold text-gray-900 line-clamp-2 mb-1">
        {story.title || 'Untitled'}
      </h3>

      <p className="text-sm text-gray-600 mb-3">
        {story.author || 'Unknown Author'}
      </p>

      {story.description && (
        <p className="text-xs text-gray-600 line-clamp-3 mb-3">
          {story.description}
        </p>
      )}

      <div className="mt-auto pt-3 border-t border-gray-200 space-y-2 text-xs text-gray-500">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 min-w-0">
            <BookOpen size={14} />
            <span className="truncate">
              {pageCount
                ? `${pageCount} pages`
                : isGoogleBook
                ? 'Pages not available'
                : 'Manual story'}
            </span>
          </div>

          <div className="flex items-center gap-1 min-w-0">
            <Users size={14} />
            <span className="truncate">{getAgeGroupLabel(story.ageGroup)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-gray-400">
            {hasGooglePreview
              ? 'Click to open preview'
              : isGoogleBook
              ? 'No preview link available'
              : 'Click to read story'}
          </span>

          {!hasGooglePreview && !isGoogleBook && (
            <span className="text-[11px] inline-flex items-center gap-1 text-slate-500">
              <FileText size={12} />
              Manual entry
            </span>
          )}
        </div>
      </div>

      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-nestory-600 rounded-full flex items-center justify-center text-white text-sm">
          ✓
        </div>
      )}
    </button>
  );
};

export default StoryCard;