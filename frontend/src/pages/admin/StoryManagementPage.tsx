import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import Modal from '../../components/common/Modal';
import InputField from '../../components/common/InputField';
import SelectField from '../../components/common/SelectField';
import StoryService from '../../services/storyService';
import { Story } from '../../types';

interface StoryFormData {
  title: string;
  author: string;
  description: string;
  ageGroup: 'toddler' | 'early-reader' | 'middle-grade' | 'young-adult';
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
  genres: string;
  pageCount: number;
  coverImage: string;
}

interface StoryItem {
  id: string;
  title: string;
  author: string;
  ageGroup: string;
  readingLevel: string;
  genres: string[];
  pageCount?: number;
}

const defaultForm: StoryFormData = {
  title: '',
  author: '',
  description: '',
  ageGroup: 'early-reader',
  readingLevel: 'beginner',
  genres: '',
  pageCount: 1,
  coverImage: '',
};

const StoryManagementPage: React.FC = () => {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StoryFormData>(defaultForm);

  const ageGroupOptions = [
    { value: 'toddler', label: 'Toddler' },
    { value: 'early-reader', label: 'Early Reader' },
    { value: 'middle-grade', label: 'Middle Grade' },
    { value: 'young-adult', label: 'Young Adult' },
  ];

  const levelOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  const normalizeId = (value: any): string => String(value?.id || value?._id || '');

  const loadStories = async () => {
    try {
      setIsLoading(true);
      const response = await StoryService.getStories(1, 100);
      const normalized = (response.stories || []).map((story: any) => ({
        id: normalizeId(story),
        title: story.title || 'Untitled',
        author: story.author || 'Unknown',
        ageGroup: story.ageGroup || 'early-reader',
        readingLevel: story.readingLevel || 'beginner',
        genres: Array.isArray(story.genres) ? story.genres : [],
        pageCount: story.pageCount,
      }));
      setStories(normalized);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load stories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setIsModalOpen(true);
  };

  const openEdit = (story: StoryItem) => {
    setEditingId(story.id);
    setFormData({
      title: story.title,
      author: story.author,
      description: '',
      ageGroup: story.ageGroup as StoryFormData['ageGroup'],
      readingLevel: story.readingLevel as StoryFormData['readingLevel'],
      genres: (story.genres || []).join(', '),
      pageCount: story.pageCount || 1,
      coverImage: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.author.trim() || !formData.genres.trim()) {
      toast.error('Title, author, and at least one genre are required');
      return;
    }

    const basePayload: Partial<Story> = {
      title: formData.title.trim(),
      author: formData.author.trim(),
      description: formData.description.trim(),
      ageGroup: formData.ageGroup,
      readingLevel: formData.readingLevel,
      genres: formData.genres.split(',').map((item) => item.trim()).filter(Boolean),
      coverImage: formData.coverImage.trim(),
    };

    try {
      setIsSaving(true);
      if (editingId) {
        await StoryService.updateStory(editingId, basePayload);
        toast.success('Story updated');
      } else {
        await StoryService.createStory({ ...basePayload, previewLink: '' });
        toast.success('Story created');
      }
      setIsModalOpen(false);
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
      toast.success('Story deleted');
      await loadStories();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete story');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Story Management" />
      <div className="container-responsive py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Story CRUD</h1>
            <p className="text-gray-600">Create, read, update, and delete stories.</p>
          </div>
          <button className="btn-primary" onClick={openCreate}>New Story</button>
        </div>

        <div className="card">
          {isLoading ? (
            <p className="text-gray-600">Loading stories...</p>
          ) : stories.length === 0 ? (
            <p className="text-gray-600">No stories yet.</p>
          ) : (
            <div className="space-y-3">
              {stories.map((story) => (
                <div key={story.id} className="rounded-lg border border-gray-200 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{story.title}</p>
                    <p className="text-sm text-gray-600">{story.author}</p>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className="badge bg-blue-100 text-blue-800 capitalize">{story.ageGroup}</span>
                      <span className="badge bg-nestory-100 text-nestory-800 capitalize">{story.readingLevel}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary" onClick={() => openEdit(story)}>Edit</button>
                    <button className="btn-danger" onClick={() => handleDelete(story.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        title={editingId ? 'Edit Story' : 'Create Story'}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSave}
        confirmText={editingId ? 'Update' : 'Create'}
        isLoading={isSaving}
        size="lg"
      >
        <div className="space-y-4">
          <InputField
            label="Title"
            name="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <InputField
            label="Author"
            name="author"
            value={formData.author}
            onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
            required
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              title="Story description"
              placeholder="Write a short summary of the story"
              className="input-base min-h-24"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Age Group"
              name="ageGroup"
              value={formData.ageGroup}
              onChange={(e) => setFormData((prev) => ({ ...prev, ageGroup: e.target.value as StoryFormData['ageGroup'] }))}
              options={ageGroupOptions}
            />
            <SelectField
              label="Reading Level"
              name="readingLevel"
              value={formData.readingLevel}
              onChange={(e) => setFormData((prev) => ({ ...prev, readingLevel: e.target.value as StoryFormData['readingLevel'] }))}
              options={levelOptions}
            />
            <InputField
              label="Page Count"
              name="pageCount"
              type="number"
              value={formData.pageCount}
              min="1"
              onChange={(e) => setFormData((prev) => ({ ...prev, pageCount: Math.max(1, Number(e.target.value)) }))}
            />
            <InputField
              label="Cover Image URL"
              name="coverImage"
              value={formData.coverImage}
              onChange={(e) => setFormData((prev) => ({ ...prev, coverImage: e.target.value }))}
            />
          </div>
          <InputField
            label="Genres (comma separated)"
            name="genres"
            value={formData.genres}
            onChange={(e) => setFormData((prev) => ({ ...prev, genres: e.target.value }))}
            placeholder="Adventure, Fantasy"
            required
          />
        </div>
      </Modal>
    </div>
  );
};

export default StoryManagementPage;
