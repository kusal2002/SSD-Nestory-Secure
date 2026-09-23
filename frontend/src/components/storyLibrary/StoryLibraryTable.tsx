import React from 'react';
import { RefreshCw, Edit3, Trash2, ExternalLink, Book, User, Hash, Layers, Eye } from 'lucide-react';
import { Story } from '../../types';

interface StoryLibraryTableProps {
  stories: Story[];
  isLoading: boolean;
  syncingStoryId?: string | null;
  onEdit: (story: Story) => void;
  onDelete: (storyId: string) => void;
  onSync: (storyId: string) => void;
  onPreview?: (story: Story) => void;
}

const StoryLibraryTable: React.FC<StoryLibraryTableProps> = ({
  stories,
  isLoading,
  syncingStoryId = null,
  onEdit,
  onDelete,
  onSync,
  onPreview,
}) => {
  if (isLoading) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-orange-50/50 rounded-2xl border border-orange-100 w-full" />
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-200 mb-4">
          <Book size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900">No books found</h3>
        <p className="text-gray-500 max-w-xs mt-2">Try adjusting your search or filters to find what you're looking for.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-orange-50/30 border-b border-orange-100/50">
            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Book Details</th>
            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Classification</th>
            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Source info</th>
            <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-orange-50">
          {stories.map((story) => {
            const isGoogleStory = story.source === 'google';
            const isSyncing = syncingStoryId === story.id;

            return (
              <tr key={story.id} className="hover:bg-orange-50/20 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-20 bg-orange-100 rounded-xl overflow-hidden shadow-sm border border-orange-200 shrink-0 relative group-hover:shadow-md transition-shadow">
                      {story.coverImage ? (
                        <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-orange-300 bg-orange-50">
                          <Book size={24} />
                        </div>
                      )}
                      {isGoogleStory && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{story.title}</h4>
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
                        <User size={12} className="text-nestory-400" />
                        {story.author}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2 line-clamp-1 italic">
                        {story.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                       <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-black uppercase rounded-md">
                         {story.ageGroup}
                       </span>
                       <span className="px-2 py-0.5 bg-nestory-100 text-nestory-700 text-[9px] font-black uppercase rounded-md">
                         {story.readingLevel}
                       </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium overflow-hidden max-w-[150px]">
                      <Layers size={10} className="text-gray-400 shrink-0" />
                      <span className="truncate">{story.genres?.join(', ') || 'General'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                   <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter ${
                        isGoogleStory ? 'text-amber-600' : 'text-blue-600'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isGoogleStory ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                        {story.source}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <Hash size={10} />
                        {story.pageCount || 0} Pages
                      </div>
                   </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center justify-center gap-2">
                    {onPreview && (
                      <button
                        onClick={() => onPreview(story)}
                        title="Preview Story"
                        className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    {isGoogleStory && (
                      <button
                        onClick={() => onSync(story.id)}
                        disabled={isSyncing}
                        title="Sync with Google"
                        className="p-2.5 text-amber-500 hover:bg-amber-50 rounded-xl transition-all border border-transparent hover:border-amber-100"
                      >
                        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(story)}
                      title="Edit Story"
                      className="p-2.5 text-nestory-600 hover:bg-nestory-50 rounded-xl transition-all border border-transparent hover:border-nestory-100"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(story.id)}
                      title="Delete Story"
                      className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                    >
                      <Trash2 size={16} />
                    </button>
                    {story.previewLink && (
                      <a
                        href={story.previewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-orange-100"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StoryLibraryTable;
