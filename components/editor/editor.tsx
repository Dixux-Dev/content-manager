"use client"

import * as React from "react"
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { EditorState, SerializedEditorState, $createParagraphNode, $createTextNode, $getRoot, createEditor } from "lexical"
import { $generateNodesFromDOM } from "@lexical/html"
import { htmlToSerializedState } from "@/lib/editor-utils"
import { $createCodeNode } from "@lexical/code"
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text"
import { $createTableNode, $createTableRowNode, $createTableCellNode } from "@lexical/table"
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
        
        // First try our custom HTML converter for better control
        const serializedState = htmlToSerializedState(initialValue)
        console.log('=== CONVERTED TO SERIALIZED STATE ===')
        console.log('Serialized state:', JSON.stringify(serializedState, null, 2))
        
        // Clear any existing content and create nodes from our serialized state
        root.clear()
        console.log('=== CREATING EDITOR NODES ===')
        serializedState.root.children.forEach((child: any) => {
          if (child.type === 'paragraph') {
            const paragraph = $createParagraphNode()
            child.children.forEach((textNode: any) => {
              const text = $createTextNode(textNode.text || '')
              text.setFormat(textNode.format || 0)
              paragraph.append(text)
            })
            root.append(paragraph)
          } else if (child.type === 'code') {
            const codeNode = $createCodeNode()
            child.children.forEach((textNode: any) => {
              const text = $createTextNode(textNode.text || '')
              codeNode.append(text)
            })
            root.append(codeNode)
          } else if (child.type === 'heading') {
            const heading = $createHeadingNode(child.tag || 'h1')
            child.children.forEach((textNode: any) => {
              const text = $createTextNode(textNode.text || '')
              text.setFormat(textNode.format || 0)
              heading.append(text)
            })
            root.append(heading)
          } else if (child.type === 'quote') {
            const quote = $createQuoteNode()
            child.children.forEach((textNode: any) => {
              const text = $createTextNode(textNode.text || '')
              text.setFormat(textNode.format || 0)
              quote.append(text)
            })
            root.append(quote)
          } else if (child.type === 'table') {
            const table = $createTableNode()
            child.children.forEach((rowData: any) => {
              if (rowData.type === 'tablerow') {
                const row = $createTableRowNode()
                rowData.children.forEach((cellData: any) => {
                  if (cellData.type === 'tablecell') {
                    const cell = $createTableCellNode(cellData.headerState || 0)
                    
                    if (cellData.children && cellData.children.length > 0) {
                      // Handle nested structure: cell → paragraphs → text nodes
                      cellData.children.forEach((childNode: any) => {
                        if (childNode.type === 'paragraph') {
                          const paragraph = $createParagraphNode()
                          
                          if (childNode.children && childNode.children.length > 0) {
                            childNode.children.forEach((textNode: any) => {
                              const text = $createTextNode(textNode.text || '')
                              text.setFormat(textNode.format || 0)
                              paragraph.append(text)
                            })
                          } else {
                            // Empty paragraph needs an empty text node
                            paragraph.append($createTextNode(''))
                          }
                          
                          cell.append(paragraph)
                        } else {
                          // Fallback: treat as direct text node
                          const paragraph = $createParagraphNode()
                          const text = $createTextNode(childNode.text || '')
                          text.setFormat(childNode.format || 0)
                          paragraph.append(text)
                          cell.append(paragraph)
                        }
                      })
                    } else {
                      // Empty cell needs a paragraph with empty text node
                      const paragraph = $createParagraphNode()
                      paragraph.append($createTextNode(''))
                      cell.append(paragraph)
                    }
                    
                    row.append(cell)
                  }
                })
                table.append(row)
              }
            })
            root.append(table)
          } else if (child.type === 'list') {
            const list = $createListNode(child.listType || 'bullet')
            child.children.forEach((itemData: any) => {
              if (itemData.type === 'listitem') {
                const listItem = $createListItemNode()
                
                if (itemData.children && itemData.children.length > 0) {
                  itemData.children.forEach((childNode: any) => {
                    if (childNode.type === 'paragraph') {
                      const paragraph = $createParagraphNode()
                      
                      if (childNode.children && childNode.children.length > 0) {
                        childNode.children.forEach((textNode: any) => {
                          const text = $createTextNode(textNode.text || '')
                          text.setFormat(textNode.format || 0)
                          paragraph.append(text)
                        })
                      } else {
                        paragraph.append($createTextNode(''))
                      }
                      
                      listItem.append(paragraph)
                    } else if (childNode.type === 'list') {
                      // Handle nested list
                      const nestedList = $createListNode(childNode.listType || 'bullet')
                      
                      childNode.children.forEach((nestedItemData: any) => {
                        if (nestedItemData.type === 'listitem') {
                          const nestedListItem = $createListItemNode()
                          
                          if (nestedItemData.children && nestedItemData.children.length > 0) {
                            nestedItemData.children.forEach((nestedChildNode: any) => {
                              if (nestedChildNode.type === 'paragraph') {
                                const nestedParagraph = $createParagraphNode()
                                
                                if (nestedChildNode.children && nestedChildNode.children.length > 0) {
                                  nestedChildNode.children.forEach((nestedTextNode: any) => {
                                    const nestedText = $createTextNode(nestedTextNode.text || '')
                                    nestedText.setFormat(nestedTextNode.format || 0)
                                    nestedParagraph.append(nestedText)
                                  })
                                } else {
                                  nestedParagraph.append($createTextNode(''))
                                }
                                
                                nestedListItem.append(nestedParagraph)
                              } else {
                                const nestedParagraph = $createParagraphNode()
                                const nestedText = $createTextNode(nestedChildNode.text || '')
                                nestedText.setFormat(nestedChildNode.format || 0)
                                nestedParagraph.append(nestedText)
                                nestedListItem.append(nestedParagraph)
                              }
                            })
                          } else {
                            const nestedParagraph = $createParagraphNode()
                            nestedParagraph.append($createTextNode(''))
                            nestedListItem.append(nestedParagraph)
                          }
                          
                          nestedList.append(nestedListItem)
                        }
                      })
                      
                      listItem.append(nestedList)
                    } else {
                      const paragraph = $createParagraphNode()
                      const text = $createTextNode(childNode.text || '')
                      text.setFormat(childNode.format || 0)
                      paragraph.append(text)
                      listItem.append(paragraph)
                    }
                  })
                } else {
                  const paragraph = $createParagraphNode()
                  paragraph.append($createTextNode(''))
                  listItem.append(paragraph)
                }
                
                list.append(listItem)
              }
            })
            root.append(list)
          } else if (child.type === 'image') {
            // Handle image nodes
            const imageNode = $createImageNode({
              src: child.src || '',
              altText: child.altText || '',
              width: child.width || undefined,
              height: child.height || undefined,
              maxWidth: child.maxWidth || 800
            })
            root.append(imageNode)
          }
        })
        console.log('=== EDITOR INITIALIZATION COMPLETED ===')
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
  const [forceRender, setForceRender] = React.useState(0)
  
  // Use editorSerializedState if provided, otherwise fall back to initialValue
  // Priority: initialValue (for fresh content) > editorSerializedState (for state updates)
  const shouldUseSerializedState = editorSerializedState !== undefined && (!initialValue || initialValue.trim() === '')
  const editorConfig = createEditorConfig(shouldUseSerializedState ? undefined : initialValue)

  // Mark as initialized after a short delay to prevent initial onSerializedChange calls
  // Use shorter delay when we have initial content for faster rendering
  React.useEffect(() => {
    const delay = initialValue && initialValue.trim() ? 150 : 500 // Slightly longer for proper styling
    const timer = setTimeout(() => {
      setIsInitialized(true)
      
      // Force a re-render to ensure styles are applied
      if (initialValue && editorInstance) {
        editorInstance.update(() => {
          // Trigger style recalculation
          const root = $getRoot()
          root.markDirty()
        }, { discrete: true })
        
        // Force component re-render for visual consistency
        setTimeout(() => {
          setForceRender(prev => prev + 1)
        }, 100)
      }
    }, delay)
    
    return () => clearTimeout(timer)
  }, [initialValue, editorInstance])

  // Update editor state when editorSerializedState changes
  React.useEffect(() => {
    if (editorInstance && editorSerializedState && isInitialized) {
      console.log('=== UPDATING EDITOR STATE ===')
      console.log('Editor instance:', editorInstance)
      console.log('New serialized state:', editorSerializedState)
      
      // Use a timeout to avoid race conditions with other state updates
      const updateTimeout = setTimeout(() => {
        try {
          // Check if editor is still mounted and valid
          if (editorInstance && editorInstance.isEditable && editorInstance.isEditable()) {
            editorInstance.update(() => {
              try {
                const newEditorState = editorInstance.parseEditorState(editorSerializedState)
                editorInstance.setEditorState(newEditorState)
                console.log('=== EDITOR STATE UPDATED SUCCESSFULLY ===')
              } catch (parseError) {
                console.error('Error parsing editor state:', parseError)
                // Fallback: clear and set empty state
                const root = $getRoot()
                root.clear()
                const paragraph = $createParagraphNode()
                root.append(paragraph)
              }
            }, { discrete: true }) // Use discrete update to avoid conflicts
          }
        } catch (error) {
          console.error('Error updating editor state:', error)
        }
      }, 100) // Small delay to ensure other operations complete
      
      return () => clearTimeout(updateTimeout)
    }
  }, [editorInstance, editorSerializedState, isInitialized])

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
              // Only call onSerializedChange after initialization to prevent data loss
              // Add additional check to prevent race conditions
              if (isInitialized && editorInstance && !editorInstance._updating) {
                // Use requestAnimationFrame to defer the callback
                requestAnimationFrame(() => {
                  if (onSerializedChange) {
                    try {
                      onSerializedChange(editorState.toJSON())
                    } catch (error) {
                      console.error('Error in onSerializedChange callback:', error)
                    }
                  }
                })
              }
            }}
          />
        </TooltipProvider>
      </LexicalComposer>
    </div>
  )
}