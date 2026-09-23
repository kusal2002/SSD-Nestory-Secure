import React from 'react';
import InputField from '../common/InputField';
import SelectField from '../common/SelectField';

interface Option {
  value: string;
  label: string;
}

interface StoryLibraryFiltersProps {
  search: string;
  ageGroup: string;
  readingLevel: string;
  genre: string;
  source: string;
  ageGroupOptions: Option[];
  readingLevelOptions: Option[];
  genreOptions: Option[];
  sourceOptions: Option[];
  onSearchChange: (value: string) => void;
  onAgeGroupChange: (value: string) => void;
  onReadingLevelChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onSourceChange: (value: string) => void;
}

const StoryLibraryFilters: React.FC<StoryLibraryFiltersProps> = ({
  search,
  ageGroup,
  readingLevel,
  genre,
  source,
  ageGroupOptions,
  readingLevelOptions,
  genreOptions,
  sourceOptions,
  onSearchChange,
  onAgeGroupChange,
  onReadingLevelChange,
  onGenreChange,
  onSourceChange,
}) => {
  return (
    <div className="card mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <InputField
          label="Search"
          name="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title, author or description"
        />

        <SelectField
          label="Age Group"
          name="ageGroup"
          value={ageGroup}
          onChange={(e) => onAgeGroupChange(e.target.value)}
          options={ageGroupOptions}
        />

        <SelectField
          label="Reading Level"
          name="readingLevel"
          value={readingLevel}
          onChange={(e) => onReadingLevelChange(e.target.value)}
          options={readingLevelOptions}
        />

        <SelectField
          label="Genre"
          name="genre"
          value={genre}
          onChange={(e) => onGenreChange(e.target.value)}
          options={genreOptions}
        />

        <SelectField
          label="Source"
          name="source"
          value={source}
          onChange={(e) => onSourceChange(e.target.value)}
          options={sourceOptions}
        />
      </div>
    </div>
  );
};

export default StoryLibraryFilters;