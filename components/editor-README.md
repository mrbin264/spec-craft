# Markdown Editor Components

This directory contains the implementation of the Markdown editor with live preview for SpecCraft.

## Components

### SpecEditor (`spec-editor.tsx`)
Main editor component that provides:
- Split-pane layout with resizable divider using `react-resizable-panels`
- Monaco Editor integration for Markdown editing
- Live preview panel
- Metadata editor integration
- Auto-save functionality (every 30 seconds)
- Manual save button
- Read-only mode support

**Props:**
- `specId`: Unique identifier for the spec
- `initialContent`: Initial Markdown content
- `initialMetadata`: Initial spec metadata
- `onSave`: Callback function for saving changes
- `readOnly`: Optional flag to make editor read-only

### MarkdownPreview (`markdown-preview.tsx`)
Preview component that renders Markdown with:
- React Markdown for rendering
- GitHub Flavored Markdown support (via `remark-gfm`)
- Syntax highlighting for code blocks (via `rehype-highlight`)
- Mermaid diagram rendering
- 500ms debounce for performance
- Custom styling for all Markdown elements

**Features:**
- Automatic Mermaid diagram detection and rendering
- Syntax highlighting with GitHub theme
- Responsive tables
- Styled blockquotes, lists, and links

### MetadataEditor (`metadata-editor.tsx`)
YAML frontmatter editor with:
- Form-based editing for all metadata fields
- YAML text editor mode with validation
- Real-time error display for invalid YAML
- Collapsible interface
- Support for all SpecMetadata fields:
  - Title
  - Status (workflow stage)
  - Type (spec type)
  - Assignee
  - Tags
  - Parent ID

**Features:**
- Toggle between form and YAML modes
- YAML validation with line number error reporting
- Read-only mode support
- Tag parsing from comma-separated values

## Usage

### Basic Usage

```tsx
import { SpecEditor } from '@/components/spec-editor';
import { SpecMetadata } from '@/types/spec';

function MyPage() {
  const handleSave = async (content: string, metadata: SpecMetadata) => {
    // Save to API
    await fetch('/api/specs/123', {
      method: 'PUT',
      body: JSON.stringify({ content, metadata }),
    });
  };

  return (
    <SpecEditor
      specId="123"
      initialContent="# My Spec"
      initialMetadata={{
        title: 'My Spec',
        status: 'Draft',
        type: 'technical-spec',
        tags: [],
      }}
      onSave={handleSave}
    />
  );
}
```

### Demo Page

Visit `/editor-demo` to see a live demo of the editor with sample content including:
- Code blocks with syntax highlighting
- Mermaid diagrams
- Tables
- Task lists
- Blockquotes

## Dependencies

- `@monaco-editor/react`: Monaco Editor React wrapper
- `react-markdown`: Markdown rendering
- `remark-gfm`: GitHub Flavored Markdown support
- `rehype-highlight`: Syntax highlighting for code blocks
- `highlight.js`: Syntax highlighting library
- `mermaid`: Diagram rendering
- `react-resizable-panels`: Resizable split-pane layout
- `js-yaml`: YAML parsing and serialization

## Configuration

### Monaco Editor Options
The editor is configured with:
- Line numbers enabled
- Minimap enabled
- Word wrap enabled
- Font size: 14px
- Automatic layout adjustment

### Mermaid Configuration
Mermaid is initialized with:
- Default theme
- Loose security level (for flexibility)
- Manual rendering (not on load)

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 2.1**: Split-pane editor with Markdown input and rendered preview ✅
- **Requirement 2.2**: Preview updates within 500ms (debounced) ✅
- **Requirement 2.3**: Mermaid diagram rendering in preview ✅
- **Requirement 2.4**: YAML frontmatter editing with syntax validation ✅
- **Requirement 2.5**: Error display with line numbers for invalid YAML ✅

## Future Enhancements

Potential improvements:
- Collaborative editing support
- Offline mode with local storage
- Custom themes for editor and preview
- Export to PDF/HTML
- Spell checking
- Markdown shortcuts toolbar
