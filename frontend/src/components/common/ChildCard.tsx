import React from 'react';
import { Child } from '../../types';
import { Edit2, Trash2, BookOpen, KeyRound } from 'lucide-react';

interface ChildCardProps {
  child: Child;
  /** Stories assigned to this child (all-time assignment count). */
  assignedStoryCount?: number;
  onEdit?: (child: Child) => void;
  onDelete?: (childId: string) => void;
  onResetPassword?: (childId: string) => void;
  onClick?: (child: Child) => void;
  showActions?: boolean;
  isDeleting?: boolean;
  isResettingPassword?: boolean;
}

const ChildCard: React.FC<ChildCardProps> = ({
  child,
  assignedStoryCount = 0,
  onEdit,
  onDelete,
  onResetPassword,
  onClick,
  showActions = true,
  isDeleting = false,
  isResettingPassword = false,
}) => {
  const getLevelEmoji = (level?: string) => {
    switch (level) {
      case 'beginner':
        return '🌱';
      case 'intermediate':
        return '🌿';
      case 'advanced':
        return '🌳';
      default:
        return '👧';
    }
  };

  return (
    <div
      className="card-interactive relative"
      onClick={() => onClick?.(child)}
    >
      {/* Avatar */}
      <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex items-center justify-center text-4xl">
        {child.avatar || '👧'}
      </div>

      {/* Child Info */}
      <h3 className="font-bold text-center text-gray-900 text-lg mb-1">{child.name}</h3>
      <p className="text-center text-gray-600 text-sm mb-2">Age: {child.age}</p>
      
      {/* Email */}
      {child.email && (
        <p className="text-center text-gray-500 text-xs mb-4 break-all">
          <span className="text-gray-400">📧 </span>
          {child.email}
        </p>
      )}

      {/* Reading Level Indicator */}
      {child.readingLevel && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl">{getLevelEmoji(child.readingLevel)}</span>
          <span className="badge badge-primary text-xs">{child.readingLevel}</span>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-3 mb-4 text-center">
        <div className="flex items-center justify-center gap-2 text-nestory-600 font-semibold">
          <BookOpen size={16} />
          <span>
            {assignedStoryCount === 1 ? '1 book' : `${assignedStoryCount} books`}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Assigned stories</p>
      </div>

      {/* Actions */}
      {showActions && (onEdit || onDelete || onResetPassword) && (
        <div className="flex gap-2 justify-center pt-3 border-t border-gray-200">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(child);
              }}
              className="btn-secondary flex items-center gap-1 text-xs"
              disabled={isDeleting}
            >
              <Edit2 size={14} />
              Edit
            </button>
          )}
          {onResetPassword && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResetPassword(child.id);
              }}
              className="btn-secondary flex items-center gap-1 text-xs"
              disabled={isDeleting || isResettingPassword}
            >
              <KeyRound size={14} />
              {isResettingPassword ? 'Resetting...' : 'Reset Password'}
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(child.id);
              }}
              className="btn-danger flex items-center gap-1 text-xs"
              disabled={isDeleting || isResettingPassword}
            >
              <Trash2 size={14} />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChildCard;
