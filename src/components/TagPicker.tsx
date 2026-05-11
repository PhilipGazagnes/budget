'use client';
import type { Tag, TagCategory } from '@/lib/types';

interface Props {
  category: TagCategory;
  selectedTagId: string | undefined;
  onChange: (categoryId: string, tagId: string | null) => void;
}

export default function TagPicker({ category, selectedTagId, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-xs text-gray-500 mr-1">{category.name}:</span>
      {category.tags.map((tag: Tag) => (
        <button
          key={tag.id}
          onClick={() => onChange(category.id, selectedTagId === tag.id ? null : tag.id)}
          className="px-2 py-0.5 rounded-full text-xs font-medium border transition-opacity"
          style={{
            backgroundColor: selectedTagId === tag.id ? tag.color : 'transparent',
            borderColor: tag.color,
            color: selectedTagId === tag.id ? '#fff' : tag.color,
          }}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
