// Sistema de eventos para sincronización de perfiles entre componentes

type ProfileEventType = 'profile-created' | 'profile-updated' | 'profile-deleted'

interface ProfileEvent {
  type: ProfileEventType
  profileId?: string
  profile?: any
}

class ProfileEventEmitter {
  private listeners: Map<ProfileEventType, Array<(event: ProfileEvent) => void>> = new Map()

  // Suscribirse a eventos de perfiles
  subscribe(eventType: ProfileEventType, callback: (event: ProfileEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType)!.push(callback)

    // Retornar función para desuscribirse
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
      callbacks.forEach(callback => callback(event))
    }
  }

  // Métodos helper para eventos específicos
  profileCreated(profile: any) {
    this.emit({
      type: 'profile-created',
      profile
    })
  }

  profileUpdated(profile: any) {
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