'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { SpecMetadata, LineRange } from '@/types/spec';
import { MarkdownPreview } from './markdown-preview';
import { MetadataEditor } from './metadata-editor';
import { AIAssistantPanel } from './ai-assistant-panel';
import { CommentsPanel } from './comments-panel';
import { CommentForm } from './comment-form';

interface SpecEditorProps {
  specId: string;
  initialContent: string;
  initialMetadata: SpecMetadata;
  onSave: (content: string, metadata: SpecMetadata) => Promise<void>;
  readOnly?: boolean;
}

export function SpecEditor({
  specId,
  initialContent,
  initialMetadata,
  onSave,
  readOnly = false,
}: SpecEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [metadata, setMetadata] = useState(initialMetadata);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPanelPosition, setAIPanelPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentLineRange, setCommentLineRange] = useState<LineRange | null>(null);
  const [commentFormPosition, setCommentFormPosition] = useState({ top: 0, left: 0 });
  const [commentsKey, setCommentsKey] = useState(0);
  const editorRef = useRef<any>(null);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (readOnly) return;

    const autoSaveInterval = setInterval(async () => {
      if (content !== initialContent || JSON.stringify(metadata) !== JSON.stringify(initialMetadata)) {
        await handleSave();
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [content, metadata, initialContent, initialMetadata, readOnly]);

  const handleSave = useCallback(async () => {
    if (readOnly) return;
    
    setIsSaving(true);
    try {
      await onSave(content, metadata);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save spec:', error);
    } finally {
      setIsSaving(false);
    }
  }, [content, metadata, onSave, readOnly]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
    }
  }, []);

  const handleMetadataChange = useCallback((newMetadata: SpecMetadata) => {
    setMetadata(newMetadata);
  }, []);

  const handleEditorMount = useCallback((editor: any) => {
    editorRef.current = editor;

    // Add context menu action for AI assistant
    editor.addAction({
      id: 'ai-assistant',
      label: 'AI Assistant',
      keybindings: [2048 | 31], // Ctrl+K or Cmd+K
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: (ed: any) => {
        const selection = ed.getSelection();
        if (selection && !selection.isEmpty()) {
          const selectedText = ed.getModel()?.getValueInRange(selection) || '';
          if (selectedText) {
            setSelectedText(selectedText);
            
            // Get cursor position for panel placement
            const position = ed.getPosition();
            if (position) {
              const coords = ed.getScrolledVisiblePosition(position);
              if (coords) {
                setAIPanelPosition({
                  x: coords.left + 100,
                  y: coords.top + 100,
                });
              }
            }
            
            setShowAIPanel(true);
          }
        }
      },
    });

    // Add context menu action for adding comments
    editor.addAction({
      id: 'add-comment',
      label: 'Add Comment',
      keybindings: [2048 | 2089], // Ctrl+Shift+M or Cmd+Shift+M
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.6,
      run: (ed: any) => {
        const selection = ed.getSelection();
        if (selection) {
          const lineRange: LineRange = {
            start: selection.startLineNumber,
            end: selection.endLineNumber,
          };
          setCommentLineRange(lineRange);
          
          // Get cursor position for form placement
          const position = ed.getPosition();
          if (position) {
            const coords = ed.getScrolledVisiblePosition(position);
            if (coords) {
              setCommentFormPosition({
                top: coords.top + 100,
                left: coords.left + 100,
              });
            }
          }
          
          setShowCommentForm(true);
        }
      },
    });
  }, []);

  const handleAIInsert = useCallback((text: string) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const selection = editor.getSelection();
      if (selection) {
        // Insert at cursor position
        editor.executeEdits('ai-insert', [
          {
            range: {
              startLineNumber: selection.endLineNumber,
              startColumn: selection.endColumn,
              endLineNumber: selection.endLineNumber,
              endColumn: selection.endColumn,
            },
            text: '\n\n' + text,
          },
        ]);
      }
    }
    setShowAIPanel(false);
  }, []);

  const handleAIReplace = useCallback((text: string) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const selection = editor.getSelection();
      if (selection) {
        // Replace selected text
        editor.executeEdits('ai-replace', [
          {
            range: selection,
            text: text,
          },
        ]);
      }
    }
    setShowAIPanel(false);
  }, []);

  const handleCommentSuccess = useCallback(() => {
    setShowCommentForm(false);
    setCommentLineRange(null);
    // Refresh comments panel
    setCommentsKey((prev) => prev + 1);
  }, []);

  const handleLineClick = useCallback((lineRange: LineRange) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      // Scroll to and highlight the line range
      editor.revealLineInCenter(lineRange.start);
      editor.setSelection({
        startLineNumber: lineRange.start,
        startColumn: 1,
        endLineNumber: lineRange.end,
        endColumn: editor.getModel()?.getLineMaxColumn(lineRange.end) || 1,
      });
      editor.focus();
    }
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">{metadata.title || 'Untitled Spec'}</h1>
          <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
            {metadata.status}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-sm text-gray-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || readOnly}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Metadata Editor */}
      <MetadataEditor
        metadata={metadata}
        onChange={handleMetadataChange}
        readOnly={readOnly}
      />

      {/* Editor, Preview, and Comments */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={40} minSize={25}>
            <div className="h-full flex flex-col">
              <div className="px-4 py-2 border-b bg-gray-50">
                <h2 className="text-sm font-medium text-gray-700">Editor</h2>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  defaultLanguage="markdown"
                  value={content}
                  onChange={handleEditorChange}
                  onMount={handleEditorMount}
                  theme="vs-light"
                  options={{
                    readOnly,
                    minimap: { enabled: true },
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-blue-400 transition-colors cursor-col-resize" />

          <Panel defaultSize={35} minSize={25}>
            <div className="h-full flex flex-col">
              <div className="px-4 py-2 border-b bg-gray-50">
                <h2 className="text-sm font-medium text-gray-700">Preview</h2>
              </div>
              <div className="flex-1 overflow-auto">
                <MarkdownPreview content={content} />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-blue-400 transition-colors cursor-col-resize" />

          <Panel defaultSize={25} minSize={20}>
            <CommentsPanel
              key={commentsKey}
              specId={specId}
              onLineClick={handleLineClick}
            />
          </Panel>
        </PanelGroup>
      </div>

      {/* AI Assistant Panel */}
      {showAIPanel && (
        <AIAssistantPanel
          selectedText={selectedText}
          context={content}
          specId={specId}
          position={aiPanelPosition}
          onInsert={handleAIInsert}
          onReplace={handleAIReplace}
          onClose={() => setShowAIPanel(false)}
        />
      )}

      {/* Comment Form */}
      {showCommentForm && commentLineRange && (
        <CommentForm
          specId={specId}
          lineRange={commentLineRange}
          onCancel={() => setShowCommentForm(false)}
          onSuccess={handleCommentSuccess}
          position={commentFormPosition}
        />
      )}
    </div>
  );
}
