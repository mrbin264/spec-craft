# Monitoring and Error Handling

This directory contains the monitoring and error handling infrastructure for SpecCraft.

## Components

### Error Handling (`lib/errors.ts`)

Standardized error handling with consistent error codes and responses:

```typescript
import { AppError, ErrorCode, handleApiError } from '@/lib/errors';

// Throw a custom error
throw new AppError(ErrorCode.NOT_FOUND, 'Spec not found', { specId });

// Handle errors in API routes
try {
  // ... your code
} catch (error) {
  const { response, status } = handleApiError(error);
  return NextResponse.json(response, { status });
}
```

**Error Codes:**
- `AUTH_REQUIRED` (401): User not authenticated
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid request data
- `QUOTA_EXCEEDED` (429): AI token quota exceeded
- `RATE_LIMIT` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

### Retry Logic (`lib/retry.ts`)

Exponential backoff retry for failed operations:

```typescript
import { retryWithBackoff, retryFetch } from '@/lib/retry';

// Retry any async function
const result = await retryWithBackoff(
  async () => {
    return await someOperation();
  },
  {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
  }
);

// Retry fetch requests
const response = await retryFetch('/api/specs', {
  method: 'GET',
});
```

### Toast Notifications (`lib/toast.tsx`)

User-facing error and success messages:

```typescript
'use client';
import { useToast } from '@/lib/toast';

function MyComponent() {
  const { showToast } = useToast();

  const handleError = () => {
    showToast('error', 'Failed to save spec');
  };

  const handleSuccess = () => {
    showToast('success', 'Spec saved successfully');
  };

  return <button onClick={handleSuccess}>Save</button>;
}
```

**Toast Types:**
- `success`: Green toast for successful operations
- `error`: Red toast for errors
- `warning`: Yellow toast for warnings
- `info`: Blue toast for informational messages

### Error Boundary (`components/error-boundary.tsx`)

React error boundary to catch rendering errors:

```typescript
import { ErrorBoundary } from '@/components/error-boundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

The error boundary is already included in the root layout.

### Monitoring (`lib/monitoring.ts`)

Structured logging and performance tracking:

```typescript
import { 
  logger, 
  PerformanceMonitor,
  trackApiRequest,
  trackAiUsage,
  trackDatabaseQuery,
  trackError 
} from '@/lib/monitoring';

// Structured logging
logger.info('User logged in', { userId: '123' });
logger.error('Failed to save', error, { specId: '456' });

// Performance monitoring
const monitor = new PerformanceMonitor('operation-name');
// ... do work
monitor.end(); // Logs duration

// Track API requests (automatic in middleware)
trackApiRequest('GET', '/api/specs', 200, 150, 'user-123');

// Track AI usage (automatic in AI repository)
trackAiUsage('generate', 'gpt-4o-mini', 1000, 0.00015, 'user-123', 'spec-456');

// Track database queries (automatic in repositories)
trackDatabaseQuery('specs', 'find', 50, 10);

// Track errors
trackError('Operation failed', error, { context: 'data' });
```

### Application Insights (`lib/app-insights.ts`)

Azure Application Insights integration for production monitoring:

**Setup:**

1. Install the package (production only):
```bash
npm install applicationinsights
```

2. Set environment variable:
```bash
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...
```

3. Monitoring is automatic - all logs, metrics, and errors are sent to Application Insights in production.

**Features:**
- Automatic request tracking
- Performance metrics
- Exception tracking
- Custom events and metrics
- Dependency tracking (CosmosDB, Azure AI)

### API Error Hook (`lib/hooks/use-api-error.ts`)

React hook for handling API errors with toast notifications:

```typescript
'use client';
import { useApiError } from '@/lib/hooks/use-api-error';

function MyComponent() {
  const { handleError } = useApiError();

  const fetchData = async () => {
    try {
      const response = await fetch('/api/specs');
      if (!response.ok) {
        throw await response.json();
      }
    } catch (error) {
      handleError(error); // Shows toast notification
    }
  };

  return <button onClick={fetchData}>Load</button>;
}
```

## Usage in API Routes

Wrap your API route handlers with monitoring:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ErrorCode, createErrorResponse } from '@/lib/errors';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    return NextResponse.json({ data: 'success' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Invalid data', error.issues),
        { status: 400 }
      );
    }
    
    const { response, status } = handleApiError(error);
    return NextResponse.json(response, { status });
  }
}
```

## Monitoring in Production

When deployed to production with Application Insights configured:

1. **View Logs**: Azure Portal → Application Insights → Logs
2. **Performance**: Monitor API response times and database queries
3. **Errors**: Track exceptions and error rates
4. **AI Usage**: Monitor token consumption and costs
5. **Alerts**: Set up alerts for error rates, slow queries, or high costs

## Best Practices

1. **Always use structured logging** with context:
   ```typescript
   logger.info('Action completed', { userId, specId, action });
   ```

2. **Track performance for critical operations**:
   ```typescript
   const monitor = new PerformanceMonitor('critical-operation');
   // ... work
   monitor.end();
   ```

3. **Use appropriate error codes** in API responses

4. **Show user-friendly messages** with toast notifications

5. **Log errors with context** for debugging:
   ```typescript
   trackError('Failed to process', error, { userId, specId });
   ```

6. **Monitor AI costs** by tracking token usage

7. **Set up alerts** in Application Insights for production issues
