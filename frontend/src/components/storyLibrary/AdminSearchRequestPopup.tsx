import React, { useEffect, useState } from 'react';
import SearchRequestService, {
  SearchRequestItem,
} from '../../services/searchRequestService';
import StoryService from '../../services/storyService';
import toast from 'react-hot-toast';

const AdminSearchRequestPopup: React.FC = () => {
  const [requests, setRequests] = useState<SearchRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await SearchRequestService.getPendingRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to load search requests', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 12000);
    return () => clearInterval(interval);
  }, []);

  const activeRequest = requests[0];

  const handleImport = async () => {
    if (!activeRequest || !activeRequest.googleBookId) {
      toast.error('Book information is incomplete');
      return;
    }

    try {
      setIsImporting(true);

      await StoryService.importFromGoogle(activeRequest.googleBookId, {
        ageGroup: 'middle-grade',
        genres: ['General'],
        readingLevel: 'intermediate',
        metadata: {
          googleBookId: activeRequest.googleBookId,
          title: activeRequest.suggestedBookName || activeRequest.query,
          author: activeRequest.author || 'Unknown',
          description: '',
          coverImage: activeRequest.coverImage || '',
          previewLink: activeRequest.previewLink || '',
          pageCount: activeRequest.pageCount || 0,
        },
      });

      await SearchRequestService.markReviewing(activeRequest._id);

      toast.success('Book imported successfully');

      setRequests((prev) =>
        prev.filter((item) => item._id !== activeRequest._id)
      );
    } catch (error: any) {
      console.error(error);

      const message = error?.response?.data?.message || 'Import failed';

      if (
        typeof message === 'string' &&
        message.toLowerCase().includes('already')
      ) {
        toast('This book is already imported');
        setRequests((prev) =>
          prev.filter((item) => item._id !== activeRequest._id)
        );
        return;
      }

      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleIgnore = async () => {
    if (!activeRequest) return;

    try {
      await SearchRequestService.ignoreRequest(activeRequest._id);
      setRequests((prev) => prev.filter((item) => item._id !== activeRequest._id));
    } catch (error) {
      console.error(error);
    }
  };

  if (!activeRequest || isLoading) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-white/90 shadow-2xl border border-white/60 p-6">
        <p className="text-sm text-gray-500 mb-2">Child search request</p>

        <h3 className="text-xl font-bold text-gray-900 mb-3">
          {activeRequest.requesterName} searched for
        </h3>

        <p className="text-lg text-nestory-700 font-semibold mb-2">
          {activeRequest.suggestedBookName || activeRequest.query}
        </p>

        {activeRequest.author && (
          <p className="text-sm text-gray-600 mb-2">
            Author: {activeRequest.author}
          </p>
        )}

        <p className="text-sm text-gray-600 mb-6">
          Would you like to import this book into the Story Library?
        </p>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={handleImport}
            disabled={isImporting}
          >
            {isImporting ? 'Importing...' : 'Import'}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleIgnore}
            disabled={isImporting}
          >
            Ignore
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSearchRequestPopup;