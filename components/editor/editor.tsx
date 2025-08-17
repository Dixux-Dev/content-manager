"use client"

import * as React from "react"
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { EditorState, SerializedEditorState, $createParagraphNode, $createTextNode, $getRoot, createEditor, $isTextNode, $isElementNode } from "lexical"
import { $generateNodesFromDOM } from "@lexical/html"
import { htmlToSerializedState } from "@/lib/editor-utils"
import { $createCodeNode } from "@lexical/code"
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text"
// REMOVED: Table imports
import { $createListNode, $createListItemNode } from "@lexical/list"
import { $createImageNode } from "./nodes/ImageNode"

import { editorTheme } from "@/components/editor/themes/editor-theme"
import { TooltipProvider } from "@/components/ui/tooltip"

import { nodes } from "./nodes"
import { Plugins } from "./plugins"

// Create a default initial state with HTML support
const createInitialState = (initialValue?: string) => (editor: any) => {
  const root = $getRoot()
  if (root.getFirstChild() === null) {
    if (initialValue && initialValue.trim() !== '') {
      try {
        // Use Lexical's native HTML import for proper HTML parsing
        
        // If the content looks like plain text, wrap it in a paragraph
        const isPlainText = !initialValue.includes('<') || initialValue.trim().startsWith('Eres un')
        
        if (isPlainText) {
          const paragraph = $createParagraphNode()
          const textNode = $createTextNode(initialValue)
          paragraph.append(textNode)
          root.append(paragraph)
          return
        }
        
        // Clean HTML by removing inline styles to use CSS classes instead
        const cleanedHtml = initialValue.replace(/style="[^"]*"/gi, '')
        
        // Create a temporary DOM parser
        const parser = new DOMParser()
        const doc = parser.parseFromString(cleanedHtml, 'text/html')
        
        // Clear existing content
        root.clear()
        
        // Use Lexical's built-in HTML import with error handling
        let nodes: any[] = []
        try {
          nodes = $generateNodesFromDOM(editor, doc)
        } catch (domError) {
          console.error('Error generating nodes from DOM:', domError)
          // Fallback to simple text parsing
          const paragraph = $createParagraphNode()
          const textNode = $createTextNode(initialValue)
          paragraph.append(textNode)
          root.append(paragraph)
          return
        }
        
        // Filter out null/undefined nodes
        const validNodes = nodes.filter(node => node != null)
        
        // If no valid nodes, fallback to text
        if (validNodes.length === 0) {
          const paragraph = $createParagraphNode()
          const textNode = $createTextNode(initialValue)
          paragraph.append(textNode)
          root.append(paragraph)
          return
        }
        
        // Append only valid nodes to root (ElementNode or DecoratorNode)
        validNodes.forEach((node, index) => {
          if (node) {
            try {
              // Check if node can be appended to root
              if ($isTextNode(node)) {
                // TextNodes must be wrapped in a paragraph
                const paragraph = $createParagraphNode()
                paragraph.append(node)
                root.append(paragraph)
              } else if ($isElementNode(node)) {
                // ElementNodes can be appended to root
                root.append(node)
              } else {
                // For unknown node types, wrap in paragraph if possible
                try {
                  const paragraph = $createParagraphNode()
                  const textContent = node.getTextContent ? node.getTextContent() : ''
                  if (textContent) {
                    const textNode = $createTextNode(textContent)
                    paragraph.append(textNode)
                    root.append(paragraph)
                  }
                } catch (e) {
                  // Skip problematic node conversions
                }
              }
            } catch (nodeError) {
              // Skip problematic nodes
            }
          }
        })
        return
      } catch (error) {
        console.error('Custom HTML parsing failed, using fallback:', error)
      }
      
      // Fallback to text
      const paragraph = $createParagraphNode()
      const textNode = $createTextNode(initialValue)
      paragraph.append(textNode)
      root.append(paragraph)
    } else {
      // Empty paragraph as default
      const paragraph = $createParagraphNode()
      root.append(paragraph)
    }
  }
}

const createEditorConfig = (initialValue?: string): InitialConfigType => ({
  namespace: "Editor",
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error)
  },
  editorState: initialValue ? createInitialState(initialValue) : undefined,
})

/**
 * Props for the EditorRefPlugin component
 * @description Internal plugin to capture editor instance reference
 */
interface EditorRefPluginProps {
  /** Callback fired when editor instance is ready
   * @param editor - The Lexical editor instance
   */
  onEditorReady: (editor: any) => void
}

/**
 * Plugin to capture editor instance reference
 * @description Internal Lexical plugin that provides access to editor instance
 */
function EditorRefPlugin({ onEditorReady }: EditorRefPluginProps) {
  const [editor] = useLexicalComposerContext()
  
  React.useEffect(() => {
    if (editor) {
      onEditorReady(editor)
    }
  }, [editor, onEditorReady])
  
  return null
}

/**
 * Props for the main Editor component
 * @description Rich text editor built on Lexical with support for HTML import/export
 */
interface EditorProps {
  /** Current Lexical editor state object
   * @description Direct access to Lexical EditorState - use for programmatic control
   * @deprecated Prefer using initialValue for initial content
   */
  editorState?: EditorState
  /** Serialized editor state as JSON
   * @description JSON representation of editor content - useful for persistence
   * @deprecated Prefer using initialValue for initial content
   */
  editorSerializedState?: SerializedEditorState
  /** Callback fired when editor state changes
   * @description Receives the raw Lexical EditorState object
   * @param editorState - The updated Lexical editor state
   */
  onChange?: (editorState: EditorState) => void
  /** Callback fired when serialized state changes
   * @description Receives JSON representation of editor content
   * @param editorSerializedState - The serialized editor state as JSON
   */
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void
  /** Placeholder text shown when editor is empty
   * @default "Start typing ..."
   * @example "Enter your content here..."
   */
  placeholder?: string
  /** Initial content to load in the editor
   * @description Can be HTML string or plain text - automatically parsed
   * @example "<p>Hello <strong>world</strong></p>" | "Plain text content"
   */
  initialValue?: string
}

export function Editor({
  editorState,
  editorSerializedState,
  onChange,
  onSerializedChange,
  placeholder = "Start typing ...",
  initialValue,
}: EditorProps) {
  const [isInitialized, setIsInitialized] = React.useState(false)
  const [editorInstance, setEditorInstance] = React.useState<any>(null)
  
  // SIMPLIFIED: Always use initialValue, ignore editorSerializedState for initial load
  const editorConfig = createEditorConfig(initialValue)

  // SIMPLIFIED: Initialize after a short delay to prevent initial onSerializedChange calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true)
    }, 300) // Simple fixed delay
    
    return () => clearTimeout(timer)
  }, [])

  // REMOVED: Complex editor state updating that was causing cursor issues
  // The editor now uses initialValue and editorConfig properly without manual updates

  return (
    <div className="bg-background overflow-hidden rounded-lg border shadow">
      <LexicalComposer
        initialConfig={editorConfig}
      >
        <TooltipProvider>
          <EditorRefPlugin onEditorReady={setEditorInstance} />
          
          <Plugins 
            placeholder={placeholder} 
            onSerializedChange={isInitialized ? onSerializedChange : undefined} 
          />

          <OnChangePlugin
            ignoreSelectionChange={true}
            onChange={(editorState) => {
              onChange?.(editorState)
              // SIMPLIFIED: Always call onSerializedChange after initialization
              if (isInitialized && onSerializedChange) {
                try {
                  onSerializedChange(editorState.toJSON())
                } catch (error) {
                  console.error('Error in onSerializedChange callback:', error)
                }
              }
            }}
          />
        </TooltipProvider>
      </LexicalComposer>
    </div>
  )
}