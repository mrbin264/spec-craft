// Spec document templates
import { SpecTemplate } from '../types/template';

export const SPEC_TEMPLATES: Record<string, SpecTemplate> = {
  epic: {
    id: 'epic',
    name: 'Epic',
    type: 'epic',
    description: 'High-level feature or initiative that spans multiple user stories',
    frontmatter: {
      title: 'New Epic',
      status: 'Idea',
      type: 'epic',
      tags: [],
    },
    content: `# Epic Title

## Overview
Brief description of the epic and its business value.

## Goals
- Goal 1
- Goal 2
- Goal 3

## Success Criteria
- Criterion 1
- Criterion 2

## User Stories
- [ ] User Story 1
- [ ] User Story 2

## Dependencies
List any dependencies or blockers.

## Timeline
Estimated timeline and milestones.
`,
  },
  
  'user-story': {
    id: 'user-story',
    name: 'User Story',
    type: 'user-story',
    description: 'User-focused feature description with acceptance criteria',
    frontmatter: {
      title: 'New User Story',
      status: 'Idea',
      type: 'user-story',
      tags: [],
    },
    content: `# User Story Title

## Story
As a [role],
I want [feature],
So that [benefit].

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes
Any technical considerations or constraints.

## Design References
Links to mockups, wireframes, or design documents.

## Dependencies
List any dependencies on other stories or technical work.
`,
  },
  
  'technical-spec': {
    id: 'technical-spec',
    name: 'Technical Specification',
    type: 'technical-spec',
    description: 'Detailed technical design and implementation plan',
    frontmatter: {
      title: 'New Technical Spec',
      status: 'Idea',
      type: 'technical-spec',
      tags: [],
    },
    content: `# Technical Specification

## Overview
Brief description of the technical solution.

## Architecture

\`\`\`mermaid
flowchart LR
    A[Component A] --> B[Component B]
    B --> C[Component C]
\`\`\`

## Components

### Component 1
Description and responsibilities.

### Component 2
Description and responsibilities.

## Data Models

\`\`\`typescript
interface Example {
  id: string;
  name: string;
}
\`\`\`

## API Endpoints

### POST /api/example
Request and response format.

## Implementation Plan
1. Step 1
2. Step 2
3. Step 3

## Testing Strategy
How this will be tested.

## Security Considerations
Any security concerns or requirements.

## Performance Considerations
Expected performance characteristics.
`,
  },
  
  'test-case': {
    id: 'test-case',
    name: 'Test Case',
    type: 'test-case',
    description: 'Detailed test scenarios and expected outcomes',
    frontmatter: {
      title: 'New Test Case',
      status: 'Idea',
      type: 'test-case',
      tags: [],
    },
    content: `# Test Case

## Test Objective
What this test validates.

## Preconditions
- Precondition 1
- Precondition 2

## Test Steps
1. Step 1
2. Step 2
3. Step 3

## Expected Results
- Expected result 1
- Expected result 2

## Test Data
Any specific test data required.

## Pass/Fail Criteria
Clear criteria for determining test success.

## Notes
Additional notes or edge cases to consider.
`,
  },
};

/**
 * Get all available templates
 */
export function getAllTemplates(): SpecTemplate[] {
  return Object.values(SPEC_TEMPLATES);
}

/**
 * Get a specific template by ID
 */
export function getTemplateById(templateId: string): SpecTemplate | null {
  return SPEC_TEMPLATES[templateId] || null;
}

/**
 * Generate spec content from template with frontmatter
 */
export function generateSpecFromTemplate(
  templateId: string,
  customFrontmatter?: Record<string, any>
): { content: string; frontmatter: Record<string, any> } | null {
  const template = getTemplateById(templateId);
  if (!template) return null;
  
  const frontmatter = {
    ...template.frontmatter,
    ...customFrontmatter,
  };
  
  return {
    content: template.content,
    frontmatter,
  };
}
