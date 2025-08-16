// Types for the Content Manager application

export type ContentWithRelations = {
  id: string
  title: string
  type: 'SNIPPET' | 'PAGE'
  category: string
  content: string
  wordCount: number | null
  profileId: string
  profile: {
    id: string
    name: string
    description: string | null
  }
  createdAt: Date
  updatedAt: Date
  lastEditor: {
    id: string
    name: string | null
    email: string
  } | null
  lastEditorId: string | null
}

export type ProfileWithCreator = {
  id: string
  name: string
  description: string | null
  prompt: string
  tone: string | null
  style: string | null
  format: string | null
  creator: {
    id: string
    name: string | null
    email: string
  }
  createdAt: Date
  updatedAt: Date
}

export type UserSession = {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'VIEWER'
}