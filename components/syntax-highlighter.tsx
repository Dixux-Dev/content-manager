"use client"

import React, { useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

export function SyntaxHighlighterEnhancer() {
  useEffect(() => {
    // Find all code blocks with data-highlighted="true" and apply syntax highlighting
    const codeBlocks = document.querySelectorAll('code[data-highlighted="true"]')
    
    codeBlocks.forEach((codeBlock) => {
      const language = codeBlock.getAttribute('data-language') || 'text'
      const code = codeBlock.textContent || ''
      
      // Skip if already processed
      if (codeBlock.getAttribute('data-processed') === 'true') {
        return
      }
      
      // Create a container for the syntax highlighter
      const container = document.createElement('div')
      container.className = 'syntax-highlighter-container'
      
      // Replace the original code block
      if (codeBlock.parentNode) {
        codeBlock.parentNode.insertBefore(container, codeBlock)
        ;(codeBlock as HTMLElement).style.display = 'none'
        codeBlock.setAttribute('data-processed', 'true')
      }
      
      // Render the syntax highlighter
      import('react-dom/client').then(({ createRoot }) => {
        const root = createRoot(container)
        root.render(
          <SyntaxHighlighter
            style={oneDark}
            language={language}
            showLineNumbers={true}
            wrapLines={true}
            wrapLongLines={true}
            customStyle={{
              margin: '8px 0',
              borderRadius: '6px',
              border: '1px solid #e1e4e8',
              fontSize: '14px',
              lineHeight: '1.45'
            }}
          >
            {code}
          </SyntaxHighlighter>
        )
      })
    })
  }, [])

  // This component doesn't render anything visible
  return null
}

// Hook version for use in components
export function useSyntaxHighlighting() {
  useEffect(() => {
    const enhanceCodeBlocks = () => {
      const codeBlocks = document.querySelectorAll('code[data-highlighted="true"]:not([data-processed="true"])')
      
      codeBlocks.forEach((codeBlock) => {
        const language = codeBlock.getAttribute('data-language') || 'text'
        const code = codeBlock.textContent || ''
        
        // Mark as processed
        codeBlock.setAttribute('data-processed', 'true')
        
        // Create a wrapper to maintain the layout
        const wrapper = document.createElement('div')
        wrapper.className = 'code-block-wrapper'
        wrapper.style.cssText = `
          background-color: #f6f8fa;
          border-radius: 6px;
          border: 1px solid #e1e4e8;
          margin: 8px 0;
          overflow: hidden;
        `
        
        // Insert wrapper before code block
        if (codeBlock.parentNode) {
          codeBlock.parentNode.insertBefore(wrapper, codeBlock)
          
          // Hide original and add to wrapper
          ;(codeBlock as HTMLElement).style.display = 'none'
          wrapper.appendChild(codeBlock)
          
          // Create enhanced code element
          const enhancedCode = document.createElement('div')
          enhancedCode.className = 'enhanced-code-block'
          wrapper.appendChild(enhancedCode)
          
          // Render syntax highlighter
          import('react-dom/client').then(({ createRoot }) => {
            const root = createRoot(enhancedCode)
            root.render(
              <SyntaxHighlighter
                style={oneDark}
                language={language}
                showLineNumbers={true}
                wrapLines={true}
                wrapLongLines={true}
                customStyle={{
                  margin: 0,
                  borderRadius: 0,
                  border: 'none',
                  fontSize: '14px',
                  lineHeight: '1.45',
                  background: 'transparent'
                }}
              >
                {code}
              </SyntaxHighlighter>
            )
          })
        }
      })
    }

    // Run immediately
    enhanceCodeBlocks()

    // Run again after a short delay to catch dynamically inserted content
    const timeoutId = setTimeout(enhanceCodeBlocks, 100)

    // Also run when content changes
    const observer = new MutationObserver(() => {
      enhanceCodeBlocks()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [])
}