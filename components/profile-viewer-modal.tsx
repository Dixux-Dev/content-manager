"use client"

import { Button } from "@/components/ui/button"
import { Editor } from "@/components/editor/editor"
import { ProfileWithCreator } from "@/types"
import { X } from "lucide-react"

interface ProfileViewerModalProps {
  profile: ProfileWithCreator
  onClose: () => void
}

/**
 * Modal component for viewing profile prompt with rich text editor
 * @description Shows profile prompt in an interactive rich text editor without save functionality
 */
export function ProfileViewerModal({ profile, onClose }: ProfileViewerModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">{profile.name}</h2>
            {profile.description && (
              <p className="text-sm text-gray-600 mt-1">{profile.description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Prompt</label>
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <Editor
              initialValue={profile.prompt}
              placeholder="Profile prompt..."
              onSerializedChange={() => {}} // No save functionality
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}