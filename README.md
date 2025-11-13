# SpecCraft

A lightweight specification workspace that enables product teams to create, manage, and evolve product documentation through a unified workflow.

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 8+

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your Azure service credentials.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- TailwindCSS 4.x
- Azure CosmosDB
- Azure Blob Storage
- Azure OpenAI

## Project Structure

- `/app` - Next.js App Router pages and layouts
- `/components` - React components
- `/lib` - Utility functions and shared logic
- `/types` - TypeScript type definitions
- `/services` - External service integrations
