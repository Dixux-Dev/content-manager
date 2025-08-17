"use client"

import { ContentEditable as LexicalContentEditable } from "@lexical/react/LexicalContentEditable"
import { cn } from "@/lib/utils"

interface ContentEditableProps {
  placeholder: string
  className?: string
}

export function ContentEditable({ placeholder, className }: ContentEditableProps) {
  return (
    <div className="relative">
      <LexicalContentEditable
        className={cn(
          "min-h-[250px] resize-none border-0 bg-transparent caret-current font-size-inherit outline-0 p-4 leading-6 text-left text-foreground",
          className
        )}
        aria-placeholder={placeholder}
        placeholder={
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none select-none">
            {placeholder}
          </div>
        }
      />
    </div>
  )
}