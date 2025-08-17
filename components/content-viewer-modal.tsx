"use client"

import { Button } from "@/components/ui/button"
import { Editor } from "@/components/editor/editor"
import { ContentWithRelations } from "@/types"
import { X } from "lucide-react"

interface ContentViewerModalProps {
  content: ContentWithRelations
  onClose: () => void
}

/**
 * Modal component for viewing content with rich text editor
 * @description Shows content in an interactive rich text editor without save functionality
 */
export function ContentViewerModal({ content, onClose }: ContentViewerModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{content.title}</h2>
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
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <Editor
              initialValue={content.content}
              placeholder="Content..."
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