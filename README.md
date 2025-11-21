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

### Azure Infrastructure Setup

Before running the application, you need to provision Azure resources:

```bash
cd infrastructure
./deploy.sh dev eastus
cd ..
cp .env.dev .env.local
```

See [infrastructure/QUICKSTART.md](infrastructure/QUICKSTART.md) for detailed setup instructions.

### Environment Variables

After deploying infrastructure, the `.env.dev` file will be automatically generated with connection strings. Copy it to `.env.local` for local development.

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
- `/infrastructure` - Azure infrastructure as code (Bicep templates)

## Infrastructure

SpecCraft uses Azure cloud services:

- **CosmosDB** (MongoDB API, Serverless) - Document storage
- **Blob Storage** - File attachments with lifecycle policies
- **Azure OpenAI** - AI-powered content generation
- **Application Insights** - Monitoring and logging

### Cost Estimation

Expected monthly costs for 10 active users:
- CosmosDB: $1-3/month
- Blob Storage: $0.02-0.10/month
- Azure OpenAI: $15-20/month
- Application Insights: Free tier
- **Total: ~$20-25/month**

Run `./infrastructure/estimate-costs.sh` for custom estimates.

### Deployment Options

1. **Local Development**: Use Azure emulators (CosmosDB emulator, Azurite)
2. **Cloud Development**: Deploy to Azure with `./infrastructure/deploy.sh dev`
3. **Production**: Deploy with `./infrastructure/deploy.sh prod`

See [infrastructure/README.md](infrastructure/README.md) for complete documentation.
