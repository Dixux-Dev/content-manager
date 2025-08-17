"use client"

import React, { useEffect } from 'react'

export function SimpleSyntaxHighlighter() {
  useEffect(() => {
    // Simple CSS-based syntax highlighting for code blocks
    const codeBlocks = document.querySelectorAll('code[data-highlighted="true"]')
    
    codeBlocks.forEach((codeBlock) => {
      // Skip if already processed
      if (codeBlock.getAttribute('data-processed') === 'true') {
        return
      }
      
      // Mark as processed
      codeBlock.setAttribute('data-processed', 'true')
      
      // Apply basic styling
      const codeElement = codeBlock as HTMLElement
      codeElement.style.cssText = `
        background-color: #f6f8fa;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Monaco, 'Courier New', monospace;
        display: block;
        padding: 16px;
        line-height: 1.45;
        font-size: 14px;
        margin: 8px 0;
        overflow-x: auto;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        tab-size: 2;
        white-space: pre-wrap;
        color: #24292e;
      `
      
      // Basic syntax highlighting with regex
      const language = codeBlock.getAttribute('data-language') || 'text'
      let content = codeBlock.innerHTML
      
      if (language === 'javascript' || language === 'js' || language === 'typescript' || language === 'ts') {
        // Basic JS/TS highlighting
        content = content
          .replace(/\b(function|const|let|var|if|else|for|while|return|import|export|class|interface|type)\b/g, '<span style="color: #d73a49; font-weight: 600;">$1</span>')
          .replace(/"([^"]*)"/g, '<span style="color: #032f62;">"$1"</span>')
          .replace(/'([^']*)'/g, '<span style="color: #032f62;">\'$1\'</span>')
          .replace(/\/\/.*$/gm, '<span style="color: #6a737d; font-style: italic;">$&</span>')
          .replace(/\/\*[\s\S]*?\*\//g, '<span style="color: #6a737d; font-style: italic;">$&</span>')
      } else if (language === 'html') {
        // Basic HTML highlighting - decode entities first
        content = content
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/<([^>\s]+)([^>]*?)>/g, '<span style="color: #22863a;">&lt;$1<span style="color: #6f42c1;">$2</span>&gt;</span>')
          .replace(/<\/([^>\s]+)>/g, '<span style="color: #22863a;">&lt;/$1&gt;</span>')
      } else if (language === 'css') {
        // Basic CSS highlighting
        content = content
          .replace(/([a-zA-Z-]+)(\s*:\s*)([^;]+)(;?)/g, '<span style="color: #6f42c1;">$1</span>$2<span style="color: #032f62;">$3</span>$4')
          .replace(/\/\*[\s\S]*?\*\//g, '<span style="color: #6a737d; font-style: italic;">$&</span>')
      }
      
      codeBlock.innerHTML = content
    })
  }, [])

  return null
}

// Hook version for use in components
export function useSimpleSyntaxHighlighting() {
  useEffect(() => {
    const enhanceCodeBlocks = () => {
      const codeBlocks = document.querySelectorAll('code[data-highlighted="true"]:not([data-processed="true"])')
      
      codeBlocks.forEach((codeBlock) => {
        // Mark as processed
        codeBlock.setAttribute('data-processed', 'true')
        
        // Apply enhanced styling
        const codeElement = codeBlock as HTMLElement
        codeElement.style.cssText = `
          background-color: #1e1e1e;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Monaco, 'Courier New', monospace;
          display: block;
          padding: 16px;
          line-height: 1.45;
          font-size: 14px;
          margin: 8px 0;
          overflow-x: auto;
          border: 1px solid #333;
          border-radius: 6px;
          tab-size: 2;
          white-space: pre-wrap;
          color: #d4d4d4;
        `
        
        // Basic syntax highlighting - use textContent to avoid HTML parsing issues
        const language = codeBlock.getAttribute('data-language') || 'text'
        let content = codeElement.textContent || ''
        
        // Ensure we're working with plain text content
        content = content
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&#x2F;/g, '/')
        
        if (language === 'javascript' || language === 'js' || language === 'typescript' || language === 'ts') {
          content = content
            .replace(/\b(function|const|let|var|if|else|for|while|return|import|export|class|interface|type|async|await)\b/g, '<span style="color: #569cd6;">$1</span>')
            .replace(/"([^"]*)"/g, '<span style="color: #ce9178;">"$1"</span>')
            .replace(/'([^']*)'/g, '<span style="color: #ce9178;">\'$1\'</span>')
            .replace(/`([^`]*)`/g, '<span style="color: #ce9178;">`$1`</span>')
            .replace(/\/\/.*$/gm, '<span style="color: #6a9955;">$&</span>')
            .replace(/\/\*[\s\S]*?\*\//g, '<span style="color: #6a9955;">$&</span>')
            .replace(/\b(\d+)\b/g, '<span style="color: #b5cea8;">$1</span>')
        }
        
        codeElement.innerHTML = content
      })
    }

    // Run immediately
    enhanceCodeBlocks()

    // Run again after a short delay
    const timeoutId = setTimeout(enhanceCodeBlocks, 100)

    // Observe DOM changes
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