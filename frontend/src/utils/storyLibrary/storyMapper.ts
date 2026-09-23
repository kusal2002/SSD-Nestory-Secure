import { Story, StoryListResponse } from '../../types';

const toHttps = (url?: string) => (url || '').replace(/^http:\/\//i, 'https://');

export const normalizeStory = (story: any): Story => ({
  id: String(story?.id || story?._id || ''),
  title: story?.title || 'Untitled',
  author: story?.author || 'Unknown',
  description: story?.description || '',
  ageGroup: story?.ageGroup || 'early-reader',
  genres: Array.isArray(story?.genres) ? story.genres : [],
  readingLevel: story?.readingLevel || 'beginner',
  coverImage: toHttps(story?.coverImage || ''),
  pageCount: Number(story?.pageCount || 0),
  source: story?.source || 'internal',
  googleBookId: story?.googleBookId || '',
  previewLink: story?.previewLink || '',
  pdfUrl: story?.pdfUrl || '',
  createdBy: String(story?.createdBy || ''),
  createdAt: story?.createdAt || '',
  updatedAt: story?.updatedAt || '',
});

export const normalizeStoryList = (payload: any): StoryListResponse => {
  const stories = Array.isArray(payload?.stories)
    ? payload.stories
    : Array.isArray(payload)
    ? payload
    : [];

  return {
    stories: stories.map(normalizeStory),
    total: Number(payload?.total || payload?.meta?.total|| stories.length || 0),
    page: Number(payload?.page || payload?.meta?.page || 1),
    pages: Number(payload?.pages || payload?.meta?.pages || 1),
  };
};