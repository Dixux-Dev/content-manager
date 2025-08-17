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
        console.log('=== INITIALIZING EDITOR WITH HTML ===')
        console.log('Initial value:', initialValue)
        console.log('Initial value type:', typeof initialValue)
        console.log('Initial value length:', initialValue.length)
        
        // Use Lexical's native HTML import for proper HTML parsing
        console.log('=== USING LEXICAL NATIVE HTML IMPORT ===')
        
        // If the content looks like plain text, wrap it in a paragraph
        const isPlainText = !initialValue.includes('<') || initialValue.trim().startsWith('Eres un')
        
        if (isPlainText) {
          console.log('Content appears to be plain text, wrapping in paragraph')
          const paragraph = $createParagraphNode()
          const textNode = $createTextNode(initialValue)
          paragraph.append(textNode)
          root.append(paragraph)
          return
        }
        
        // Clean HTML by removing inline styles to use CSS classes instead
        const cleanedHtml = initialValue.replace(/style="[^"]*"/gi, '')
        console.log('Cleaned HTML:', cleanedHtml)
        
        // Create a temporary DOM parser
        const parser = new DOMParser()
        const doc = parser.parseFromString(cleanedHtml, 'text/html')
        
        // Clear existing content
        root.clear()
        
        // Use Lexical's built-in HTML import with error handling
        let nodes: any[] = []
        try {
          nodes = $generateNodesFromDOM(editor, doc)
          console.log('Generated nodes from DOM:', nodes)
          console.log('Node count:', nodes.length)
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
        console.log('Valid node count:', validNodes.length)
        
        // If no valid nodes, fallback to text
        if (validNodes.length === 0) {
          console.log('No valid nodes generated, using text fallback')
          const paragraph = $createParagraphNode()
          const textNode = $createTextNode(initialValue)
          paragraph.append(textNode)
          root.append(paragraph)
          return
        }
        
        // Append only valid nodes to root (ElementNode or DecoratorNode)
        validNodes.forEach((node, index) => {
          console.log(`Processing node ${index}:`, node?.getType(), node)
          
          if (node) {
            try {
              // Check if node can be appended to root
              if ($isTextNode(node)) {
                console.log('Wrapping TextNode in paragraph')
                // TextNodes must be wrapped in a paragraph
                const paragraph = $createParagraphNode()
                paragraph.append(node)
                root.append(paragraph)
              } else if ($isElementNode(node)) {
                console.log('Appending ElementNode to root')
                // ElementNodes can be appended to root
                root.append(node)
              } else {
                console.warn('Skipping invalid node type for root:', node.getType(), node)
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
                  console.error('Failed to convert node to text:', e)
                }
              }
            } catch (nodeError) {
              console.error(`Error processing node ${index}:`, nodeError, node)
              // Skip problematic nodes
            }
          }
        })
        console.log('=== LEXICAL HTML IMPORT COMPLETED ===')
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

// Plugin to capture editor instance reference
function EditorRefPlugin({ onEditorReady }: { onEditorReady: (editor: any) => void }) {
  const [editor] = useLexicalComposerContext()
  
  React.useEffect(() => {
    if (editor) {
      onEditorReady(editor)
    }
  }, [editor, onEditorReady])
  
  return null
}

export function Editor({
  editorState,
  editorSerializedState,
  onChange,
  onSerializedChange,
  placeholder = "Start typing ...",
  initialValue,
}: {
  editorState?: EditorState
  editorSerializedState?: SerializedEditorState
  onChange?: (editorState: EditorState) => void
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void
  placeholder?: string
  initialValue?: string
}) {
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