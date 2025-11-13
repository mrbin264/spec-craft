'use client';

import { Comment, LineRange } from '@/types';

interface CommentMarkersProps {
  comments: Comment[];
  onMarkerClick: (lineRange: LineRange) => void;
}

export function CommentMarkers({ comments, onMarkerClick }: CommentMarkersProps) {
  // Group comments by line range
  const commentsByLine = new Map<string, Comment[]>();
  
  comments.forEach((comment) => {
    const key = `${comment.lineRange.start}-${comment.lineRange.end}`;
    if (!commentsByLine.has(key)) {
      commentsByLine.set(key, []);
    }
    commentsByLine.get(key)!.push(comment);
  });

  return (
    <div className="absolute top-0 right-0 w-8 pointer-events-none">
      {Array.from(commentsByLine.entries()).map(([key, lineComments]) => {
        const comment = lineComments[0];
        const count = lineComments.length;
        
        return (
          <CommentMarker
            key={key}
            lineRange={comment.lineRange}
            count={count}
            onClick={() => onMarkerClick(comment.lineRange)}
          />
        );
      })}
    </div>
  );
}

interface CommentMarkerProps {
  lineRange: LineRange;
  count: number;
  onClick: () => void;
}

function CommentMarker({ lineRange, count, onClick }: CommentMarkerProps) {
  return (
    <button
      onClick={onClick}
      className="pointer-events-auto absolute right-0 w-6 h-6 bg-yellow-400 hover:bg-yellow-500 rounded-full flex items-center justify-center text-xs font-semibold text-gray-800 shadow-sm transition-colors"
      style={{
        top: `${(lineRange.start - 1) * 19}px`, // Approximate line height
      }}
      title={`${count} comment${count > 1 ? 's' : ''} on lines ${lineRange.start}-${lineRange.end}`}
    >
      {count}
    </button>
  );
}
