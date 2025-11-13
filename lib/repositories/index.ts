// Repository exports
export { BaseRepository } from './base-repository';
export { SpecRepository } from './spec-repository';
export { RevisionRepository } from './revision-repository';
export { CommentRepository } from './comment-repository';
export { UserRepository } from './user-repository';
export { TraceabilityRepository } from './traceability-repository';
export { AIUsageRepository } from './ai-usage-repository';
export { FileAttachmentRepository } from './file-attachment-repository';

// Import classes for singleton instances
import { SpecRepository } from './spec-repository';
import { RevisionRepository } from './revision-repository';
import { CommentRepository } from './comment-repository';
import { UserRepository } from './user-repository';
import { TraceabilityRepository } from './traceability-repository';
import { AIUsageRepository } from './ai-usage-repository';
import { FileAttachmentRepository } from './file-attachment-repository';

// Singleton instances for easy access
export const specRepository = new SpecRepository();
export const revisionRepository = new RevisionRepository();
export const commentRepository = new CommentRepository();
export const userRepository = new UserRepository();
export const traceabilityRepository = new TraceabilityRepository();
export const aiUsageRepository = new AIUsageRepository();
export const fileAttachmentRepository = new FileAttachmentRepository();
