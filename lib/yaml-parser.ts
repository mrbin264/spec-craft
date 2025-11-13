// YAML frontmatter parsing and validation utilities
import { z } from 'zod';
import { SpecMetadata, WorkflowStage, SpecType } from '../types';

// Zod schema for spec metadata validation
const SpecMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  status: z.enum(['Idea', 'Draft', 'Review', 'Ready', 'InProgress', 'Done']),
  type: z.enum(['epic', 'user-story', 'technical-spec', 'test-case']),
  assignee: z.string().optional(),
  tags: z.array(z.string()).default([]),
  parentId: z.string().optional(),
});

export interface ParsedSpec {
  frontmatter: SpecMetadata;
  content: string;
}

/**
 * Parse YAML frontmatter from markdown content
 * Expects format:
 * ---
 * key: value
 * ---
 * content here
 */
export function parseFrontmatter(markdown: string): ParsedSpec {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);
  
  if (!match) {
    throw new Error('Invalid frontmatter format. Expected YAML frontmatter enclosed in ---');
  }
  
  const [, frontmatterStr, content] = match;
  
  try {
    const frontmatter = parseYAML(frontmatterStr);
    const validatedMetadata = SpecMetadataSchema.parse(frontmatter);
    
    return {
      frontmatter: validatedMetadata,
      content: content.trim(),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      throw new Error(`Frontmatter validation failed: ${issues}`);
    }
    throw error;
  }
}

/**
 * Simple YAML parser for frontmatter
 * Handles basic key-value pairs, arrays, and nested objects
 */
function parseYAML(yamlStr: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = yamlStr.split('\n');
  
  let currentKey: string | null = null;
  let currentArray: any[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    // Array item
    if (trimmed.startsWith('- ')) {
      const value = trimmed.substring(2).trim();
      currentArray.push(parseValue(value));
      continue;
    }
    
    // Key-value pair
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      // Save previous array if exists
      if (currentKey && currentArray.length > 0) {
        result[currentKey] = currentArray;
        currentArray = [];
      }
      
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      
      if (value === '') {
        // Array or object follows
        currentKey = key;
      } else {
        result[key] = parseValue(value);
        currentKey = null;
      }
    }
  }
  
  // Save final array if exists
  if (currentKey && currentArray.length > 0) {
    result[currentKey] = currentArray;
  }
  
  return result;
}

/**
 * Parse a YAML value (string, number, boolean, null)
 */
function parseValue(value: string): any {
  if (value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Remove quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  
  // Try to parse as number
  const num = Number(value);
  if (!isNaN(num)) return num;
  
  return value;
}

/**
 * Serialize metadata to YAML frontmatter string
 */
export function serializeFrontmatter(metadata: SpecMetadata): string {
  const lines = ['---'];
  
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined) continue;
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        value.forEach(item => {
          lines.push(`  - ${serializeValue(item)}`);
        });
      }
    } else {
      lines.push(`${key}: ${serializeValue(value)}`);
    }
  }
  
  lines.push('---');
  return lines.join('\n');
}

/**
 * Serialize a value to YAML format
 */
function serializeValue(value: any): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') {
    // Quote strings with special characters
    if (value.includes(':') || value.includes('#') || value.includes('\n')) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  return String(value);
}

/**
 * Combine frontmatter and content into full markdown document
 */
export function combineMarkdown(metadata: SpecMetadata, content: string): string {
  return `${serializeFrontmatter(metadata)}\n\n${content}`;
}

/**
 * Validate metadata without parsing full document
 */
export function validateMetadata(metadata: unknown): SpecMetadata {
  return SpecMetadataSchema.parse(metadata);
}
