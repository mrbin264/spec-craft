'use client';

import { useState, useRef, useEffect } from 'react';
import { LineRange } from '@/types';

interface CommentFormProps {
  specId: string;
  lineRange: LineRange;
  onCancel: () => void;
  onSuccess: () => void;
  position?: { top: number; left: number };
}

export function CommentForm({
  specId,
  lineRange,
  onCancel,
  onSuccess,
  position,
}: CommentFormProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mentions, setMentions] = useState<string[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Extract mentions from text
  useEffect(() => {
    const mentionRegex = /@(\w+)/g;
    const matches = [...text.matchAll(mentionRegex)];
    const extractedMentions = matches.map((match) => match[1]);
    setMentions(extractedMentions);

    // Check if we're currently typing a mention
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1 && lastAtSymbol === cursorPos - 1) {
      setShowMentionSuggestions(true);
      setMentionQuery('');
    } else if (lastAtSymbol !== -1) {
      const query = textBeforeCursor.substring(lastAtSymbol + 1);
      if (query && !query.includes(' ')) {
        setShowMentionSuggestions(true);
        setMentionQuery(query);
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  }, [text]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/specs/${specId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text,
          lineRange,
          mentions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to post comment');
      }

      setText('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const style = position
    ? {
        position: 'absolute' as const,
        top: position.top,
        left: position.left,
        zIndex: 1000,
      }
    : {};

  return (
    <div
      ref={formRef}
      style={style}
      className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-96"
    >
      <div className="mb-2 text-sm text-gray-600">
        Comment on lines {lineRange.start}-{lineRange.end}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment... (use @username to mention)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            rows={4}
            disabled={submitting}
          />
          
          {showMentionSuggestions && (
            <MentionSuggestions
              query={mentionQuery}
              onSelect={(username) => {
                const cursorPos = textareaRef.current?.selectionStart || 0;
                const textBeforeCursor = text.substring(0, cursorPos);
                const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
                const newText =
                  text.substring(0, lastAtSymbol + 1) +
                  username +
                  ' ' +
                  text.substring(cursorPos);
                setText(newText);
                setShowMentionSuggestions(false);
                textareaRef.current?.focus();
              }}
            />
          )}
        </div>

        {mentions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-gray-600">Mentioning:</span>
            {mentions.map((mention) => (
              <span
                key={mention}
                className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
              >
                @{mention}
              </span>
            ))}
          </div>
        )}

        {error && <div className="text-xs text-red-600">{error}</div>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Comment'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

interface MentionSuggestionsProps {
  query: string;
  onSelect: (username: string) => void;
}

function MentionSuggestions({ query, onSelect }: MentionSuggestionsProps) {
  // In a real app, this would fetch users from an API
  // For now, we'll use a static list as a placeholder
  const allUsers = ['alice', 'bob', 'charlie', 'david', 'eve'];
  
  const filteredUsers = query
    ? allUsers.filter((user) =>
        user.toLowerCase().startsWith(query.toLowerCase())
      )
    : allUsers;

  if (filteredUsers.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-full left-0 mb-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
      {filteredUsers.map((user) => (
        <button
          key={user}
          type="button"
          onClick={() => onSelect(user)}
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
        >
          @{user}
        </button>
      ))}
    </div>
  );
}
