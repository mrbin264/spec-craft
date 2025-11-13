'use client';

import { useState, useEffect, useRef } from 'react';
import { Comment, LineRange } from '@/types';

interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
}

interface CommentsPanelProps {
  specId: string;
  onLineClick?: (lineRange: LineRange) => void;
}

export function CommentsPanel({ specId, onLineClick }: CommentsPanelProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [specId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/specs/${specId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load comments');
      }

      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-gray-500">
        Loading comments...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        {error}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-center">
        No comments yet
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Comments</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.map((comment) => (
          <CommentThread
            key={comment._id}
            comment={comment}
            specId={specId}
            onLineClick={onLineClick}
            onReplyAdded={loadComments}
          />
        ))}
      </div>
    </div>
  );
}

interface CommentThreadProps {
  comment: CommentWithReplies;
  specId: string;
  onLineClick?: (lineRange: LineRange) => void;
  onReplyAdded: () => void;
}

function CommentThread({ comment, specId, onLineClick, onReplyAdded }: CommentThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  return (
    <div className="space-y-2">
      <CommentItem
        comment={comment}
        onLineClick={onLineClick}
        onReply={() => setShowReplyForm(true)}
      />
      
      {showReplyForm && (
        <div className="ml-8">
          <ReplyForm
            commentId={comment._id}
            onCancel={() => setShowReplyForm(false)}
            onSuccess={() => {
              setShowReplyForm(false);
              onReplyAdded();
            }}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-2 border-l-2 border-gray-200 pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              onLineClick={onLineClick}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  onLineClick?: (lineRange: LineRange) => void;
  onReply?: () => void;
  isReply?: boolean;
}

function CommentItem({ comment, onLineClick, onReply, isReply }: CommentItemProps) {
  const formatTimestamp = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  const handleLineClick = () => {
    if (onLineClick) {
      onLineClick(comment.lineRange);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{comment.author}</span>
          <button
            onClick={handleLineClick}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            Lines {comment.lineRange.start}-{comment.lineRange.end}
          </button>
        </div>
        <span className="text-xs text-gray-500">
          {formatTimestamp(comment.timestamp)}
        </span>
      </div>
      
      <div className="text-sm text-gray-800 whitespace-pre-wrap">
        {comment.text}
      </div>

      {comment.mentions && comment.mentions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {comment.mentions.map((mention) => (
            <span
              key={mention}
              className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
            >
              @{mention}
            </span>
          ))}
        </div>
      )}

      {!isReply && onReply && (
        <button
          onClick={onReply}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline"
        >
          Reply
        </button>
      )}
    </div>
  );
}

interface ReplyFormProps {
  commentId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

function ReplyForm({ commentId, onCancel, onSuccess }: ReplyFormProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to post reply');
      }

      setText('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a reply... (use @username to mention)"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        rows={3}
        disabled={submitting}
      />
      
      {error && (
        <div className="text-xs text-red-600">{error}</div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Posting...' : 'Reply'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
