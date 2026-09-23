import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import StoryCard from '../../components/common/StoryCard';
import SelectField from '../../components/common/SelectField';
import StoryService from '../../services/storyService';
import toast from 'react-hot-toast';
import { BookOpen, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { Story } from '../../types';

const DETAIL_ROUTE_BASE = '/story';

const normalizeText = (value?: string) =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

const StoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStories, setTotalStories] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const ageGroupOptions = [
    { value: '', label: 'All Age Groups' },
    { value: 'toddler', label: '👶 Toddler' },
    { value: 'early-reader', label: '👧 Early Reader' },
    { value: 'middle-grade', label: '🧒 Middle Grade' },
    { value: 'young-adult', label: '👦 Young Adult' },
  ];

  const levelOptions = [
    { value: '', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  useEffect(() => {
    const loadStories = async () => {
      try {
        setIsLoading(true);
        const response = await StoryService.getStories(currentPage, 12, {
          ageGroup: selectedAgeGroup,
          readingLevel: selectedLevel,
        });
        setStories(response.stories || []);
        setTotalStories(response.total || 0);
        setTotalPages(response.pages || 1);
      } catch (error) {
        toast.error('Failed to load stories');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStories();
  }, [currentPage, selectedAgeGroup, selectedLevel]);

  useEffect(() => {
    const filtered = stories.filter(
      (story) =>
        story.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.author?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredStories(filtered);
  }, [searchQuery, stories]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAgeGroup, selectedLevel]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedAgeGroup || selectedLevel
  );

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedAgeGroup('');
    setSelectedLevel('');
    setCurrentPage(1);
  };

  const findGooglePreviewForManualStory = async (
    story: Partial<Story>
  ): Promise<string | null> => {
    const title = normalizeText(story.title);
    const author = normalizeText(story.author);

    const searchTerms = [
      `${story.title || ''} ${story.author || ''}`.trim(),
      `${story.title || ''}`.trim(),
    ].filter(Boolean);

    for (const term of searchTerms) {
      const results = await StoryService.searchGoogle(term);

      if (!Array.isArray(results) || results.length === 0) {
        continue;
      }

      const exactMatch = results.find((item: any) => {
        const itemTitle = normalizeText(item?.title);
        const itemAuthor = normalizeText(item?.author);
        return itemTitle === title && (!author || itemAuthor.includes(author));
      });

      if (exactMatch?.previewLink) {
        return exactMatch.previewLink;
      }

      const strongMatch = results.find((item: any) => {
        const itemTitle = normalizeText(item?.title);
        const itemAuthor = normalizeText(item?.author);

        const titleLooksClose =
          itemTitle.includes(title) ||
          title.includes(itemTitle) ||
          itemTitle.split(' ').some((word: string) => title.includes(word));

        const authorLooksClose =
          !author || itemAuthor.includes(author) || author.includes(itemAuthor);

        return titleLooksClose && authorLooksClose && item?.previewLink;
      });

      if (strongMatch?.previewLink) {
        return strongMatch.previewLink;
      }

      const firstWithPreview = results.find((item: any) => item?.previewLink);
      if (firstWithPreview?.previewLink && title.length > 0) {
        return firstWithPreview.previewLink;
      }
    }

    return null;
  };

  const handleStoryOpen = async (selectedStory: Partial<Story>) => {
    try {
      if (!selectedStory?.id) {
        toast.error('Story id is missing');
        return;
      }

      if (selectedStory.previewLink) {
        window.location.href = selectedStory.previewLink;
        return;
      }

      if (selectedStory.source === 'internal') {
        try {
          const matchedPreview = await findGooglePreviewForManualStory(selectedStory);

          if (matchedPreview) {
            window.location.href = matchedPreview;
            return;
          }
        } catch (error) {
          console.error('Preview lookup failed:', error);
        }
      }

      navigate(`${DETAIL_ROUTE_BASE}/${selectedStory.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Unable to open this story');
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <Navbar title="Story Library" />

      <div className="container-responsive py-8 px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight lg:text-5xl mb-2">Story Library</h1>
            <p className="text-gray-600 text-lg">
              Discover stories for your family by age and reading level
            </p>
          </div>
          <p className="text-sm font-bold text-nestory-600 bg-nestory-50 px-3 py-1 rounded-full uppercase tracking-wider">
            {filteredStories.length} visible • {totalStories} total matches
          </p>
        </div>

        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <SlidersHorizontal size={18} />
              Search & Filters
            </h2>
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              <RotateCcw size={14} />
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-base pl-10"
              />
            </div>

            <SelectField
              name="ageGroup"
              value={selectedAgeGroup}
              onChange={(e) => setSelectedAgeGroup(e.target.value)}
              options={ageGroupOptions}
            />

            <SelectField
              name="level"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              options={levelOptions}
            />
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedAgeGroup && (
                <span className="badge bg-blue-100 text-blue-800">
                  Age: {selectedAgeGroup}
                </span>
              )}
              {selectedLevel && (
                <span className="badge bg-purple-100 text-purple-800">
                  Level: {selectedLevel}
                </span>
              )}
              {searchQuery.trim() && (
                <span className="badge bg-gray-100 text-gray-800">
                  Search: {searchQuery.trim()}
                </span>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading stories...</p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="card text-center py-12">
            <BookOpen className="mx-auto mb-3 text-gray-400" size={28} />
            <p className="text-gray-700 font-semibold mb-1">
              No stories found with your filters
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Try broadening age range or reading level filters.
            </p>
            <button onClick={clearFilters} className="btn-primary">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-8">
            {filteredStories.map((story) => (
              <div key={story.id} className="animate-slide-up">
                <StoryCard
                  story={story}
                  onSelect={handleStoryOpen}
                  clickable
                />
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredStories.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-600 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage >= totalPages}
              className="btn-secondary"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoriesPage;