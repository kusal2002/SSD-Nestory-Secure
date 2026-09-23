import React, { useRef } from 'react';
import Modal from '../common/Modal';
import InputField from '../common/InputField';
import SelectField from '../common/SelectField';
import { FileText, Upload, X } from 'lucide-react';

export interface StoryFormValues {
  title: string;
  author: string;
  description: string;
  ageGroup: 'toddler' | 'early-reader' | 'middle-grade' | 'young-adult';
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
  genres: string;
  pageCount: number;
  coverImage: string;
  pdf?: File | null;
  existingPdfUrl?: string;
}

interface StoryFormModalProps {
  isOpen: boolean;
  isSaving: boolean;
  editingId: string | null;
  formData: StoryFormValues;
  onClose: () => void;
  onSave: () => void;
  onChange: (field: keyof StoryFormValues, value: any) => void;
}

const ageGroupOptions = [
  { value: 'toddler', label: 'Toddler' },
  { value: 'early-reader', label: 'Early Reader' },
  { value: 'middle-grade', label: 'Middle Grade' },
  { value: 'young-adult', label: 'Young Adult' },
];

const readingLevelOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const StoryFormModal: React.FC<StoryFormModalProps> = ({
  isOpen,
  isSaving,
  editingId,
  formData,
  onClose,
  onSave,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onChange('pdf', file);
    } else if (file) {
      alert('Please upload a PDF file');
    }
  };

  const removeFile = () => {
    onChange('pdf', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Modal
      isOpen={isOpen}
      title={editingId ? 'Edit Story' : 'Create Story'}
      onClose={onClose}
      onConfirm={onSave}
      confirmText={editingId ? 'Update' : 'Create'}
      isLoading={isSaving}
      size="lg"
    >
      <div className="space-y-4">
        {/* PDF Upload Section */}
        <div className="bg-orange-50/50 border-2 border-dashed border-orange-200 rounded-2xl p-6 transition-all hover:bg-orange-50/80 group">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
              <FileText size={16} />
              Book Content (PDF)
            </h4>
            {formData.pdf && (
              <button 
                onClick={removeFile}
                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                title="Remove file"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />

          {!formData.pdf ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center py-4 cursor-pointer"
            >
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-orange-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload size={24} className="text-orange-400" />
              </div>
              <p className="text-sm font-bold text-gray-600">
                {formData.existingPdfUrl ? 'Replace existing PDF' : 'Upload story PDF'}
              </p>
              <p className="text-[10px] text-gray-400 font-medium uppercase mt-1">Maximum 10MB • PDF Format</p>
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-orange-100 shadow-sm animate-in fade-in zoom-in">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-700 truncate">{formData.pdf.name}</p>
                <p className="text-[10px] font-medium text-gray-400">{(formData.pdf.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <div className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded text-[10px] font-black uppercase">Ready</div>
            </div>
          )}
          
          {formData.existingPdfUrl && !formData.pdf && (
            <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              Currently has attached PDF
            </div>
          )}
        </div>

        <InputField
          label="Title"
          name="title"
          value={formData.title}
          onChange={(e) => onChange('title', e.target.value)}
          required
        />

        <InputField
          label="Author"
          name="author"
          value={formData.author}
          onChange={(e) => onChange('author', e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            title="Story description"
            placeholder="Write a short summary of the story"
            className="input-base min-h-24"
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Age Group"
            name="ageGroup"
            value={formData.ageGroup}
            onChange={(e) => onChange('ageGroup', e.target.value)}
            options={ageGroupOptions}
          />

          <SelectField
            label="Reading Level"
            name="readingLevel"
            value={formData.readingLevel}
            onChange={(e) => onChange('readingLevel', e.target.value)}
            options={readingLevelOptions}
          />

          <InputField
            label="Genres"
            name="genres"
            value={formData.genres}
            onChange={(e) => onChange('genres', e.target.value)}
            placeholder="Fantasy, Adventure, Animals"
            required
          />

          <InputField
            label="Page Count"
            name="pageCount"
            type="number"
            value={formData.pageCount}
            min="1"
            onChange={(e) => onChange('pageCount', Math.max(1, Number(e.target.value)))}
          />

          <div className="md:col-span-2">
            <InputField
              label="Cover Image URL"
              name="coverImage"
              value={formData.coverImage}
              onChange={(e) => onChange('coverImage', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default StoryFormModal;