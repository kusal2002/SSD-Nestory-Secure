import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { X, BookOpen, ExternalLink } from 'lucide-react';
import StoryLibraryTable from '../../../components/storyLibrary/StoryLibraryTable';
import StoryFormModal, {
  StoryFormValues,
} from '../../../components/storyLibrary/StoryFormModal';
import StoryService from '../../../services/storyService';
import { Story } from '../../../types';
import { Plus, RotateCcw, Search, BookDown } from 'lucide-react';

const PDFPreviewModal: React.FC<{ url: string; title: string; onClose: () => void }> = ({ url, title, onClose }) => {
  const isGoogle = url?.includes('google.com/books');
  const embedUrl = isGoogle ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${url}`;
  const hasValidUrl = url && url.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative border-4 border-nestory-100 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-orange-100 flex items-center justify-between bg-white relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-nestory-100 rounded-2xl flex items-center justify-center text-nestory-600 shadow-inner">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 leading-tight">{title}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-nestory-400"></span>
                Admin Preview Mode
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasValidUrl && (
              <a 
                href={embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 font-bold text-sm rounded-xl hover:bg-orange-100 transition-all border border-transparent hover:border-orange-200"
              >
                <ExternalLink size={16} />
                Open External
              </a>
            )}
            <button 
              onClick={onClose}
              className="p-3 bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-gray-100 relative">
          {hasValidUrl ? (
            <iframe 
              src={embedUrl} 
              className="w-full h-full border-none bg-white"
              title={title}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <BookOpen size={80} className="text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-gray-400 uppercase tracking-widest mb-4">No Preview Available</h3>
                <p className="text-gray-500 font-bold max-w-sm mx-auto uppercase">This story does not have a PDF or preview link. Upload a PDF file to enable preview.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer info for admin */}
        {!isGoogle && hasValidUrl && (
           <div className="px-6 py-3 bg-orange-50/50 border-t border-orange-100 text-center">
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
               Displaying internal PDF asset from secure backend storage
             </p>
           </div>
        )}
      </div>
    </div>
  );
};

const defaultForm: StoryFormValues = {
  title: '',
  author: '',
  description: '',
  ageGroup: 'early-reader',
  readingLevel: 'beginner',
  genres: '',
  pageCount: 1,
  coverImage: '',
  pdf: null,
  existingPdfUrl: '',
};

const StoryManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [syncingStoryId, setSyncingStoryId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StoryFormValues>(defaultForm);

  const [previewStory, setPreviewStory] = useState<Story | null>(null);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [readingLevel, setReadingLevel] = useState('');
  const [genre, setGenre] = useState('');
  const [source, setSource] = useState('');

  const ageGroupOptions = useMemo(
    () => [
      { value: '', label: 'All Age Groups' },
      { value: 'toddler', label: 'Toddler' },
      { value: 'early-reader', label: 'Early Reader' },
      { value: 'middle-grade', label: 'Middle Grade' },
      { value: 'young-adult', label: 'Young Adult' },
    ],
    []
  );

  const readingLevelOptions = useMemo(
    () => [
      { value: '', label: 'All Levels' },
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
    ],
    []
  );

  const sourceOptions = useMemo(
    () => [
      { value: '', label: 'All Sources' },
      { value: 'internal', label: 'Manual / Internal' },
      { value: 'google', label: 'Google Imported' },
    ],
    []
  );

  const loadStories = async () => {
    try {
      setIsLoading(true);

      const response = await StoryService.getStories(page, 10, {
        search: search.trim() || undefined,
        ageGroup: ageGroup || undefined,
        readingLevel: readingLevel || undefined,
        genre: genre || undefined,
        source: source || undefined,
      });

      setStories(response.stories);
      setPages(response.pages || 1);
      setTotalCount(response.total || 0);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load stories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, [page, search, ageGroup, readingLevel, genre, source]);

  const resetFilters = () => {
    setSearch('');
    setAgeGroup('');
    setReadingLevel('');
    setGenre('');
    setSource('');
    setPage(1);
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setIsModalOpen(true);
  };

  const openEdit = async (story: Story) => {
    try {
      const fullStory = await StoryService.getStoryById(story.id);

      setEditingId(fullStory.id);
      setFormData({
        title: fullStory.title || '',
        author: fullStory.author || '',
        description: fullStory.description || '',
        ageGroup: fullStory.ageGroup || 'early-reader',
        readingLevel: fullStory.readingLevel || 'beginner',
        genres: Array.isArray(fullStory.genres)
          ? fullStory.genres.join(', ')
          : '',
        pageCount: fullStory.pageCount || 1,
        coverImage: fullStory.coverImage || '',
        pdf: null,
        existingPdfUrl: (fullStory as any).pdfUrl || '',
      });

      setIsModalOpen(true);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Failed to load story details'
      );
    }
  };

  const handleFormChange = (
    field: keyof StoryFormValues,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (
      !formData.title.trim() ||
      !formData.author.trim() ||
      !formData.genres.trim()
    ) {
      toast.error('Title, author and at least one genre are required');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      author: formData.author.trim(),
      description: formData.description.trim(),
      ageGroup: formData.ageGroup,
      readingLevel: formData.readingLevel,
      genres: formData.genres
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      pageCount: Number(formData.pageCount) || 1,
      coverImage: formData.coverImage.trim(),
      pdf: formData.pdf,
    };

    try {
      setIsSaving(true);

      if (editingId) {
        await StoryService.updateStory(editingId, payload);
        toast.success('Story updated successfully');
      } else {
        await StoryService.createStory(payload);
        toast.success('Story created successfully');
      }

      setIsModalOpen(false);
      setFormData(defaultForm);
      await loadStories();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save story');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      await StoryService.deleteStory(id);
      toast.success('Deleted');
      await loadStories();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Delete failed');
    }
  };

  const syncGoogleContent = async (id: string) => {
    try {
      setSyncingStoryId(id);
      if ((StoryService as any).syncStoryContent) {
        await (StoryService as any).syncStoryContent(id);
      } else if ((StoryService as any).syncStoryMetadata) {
        await (StoryService as any).syncStoryMetadata(id);
      }
      toast.success('Synced successfully');
      await loadStories();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Sync failed');
    } finally {
      setSyncingStoryId(null);
    }
  };

  const handlePreview = (story: Story) => {
    const url = story.source === 'google' ? story.previewLink : (story as any).pdfUrl;
    if (!url) {
      toast.error('No preview or PDF available for this story');
      return;
    }
    setPreviewStory(story);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Story Collection</h1>
          <p className="text-gray-500 font-medium">Manage library of {totalCount} books</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={resetFilters}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-orange-100 text-gray-600 font-bold rounded-xl hover:bg-orange-50 transition-colors shadow-sm"
          >
            <RotateCcw size={18} />
            Reset
          </button>
          <button 
            onClick={() => navigate('/admin/story-management/import')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-nestory-100 text-nestory-600 font-bold rounded-xl hover:bg-nestory-50 transition-all shadow-sm"
          >
            <BookDown size={18} />
            Import from Google Books
          </button>
          <button 
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-nestory-600 text-white font-bold rounded-xl hover:bg-nestory-700 transition-all shadow-lg shadow-nestory-100"
          >
            <Plus size={18} />
            Add New Book
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-orange-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by title, author..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-orange-50/50 border border-orange-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-nestory-200 transition-all text-sm font-medium"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={ageGroup} 
              onChange={(e) => setAgeGroup(e.target.value)}
              className="px-4 py-3 bg-white border border-orange-100 rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-nestory-100 outline-none hover:bg-orange-50/50"
            >
              {ageGroupOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            
            <select 
              value={readingLevel} 
              onChange={(e) => setReadingLevel(e.target.value)}
              className="px-4 py-3 bg-white border border-orange-100 rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-nestory-100 outline-none hover:bg-orange-50/50"
            >
              {readingLevelOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>

            <select 
              value={source} 
              onChange={(e) => setSource(e.target.value)}
              className="px-4 py-3 bg-white border border-orange-100 rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-nestory-100 outline-none hover:bg-orange-50/50"
            >
              {sourceOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-orange-100 shadow-sm overflow-hidden">
        <StoryLibraryTable
          stories={stories}
          isLoading={isLoading}
          onEdit={openEdit}
          onDelete={handleDelete}
          onSync={syncGoogleContent}
          onPreview={handlePreview}
          syncingStoryId={syncingStoryId}
        />
        
        {!isLoading && stories.length > 0 && (
          <div className="px-8 py-6 bg-orange-50/30 border-t border-orange-100 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Showing Page {page} of {pages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 bg-white border border-orange-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-orange-100 disabled:opacity-50 transition-all"
              >
                Previous
              </button>
              <button
                disabled={page === pages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 bg-nestory-600 text-white rounded-xl text-sm font-bold hover:bg-nestory-700 disabled:opacity-50 transition-all shadow-md shadow-nestory-100"
              >
                Next Page
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <StoryFormModal
          isOpen={isModalOpen}
          isSaving={isSaving}
          editingId={editingId}
          formData={formData}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          onChange={handleFormChange}
        />
      )}

      {previewStory && (
        <PDFPreviewModal 
          url={previewStory.source === 'google' ? (previewStory.previewLink || `https://books.google.com/books?id=${previewStory.googleBookId}&printsec=frontcover`) : (previewStory as any).pdfUrl} 
          title={previewStory.title} 
          onClose={() => setPreviewStory(null)} 
        />
      )}
    </div>
  );
};

export default StoryManagementPage;