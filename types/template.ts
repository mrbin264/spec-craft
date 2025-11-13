// Template types for spec documents

import { SpecType } from './spec';

export interface SpecTemplate {
  id: string;
  name: string;
  type: SpecType;
  description: string;
  content: string;
  frontmatter: Record<string, any>;
}
