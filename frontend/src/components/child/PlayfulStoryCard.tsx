import React from 'react';
import { PlayCircle, BookmarkPlus, ExternalLink } from 'lucide-react';
import { Story } from '../../types';

interface PlayfulStoryCardProps {
  story: Story;
  onSelect: () => void;
  isLoading?: boolean;
}

const PlayfulStoryCard: React.FC<PlayfulStoryCardProps> = ({ 
  story, 
  onSelect, 
  isLoading 
}) => {
  const isGoogle = story.source === 'google';
  
  return (
    <div className="group flex flex-col gap-3 h-full transition-all duration-300">
      {/* Book Cover Container */}
      <div 
        onClick={onSelect}
        className="relative aspect-[3/4.2] rounded-[2rem] overflow-hidden bg-white shadow-xl shadow-gray-200/40 border-4 border-white group-hover:shadow-2xl group-hover:shadow-rose-500/10 group-hover:-translate-y-2 transition-all cursor-pointer"
      >
        <img 
          src={story.coverImage} 
          alt={story.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Playful Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8 p-4">
          <div className="bg-white/30 backdrop-blur-md rounded-2xl p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform">
             {isGoogle ? <ExternalLink className="text-white" size={32} /> : <PlayCircle className="text-white" size={32} />}
          </div>
        </div>

        {/* Level Badge if available */}
        {story.readingLevel && (
          <div className="absolute top-4 left-4">
             <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/40 backdrop-blur-md text-white ${
               story.readingLevel === 'beginner' 
                 ? 'bg-emerald-500/80' 
                 : 'bg-rose-500/80'
             }`}>
               {story.readingLevel}
             </span>
          </div>
        )}

        {/* Label for Google Books */}
        {isGoogle && (
           <div className="absolute top-4 right-4">
           <span className="p-1 px-2 rounded-lg bg-orange-400 text-white text-[8px] font-black uppercase">Google</span>
        </div>
        )}
      </div>

      {/* Book Info */}
      <div className="flex flex-col px-1">
        <h3 className="text-base font-black text-gray-800 line-clamp-2 leading-tight mb-1 group-hover:text-rose-500 transition-colors">
          {story.title}
        </h3>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {story.author}
        </span>
      </div>
    </div>
  );
};

export default PlayfulStoryCard;
