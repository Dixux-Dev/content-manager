// Global TypeScript definitions for Content Manager project

export type ContentType = 'SNIPPET' | 'PAGE'
export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER'

// Prisma-based types
export interface User {
  id: string
  name: string | null
  email: string
  password: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface Profile {
  id: string
  name: string
  description: string | null
  prompt: string
  creatorId: string
  createdAt: Date
  updatedAt: Date
}

export interface ProfileWithCreator extends Profile {
  creator: User
}

export interface Content {
  id: string
  title: string
  type: ContentType
  categories: string[] // JSON array of category strings
  content: string
  wordCount: number | null
  profileId: string
  lastEditorId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ContentWithRelations extends Content {
  profile: Profile
  lastEditor: User | null
}

// Partial types for API operations  
export type ContentSelect = { id: string; categories: any } // Prisma JsonValue compatibility
export type ContentUpdate = Partial<Pick<Content, 'categories'>>
export type UserUpdate = Partial<Pick<User, 'name' | 'role'>>

// Form data types
export interface ContentFormData {
  title: string
  type: ContentType
  categories: string[]
  wordCount?: number
  extraInstructions?: string
}

// Event handler types
export type SelectChangeEvent = React.ChangeEvent<HTMLSelectElement>
export type InputChangeEvent = React.ChangeEvent<HTMLInputElement>
export type FormSubmitEvent = React.FormEvent<HTMLFormElement>

// API response types
export interface ApiError {
  error: string
  details?: string
}

export interface ApiSuccess<T = any> {
  success: true
  data?: T
  message?: string
}

// Editor types (basic definitions to avoid 'any')
export interface EditorNode {
  type: string
  version: number
}

export interface TextNode extends EditorNode {
  type: 'text'
  text: string
  format: number
  detail: number
  mode: string
  style: string
}

export interface ParagraphNode extends EditorNode {
  type: 'paragraph'
  children: EditorNode[]
  direction: string
  format: string
  indent: number
}

export interface HeadingNode extends EditorNode {
  type: 'heading'
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  children: EditorNode[]
}

export type AnyEditorNode = TextNode | ParagraphNode | HeadingNode | EditorNode