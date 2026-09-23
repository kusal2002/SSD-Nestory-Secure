import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import SelectField from '../common/SelectField';
import InputField from '../common/InputField';
import AssignmentService from '../../services/assignmentService';
import ChildService from '../../services/childService';
import StoryService from '../../services/storyService';
import { Child, Story } from '../../types';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialChildId?: string;
  initialStoryId?: string;
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialChildId = '',
  initialStoryId = '',
}) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [duplicateFeedback, setDuplicateFeedback] = useState('');

  const [formData, setFormData] = useState({
    childId: initialChildId,
    storyId: initialStoryId,
    dueDate: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
      setFormData({
        childId: initialChildId,
        storyId: initialStoryId,
        dueDate: '',
        notes: '',
      });
      setDuplicateFeedback('');
    }
  }, [isOpen, initialChildId, initialStoryId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [childrenData, storyResponse] = await Promise.all([
        ChildService.getChildren(),
        StoryService.getStories(1, 100),
      ]);

      setChildren(childrenData);
      setStories((storyResponse.stories || []).map((s: any) => ({
        ...s,
        id: s.id || s._id || '',
      })));

      if (childrenData.length > 0 && !formData.childId) {
        setFormData(prev => ({ ...prev, childId: childrenData[0].id }));
      }
    } catch (error: any) {
      toast.error('Failed to load selection data');
    } finally {
      setIsLoading(false);
    }
  };

  const childOptions = useMemo(() => [
    { value: '', label: 'Select Child' },
    ...children.map(c => ({ value: c.id, label: `${c.name} (Age ${c.age})` }))
  ], [children]);

  const storyOptions = useMemo(() => [
    { value: '', label: 'Select Story' },
    ...stories.map(s => ({ value: s.id, label: `${s.title} — ${s.author}` }))
  ], [stories]);

  const handleCreate = async () => {
    if (!formData.childId || !formData.storyId) {
      toast.error('Please select both child and story');
      return;
    }

    try {
      setIsSaving(true);
      setDuplicateFeedback('');
      await AssignmentService.createAssignment({
        childId: formData.childId,
        storyId: formData.storyId,
        dueDate: formData.dueDate || undefined,
        notes: formData.notes || undefined,
      });
      toast.success('Assignment created successfully');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to create assignment';
      if (/already assigned/i.test(message)) {
        setDuplicateFeedback('This story is already assigned to this child.');
      }
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleCreate}
      title="Create New Assignment"
      confirmText={isSaving ? 'Creating...' : 'Create Assignment'}
      isLoading={isSaving}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Assign a story to a child to track their reading progress and achievements.
        </p>
        
        {isLoading ? (
          <div className="py-10 text-center">
            <div className="w-8 h-8 border-2 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-gray-500">Loading options...</p>
          </div>
        ) : (
          <>
            <SelectField
              label="Select Child"
              name="childId"
              value={formData.childId}
              onChange={(e) => setFormData(prev => ({ ...prev, childId: e.target.value }))}
              options={childOptions}
              required
            />

            <SelectField
              label="Select Story"
              name="storyId"
              value={formData.storyId}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, storyId: e.target.value }));
                setDuplicateFeedback('');
              }}
              options={storyOptions}
              required
            />

            <InputField
              label="Due Date (Optional)"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                className="input-base min-h-20 text-sm"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="E.g., Read chapter 1-3 by Friday"
              />
            </div>

            {duplicateFeedback && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg" role="alert">
                {duplicateFeedback}
              </p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default CreateAssignmentModal;