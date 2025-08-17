"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { TablePlugin } from "@lexical/react/LexicalTablePlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $generateHtmlFromNodes } from "@lexical/html"
import { $getRoot, $insertNodes, $createParagraphNode, $createTextNode } from "lexical"
import { $generateNodesFromDOM } from "@lexical/html"
import { extractCleanHtml } from "@/lib/editor-utils"
import { registerCodeHighlighting, PrismTokenizer } from "@lexical/code"

import { ContentEditable } from "@/components/editor/ui/content-editable"
import { Toolbar } from "@/components/editor/toolbar"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface PluginsProps {
  placeholder?: string
  onSerializedChange?: (serializedState: any) => void
}

export function Plugins({ placeholder = "Start typing ...", onSerializedChange }: PluginsProps) {
  const [editor] = useLexicalComposerContext()
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null)
  const [showHtmlSource, setShowHtmlSource] = useState(false)
  const [currentHtml, setCurrentHtml] = useState("")
  const [isConverting, setIsConverting] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const conversionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Register code highlighting when component mounts
  useEffect(() => {
    return registerCodeHighlighting(editor, PrismTokenizer)
  }, [editor])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (conversionTimeoutRef.current) {
        clearTimeout(conversionTimeoutRef.current)
      }
    }
  }, [])


  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  const handleHtmlSourceClick = useCallback(async () => {
    if (showHtmlSource) {
      // Switch back to rich text mode
      setIsTransitioning(true)
      setShowHtmlSource(false)
      
      // After switching back, ensure the parent component gets the updated state
      setTimeout(() => {
        // Trigger a state change to ensure onSerializedChange is called
        editor.update(() => {
          // Small update to trigger onChange
          const root = $getRoot()
          // Just mark as dirty to trigger change detection
          root.markDirty()
        })
        setIsTransitioning(false)
      }, 100)
    } else {
      // Get current clean HTML from editor and switch to HTML mode
      setIsTransitioning(true)
      
      try {
        const cleanHtml = extractCleanHtml(editor.getEditorState())
        setCurrentHtml(cleanHtml)
        setShowHtmlSource(true)
      } catch (error) {
        console.error('Error extracting HTML:', error)
        // Fallback to empty string if extraction fails
        setCurrentHtml("")
        setShowHtmlSource(true)
      } finally {
        setIsTransitioning(false)
      }
    }
  }, [editor, showHtmlSource])

  // Optimized HTML update function with better performance
  const performHtmlUpdate = useCallback(async (newHtml: string) => {
    setIsConverting(true)
    
    try {
      // Use requestIdleCallback if available for better performance
      const scheduleUpdate = () => {
        return new Promise<void>((resolve) => {
          if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(() => resolve(), { timeout: 1000 })
          } else {
            setTimeout(() => resolve(), 0)
          }
        })
      }
      
      await scheduleUpdate()
      
      // Batch the update operation for better performance
      editor.update(() => {
        try {
          // Clear current content first
          const root = $getRoot()
          root.clear()
          
          // Handle empty or whitespace-only HTML
          if (!newHtml || newHtml.trim() === '') {
            const paragraph = $createParagraphNode()
            root.append(paragraph)
            return
          }
          
          // Simple HTML validation before expensive parsing
          const htmlTrimmed = newHtml.trim()
          if (htmlTrimmed.length > 50000) {
            // For very large content, limit parsing to prevent performance issues
            console.warn('HTML content is very large, truncating for performance')
            newHtml = htmlTrimmed.substring(0, 50000) + '...'
          }
          
          // Parse HTML with error handling
          const parser = new DOMParser()
          const dom = parser.parseFromString(newHtml, 'text/html')
          
          // Check for parser errors
          const parserError = dom.querySelector('parsererror')
          if (parserError) {
            // If HTML parsing failed, treat as plain text
            const paragraph = $createParagraphNode()
            const textNode = $createTextNode(newHtml)
            paragraph.append(textNode)
            root.append(paragraph)
            return
          }
          
          // Generate nodes with performance optimization
          const nodes = $generateNodesFromDOM(editor, dom)
          
          // Optimized node filtering
          const validNodes = nodes.filter(node => {
            if (!node) return false
            
            const type = node.getType()
            // Use a Set for faster lookup
            const validTypes = new Set([
              'paragraph', 'heading', 'quote', 'list', 
              'listitem', 'code', 'table', 'image'
            ])
            return validTypes.has(type)
          })
          
          // Insert nodes or fallback
          if (validNodes.length === 0) {
            const bodyText = dom.body.textContent || newHtml
            if (bodyText.trim()) {
              const paragraph = $createParagraphNode()
              const textNode = $createTextNode(bodyText.trim())
              paragraph.append(textNode)
              root.append(paragraph)
            } else {
              const paragraph = $createParagraphNode()
              root.append(paragraph)
            }
          } else {
            // Batch append for better performance
            root.append(...validNodes)
          }
        } catch (error) {
          console.error('Error parsing HTML:', error)
          // Robust fallback
          const root = $getRoot()
          root.clear()
          const paragraph = $createParagraphNode()
          const textNode = $createTextNode(newHtml || '')
          paragraph.append(textNode)
          root.append(paragraph)
        }
      }, { discrete: true }) // Use discrete update to avoid layout thrashing
      
      // Defer callback to next frame for better performance
      if (onSerializedChange) {
        requestAnimationFrame(() => {
          try {
            const currentState = editor.getEditorState()
            onSerializedChange(currentState.toJSON())
          } catch (error) {
            console.error('Error in serialized change callback:', error)
          }
        })
      }
    } catch (error) {
      console.error('Error in HTML conversion:', error)
    } finally {
      // Defer the loading state update to prevent UI blocking
      requestAnimationFrame(() => {
        setIsConverting(false)
      })
    }
  }, [editor, onSerializedChange])

  // Optimized debounced function to handle HTML updates
  const debouncedHtmlUpdate = useCallback((newHtml: string) => {
    // Clear any existing timeout
    if (conversionTimeoutRef.current) {
      clearTimeout(conversionTimeoutRef.current)
    }
    
    // Set a new timeout for the conversion with longer delay for better performance
    conversionTimeoutRef.current = setTimeout(() => {
      performHtmlUpdate(newHtml)
    }, 800) // Increased delay to reduce frequency of expensive operations
  }, [performHtmlUpdate])

  return (
    <div className="relative">
      {/* Toolbar */}
      <Toolbar onHtmlSourceClick={handleHtmlSourceClick} />
      
      {/* Editor content */}
      <div className="relative">
        {isTransitioning && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-sm text-muted-foreground">Cambiando modo...</div>
          </div>
        )}
        
        {showHtmlSource ? (
          // HTML Source View
          <div className="p-4">
            {isConverting && (
              <div className="mb-2 text-xs text-muted-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Convirtiendo HTML...
              </div>
            )}
            <Textarea
              value={currentHtml}
              onChange={(e) => {
                const newHtml = e.target.value
                setCurrentHtml(newHtml)
                // Only update if the change is significant to reduce processing
                if (Math.abs(newHtml.length - currentHtml.length) > 10 || newHtml.includes('</')) {
                  debouncedHtmlUpdate(newHtml)
                }
              }}
              placeholder="Código HTML..."
              className="min-h-[200px] font-mono text-sm"
              rows={10}
              disabled={isTransitioning || isConverting}
              spellCheck={false}
            />
          </div>
        ) : (
          // Rich Text Editor View
          <div className={isTransitioning ? "pointer-events-none opacity-50" : ""}>
            <RichTextPlugin
              contentEditable={
                <div className="">
                  <div className="" ref={onRef}>
                    <ContentEditable placeholder={placeholder} />
                  </div>
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            
            {/* History plugin for undo/redo */}
            <HistoryPlugin />
            
            {/* Code highlighting is handled by registerCodeHighlighting */}
            
            {/* Table plugin for table support */}
            <TablePlugin hasCellMerge={true} hasCellBackgroundColor={true} />
            
            {/* List plugin for ordered and unordered lists */}
            <ListPlugin />
          </div>
        )}
      </div>
    </div>
  )
}