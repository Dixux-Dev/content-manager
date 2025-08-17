"use client"

import React from 'react'
import './themes/editor-theme.css'

interface StyledContentProps {
  children: React.ReactNode
  className?: string
}

/**
 * Wrapper component that ensures editor theme CSS is applied
 * to content, especially for generated content that needs styling
 */
export function StyledContent({ children, className = '' }: StyledContentProps) {
  return (
    <div className={`styled-content ${className}`}>
      {children}
      <style jsx global>{`
        .styled-content h1 {
          font-size: 2.25rem;
          font-weight: 800;
          line-height: 1.2;
          margin: 0 0 1.5rem 0;
          letter-spacing: -0.025em;
          color: #1f2937;
        }
        
        .styled-content h2 {
          font-size: 1.875rem;
          font-weight: 600;
          line-height: 1.3;
          margin: 0 0 1.25rem 0;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.5rem;
          color: #1f2937;
        }
        
        .styled-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 0 0 1rem 0;
          color: #1f2937;
        }
        
        .styled-content h4 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.5;
          margin: 0 0 0.875rem 0;
          color: #1f2937;
        }
        
        .styled-content h5 {
          font-size: 1.125rem;
          font-weight: 600;
          line-height: 1.5;
          margin: 0 0 0.75rem 0;
          color: #1f2937;
        }
        
        .styled-content h6 {
          font-size: 1rem;
          font-weight: 600;
          line-height: 1.5;
          margin: 0 0 0.75rem 0;
          color: #1f2937;
        }
        
        .styled-content p {
          margin: 0 0 1rem 0;
          line-height: 1.75;
          color: #374151;
        }
        
        .styled-content blockquote {
          margin: 1.5rem 0;
          border-left: 4px solid #d1d5db;
          padding-left: 1.5rem;
          font-style: italic;
          color: #6b7280;
        }
        
        .styled-content code[data-language] {
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
        }
        
        .styled-content table {
          border-collapse: collapse;
          border-spacing: 0;
          width: 100%;
          margin: 1rem 0;
          border: 1px solid #e1e4e8;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        
        .styled-content td,
        .styled-content th {
          padding: 8px 12px;
          border: 1px solid #e1e4e8;
          text-align: left;
          vertical-align: top;
          background-color: white;
          min-width: 80px;
        }
        
        .styled-content th {
          background-color: #f6f8fa;
          font-weight: 600;
          color: #24292e;
        }
        
        .styled-content ul,
        .styled-content ol {
          margin: 1rem 0;
          padding-left: 2rem;
        }
        
        .styled-content ul {
          list-style-type: disc;
        }
        
        .styled-content ol {
          list-style-type: decimal;
        }
        
        .styled-content li {
          margin: 0.25rem 0;
          line-height: 1.6;
          padding-left: 0.5rem;
        }
        
        .styled-content strong {
          font-weight: bold;
        }
        
        .styled-content em {
          font-style: italic;
        }
        
        .styled-content u {
          text-decoration: underline;
        }
        
        .styled-content s {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  )
}