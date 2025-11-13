'use client';

import { SpecEditor } from '@/components/spec-editor';
import { SpecMetadata } from '@/types/spec';

const DEMO_CONTENT = `# Sample Specification

## Overview

This is a demo specification document to showcase the Markdown editor with live preview.

## Features

- **Monaco Editor** with syntax highlighting
- **Live Preview** with 500ms debounce
- **Mermaid Diagrams** support
- **YAML Frontmatter** editor

## Code Example

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function greetUser(user: User): string {
  return \`Hello, \${user.name}!\`;
}
\`\`\`

## Mermaid Diagram

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
\`\`\`

## Task List

- [x] Integrate Monaco Editor
- [x] Implement live preview
- [x] Add Mermaid support
- [x] Build YAML editor
- [ ] Add more features

## Table Example

| Feature | Status | Priority |
|---------|--------|----------|
| Editor | ✅ Done | High |
| Preview | ✅ Done | High |
| Mermaid | ✅ Done | Medium |
| YAML | ✅ Done | Medium |

## Blockquote

> This is a blockquote example.
> It can span multiple lines.

---

**Note:** This is a demo page for testing the editor functionality.
`;

const DEMO_METADATA: SpecMetadata = {
  title: 'Demo Specification',
  status: 'Draft',
  type: 'technical-spec',
  tags: ['demo', 'test'],
};

export default function EditorDemoPage() {
  const handleSave = async (content: string, metadata: SpecMetadata) => {
    console.log('Saving spec:', { content, metadata });
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('Spec saved successfully!');
  };

  return (
    <SpecEditor
      specId="demo-spec"
      initialContent={DEMO_CONTENT}
      initialMetadata={DEMO_METADATA}
      onSave={handleSave}
    />
  );
}
