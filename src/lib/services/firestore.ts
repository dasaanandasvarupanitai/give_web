/**
 * Firestore Service
 * 
 * Comprehensive service for all Firestore operations matching the mobile app functionality.
 * 
 * REFACTOR NOTICE:
 * This file now acts as a central export point. The implementation has been split into
 * domain-specific services in the same directory.
 * - course-service.ts
 * - batch-service.ts
 * - task-service.ts
 * - submission-service.ts
 * - enrollment-service.ts
 * - comment-service.ts
 * - user-service.ts
 * - content-service.ts
 */

export * from "./batch-service";
export * from "./comment-service";
export * from "./content-service";
export * from "./course-service";
export * from "./enrollment-service";
export * from "./submission-service";
export * from "./task-service";
export * from "./user-service";
export * from "./batch-request-service";