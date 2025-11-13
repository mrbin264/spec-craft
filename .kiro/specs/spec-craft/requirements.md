# Requirements Document

## Introduction

SpecCraft is a lightweight specification workspace that enables product teams to create, manage, and evolve product documentation through a unified workflow (Idea → Epic → User Story → Technical Spec → Acceptance → QA). The system is Markdown-native with YAML frontmatter support and integrates Azure AI assistance to reduce documentation workload while maintaining traceability and version control.

## Glossary

- **SpecCraft System**: The web-based application that manages specification documents
- **Spec Document**: A Markdown file with YAML frontmatter containing product requirements, technical specifications, or test cases
- **AI Assistant**: The Azure AI-powered service that provides text generation and transformation capabilities
- **Workflow Stage**: A defined state in the specification lifecycle (Idea, Draft, Review, Ready, In Progress, Done)
- **Revision**: A saved version of a Spec Document with timestamp and author metadata
- **Traceability Link**: A relationship between specifications (Epic → User Story → Technical Spec)
- **User**: Any authenticated person using the SpecCraft System (PM, TA, Dev, QA, or Stakeholder)
- **Frontend**: The Next.js-based browser interface
- **Backend API**: The server-side API handling business logic and data operations
- **CosmosDB**: The Azure database storing Spec Documents and metadata
- **Blob Storage**: The Azure service storing file attachments

## Requirements

### Requirement 1

**User Story:** As a PM, I want to create new specification documents from templates, so that I can quickly start documenting features with consistent structure

#### Acceptance Criteria

1. WHEN a User selects "Create New Spec", THE SpecCraft System SHALL display available template options
2. WHEN a User chooses a template, THE SpecCraft System SHALL create a new Spec Document with pre-populated structure and YAML frontmatter
3. THE SpecCraft System SHALL store the new Spec Document in CosmosDB with status "Idea"
4. THE SpecCraft System SHALL assign a unique identifier to each Spec Document
5. WHEN a Spec Document is created, THE SpecCraft System SHALL record the creator's identity and timestamp

### Requirement 2

**User Story:** As a TA, I want to edit specification documents with live Markdown preview, so that I can see formatted output while writing technical content

#### Acceptance Criteria

1. THE SpecCraft System SHALL provide a split-pane editor with Markdown input and rendered preview
2. WHEN a User types in the editor, THE SpecCraft System SHALL update the preview within 500 milliseconds
3. THE SpecCraft System SHALL render Mermaid diagram syntax as visual diagrams in the preview pane
4. THE SpecCraft System SHALL support YAML frontmatter editing with syntax validation
5. WHEN a User enters invalid YAML, THE SpecCraft System SHALL display an error message with line number

### Requirement 3

**User Story:** As a PM, I want AI assistance to generate acceptance criteria from user stories, so that I can reduce manual writing effort and ensure completeness

#### Acceptance Criteria

1. WHEN a User selects text in a Spec Document, THE SpecCraft System SHALL display an AI Assistant panel
2. WHEN a User requests "Generate acceptance criteria", THE SpecCraft System SHALL send the selected text to Azure AI with appropriate prompt
3. THE SpecCraft System SHALL display token cost estimation before sending requests to Azure AI
4. WHEN Azure AI returns suggestions, THE SpecCraft System SHALL tag the content as "AI-generated" with timestamp
5. THE SpecCraft System SHALL allow Users to insert, replace, or reject AI-generated content

### Requirement 4

**User Story:** As a Dev, I want to view specification version history with diff comparison, so that I can understand what changed between revisions

#### Acceptance Criteria

1. WHEN a User saves a Spec Document, THE SpecCraft System SHALL create a new Revision with incremented version number
2. THE SpecCraft System SHALL store each Revision with author identity, timestamp, and full content snapshot
3. WHEN a User opens version history, THE SpecCraft System SHALL display a chronological list of all Revisions
4. WHEN a User selects two Revisions, THE SpecCraft System SHALL display differences in side-by-side or inline format
5. THE SpecCraft System SHALL highlight added lines in green and removed lines in red

### Requirement 5

**User Story:** As a PM, I want to move specifications through workflow stages with role-based permissions, so that only authorized users can approve or progress documents

#### Acceptance Criteria

1. THE SpecCraft System SHALL enforce the workflow sequence: Idea → Draft → Review → Ready → In Progress → Done
2. WHERE a User has PM or TA role, THE SpecCraft System SHALL allow transition from Draft to Review
3. WHERE a User has PM or Stakeholder role, THE SpecCraft System SHALL allow transition from Review to Ready
4. WHERE a User has Dev role, THE SpecCraft System SHALL allow transition from Ready to In Progress
5. WHERE a User has QA role, THE SpecCraft System SHALL allow transition from In Progress to Done

### Requirement 6

**User Story:** As a QA, I want to add threaded comments on specifications, so that I can discuss specific sections with team members

#### Acceptance Criteria

1. WHEN a User selects text in a Spec Document, THE SpecCraft System SHALL provide an option to add a comment
2. THE SpecCraft System SHALL anchor comments to specific line ranges in the Spec Document
3. WHEN a User mentions another User with "@username", THE SpecCraft System SHALL send an email notification to the mentioned User
4. THE SpecCraft System SHALL support threaded replies to existing comments
5. WHEN a comment is added, THE SpecCraft System SHALL display the author name and timestamp

### Requirement 7

**User Story:** As a PM, I want to create traceability links between epics, user stories, and technical specs, so that I can track feature decomposition

#### Acceptance Criteria

1. THE SpecCraft System SHALL allow Users to define parent-child relationships between Spec Documents
2. WHEN a User creates a traceability link, THE SpecCraft System SHALL store the relationship in CosmosDB
3. THE SpecCraft System SHALL display a visual graph showing Epic → User Story → Technical Spec relationships
4. WHEN a User clicks a node in the traceability graph, THE SpecCraft System SHALL navigate to that Spec Document
5. THE SpecCraft System SHALL prevent circular dependencies in traceability links

### Requirement 8

**User Story:** As a Stakeholder, I want to authenticate securely and access only specifications relevant to my role, so that sensitive information is protected

#### Acceptance Criteria

1. THE SpecCraft System SHALL authenticate Users via Azure AD or magic link email
2. WHEN authentication succeeds, THE SpecCraft System SHALL create a session token valid for 24 hours
3. THE SpecCraft System SHALL enforce role-based permissions for all Spec Document operations
4. WHERE a User has Stakeholder role, THE SpecCraft System SHALL allow read access and approval actions only
5. WHEN a User attempts unauthorized actions, THE SpecCraft System SHALL return a 403 Forbidden response

### Requirement 9

**User Story:** As a PM, I want AI token usage to be capped and monitored, so that cloud costs remain under $50 per month

#### Acceptance Criteria

1. THE SpecCraft System SHALL enforce a daily token quota of 100,000 tokens per project
2. WHEN daily quota is exceeded, THE SpecCraft System SHALL reject AI requests with an error message
3. THE SpecCraft System SHALL log all AI requests with token count, model used, and timestamp
4. THE SpecCraft System SHALL use gpt-4o-mini model by default for cost optimization
5. THE SpecCraft System SHALL display cumulative token usage in the admin dashboard

### Requirement 10

**User Story:** As a TA, I want to attach files to specifications and store them securely, so that I can include diagrams, mockups, and supporting documents

#### Acceptance Criteria

1. THE SpecCraft System SHALL allow Users to upload files up to 10 MB in size
2. WHEN a User uploads a file, THE SpecCraft System SHALL store it in Azure Blob Storage
3. THE SpecCraft System SHALL generate a secure URL for each uploaded file valid for 1 hour
4. THE SpecCraft System SHALL associate uploaded files with their parent Spec Document in CosmosDB
5. THE SpecCraft System SHALL support image preview for PNG, JPG, and SVG file types
