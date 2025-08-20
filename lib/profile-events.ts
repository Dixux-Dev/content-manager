// Event system for profile synchronization between components

type ProfileEventType = 'profile-created' | 'profile-updated' | 'profile-deleted'

import { Profile } from '@/types'

interface ProfileEvent {
  type: ProfileEventType
  profileId?: string
  profile?: Profile
}

class ProfileEventEmitter {
  private listeners: Map<ProfileEventType, Array<(event: ProfileEvent) => void>> = new Map()

  // Subscribe to profile events
  subscribe(eventType: ProfileEventType, callback: (event: ProfileEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType)!.push(callback)

    // Return function to unsubscribe
    return () => {
      const callbacks = this.listeners.get(eventType)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  // Emitir evento
  emit(event: ProfileEvent) {
    const callbacks = this.listeners.get(event.type)
    if (callbacks) {
      callbacks.forEach((callback: any) => callback(event))
    }
  }

  // Helper methods for specific events
  profileCreated(profile: Profile) {
    this.emit({
      type: 'profile-created',
      profile
    })
  }

  profileUpdated(profile: Profile) {
    this.emit({
      type: 'profile-updated',
      profileId: profile.id,
      profile
    })
  }

  profileDeleted(profileId: string) {
    this.emit({
      type: 'profile-deleted',
      profileId
    })
  }
}

// Instancia global del emitter
export const profileEvents = new ProfileEventEmitter()