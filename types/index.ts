/**
 * Type definitions for the Content Manager application
 * Provides comprehensive type safety for content, profiles, and user management
 */

/**
 * Content item with all related data including profile and editor information
 * @description Represents a complete content item with relationships to profile and user data
 */
export type ContentWithRelations = {
  /** Unique identifier for the content item */
  id: string
  /** The title/name of the content */
  title: string
  /** Type of content - either a snippet or full page
   * @example "SNIPPET" | "PAGE"
   */
  type: 'SNIPPET' | 'PAGE'
  /** Array of category tags associated with this content
   * @example ["development", "typescript", "documentation"]
   */
  categories: string[]
  /** The actual content data, can be HTML, markdown, or Lexical JSON
   * @description Content format depends on the editor used - may be HTML or serialized JSON
   */
  content: string
  /** Target or actual word count for the content
   * @default null - calculated automatically for generated content
   */
  wordCount: number | null
  /** Reference to the generation profile used */
  profileId: string
  /** The profile object with creator information */
  profile: {
    /** Unique identifier for the profile */
    id: string
    /** Display name of the profile */
    name: string
    /** Optional description of the profile's purpose */
    description: string | null
  }
  /** When the content was first created */
  createdAt: Date
  /** When the content was last modified */
  updatedAt: Date
  /** Information about the last user to edit this content */
  lastEditor: {
    /** Unique identifier for the user */
    id: string
    /** Display name of the user (optional) */
    name: string | null
    /** Email address of the user */
    email: string
  } | null
  /** Reference to the last editor's ID */
  lastEditorId: string | null
}

/**
 * Generation profile with creator information
 * @description Defines AI generation parameters and settings for content creation
 */
export type ProfileWithCreator = {
  /** Unique identifier for the profile */
  id: string
  /** Display name of the profile */
  name: string
  /** Optional description explaining the profile's purpose and use case */
  description: string | null
  /** The system prompt/instructions for AI generation
   * @example "You are a technical writer specializing in API documentation..."
   */
  prompt: string
  /** The tone of voice for generated content
   * @example "professional" | "casual" | "academic"
   */
  tone: string | null
  /** Writing style preferences
   * @example "concise" | "detailed" | "conversational"
   */
  style: string | null
  /** Output format preferences
   * @example "markdown" | "html" | "plain text"
   */
  format: string | null
  /** Information about who created this profile */
  creator: {
    /** Unique identifier for the creator */
    id: string
    /** Display name of the creator (optional) */
    name: string | null
    /** Email address of the creator */
    email: string
  }
  /** When the profile was created */
  createdAt: Date
  /** When the profile was last updated */
  updatedAt: Date
}

/**
 * User session information for authentication and authorization
 * @description Contains user data needed for session management and access control
 */
export type UserSession = {
  /** Unique identifier for the user */
  id: string
  /** Display name of the user (optional) */
  name: string | null
  /** Email address used for authentication */
  email: string
  /** User's role determining access permissions
   * @description ADMIN can create/edit/delete, VIEWER can only read
   */
  role: 'ADMIN' | 'VIEWER'
}