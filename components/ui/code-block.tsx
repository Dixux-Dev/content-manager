"use client"

import React from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  children: string
  language?: string
  className?: string
  showLineNumbers?: boolean
  customStyle?: React.CSSProperties
}

export function CodeBlock({ 
  children, 
  language = 'text',
  className,
  showLineNumbers = true,
  customStyle = {}
}: CodeBlockProps) {
  // Clean the language identifier (remove common prefixes)
  const cleanLanguage = language
    .replace(/^language-/, '')
    .replace(/^lang-/, '')
    .toLowerCase()

  // Map common language aliases to their correct Prism identifiers
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'sh': 'bash',
    'shell': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
    'json': 'json',
    'html': 'markup',
    'xml': 'markup',
    'svg': 'markup',
    'php': 'php',
    'sql': 'sql',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'csharp': 'csharp',
    'go': 'go',
    'rust': 'rust',
    'swift': 'swift',
    'kotlin': 'kotlin',
    'dart': 'dart',
    'r': 'r',
    'ruby': 'ruby',
    'perl': 'perl',
    'lua': 'lua',
    'vim': 'vim',
    'diff': 'diff',
    'git': 'git',
    'docker': 'docker',
    'nginx': 'nginx',
    'apache': 'apache',
    'ini': 'ini',
    'toml': 'toml',
    'makefile': 'makefile',
    'dockerfile': 'docker'
  }

  const mappedLanguage = languageMap[cleanLanguage] || cleanLanguage

  // Custom style that integrates with Tailwind and preserves line breaks
  const customTheme = {
    ...oneDark,
    'code[class*="language-"]': {
      ...oneDark['code[class*="language-"]'],
      background: 'transparent',
      fontSize: '14px',
      lineHeight: '1.45',
      whiteSpace: 'pre-line' as const,
      wordWrap: 'break-word' as const,
      ...customStyle
    },
    'pre[class*="language-"]': {
      ...oneDark['pre[class*="language-"]'],
      background: '#f6f8fa',
      borderRadius: '6px',
      border: '1px solid #e1e4e8',
      margin: '8px 0',
      padding: '16px',
      overflow: 'auto',
      fontSize: '14px',
      lineHeight: '1.45',
      ...customStyle
    }
  }

  return (
    <div className={cn("relative", className)}>
      <SyntaxHighlighter
        style={customTheme}
        language={mappedLanguage}
        showLineNumbers={showLineNumbers}
        wrapLines={true}
        wrapLongLines={true}
        customStyle={{
          margin: 0,
          borderRadius: '6px',
          ...customStyle
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}

// Helper function to detect language from code content
export function detectLanguage(code: string): string {
  const content = code.trim().toLowerCase()
  
  // HTML/XML detection
  if (content.includes('<!doctype') || content.includes('<html') || 
      content.includes('</html>') || content.includes('<div') ||
      content.includes('</div>')) {
    return 'html'
  }
  
  // TypeScript detection (check first for more specific patterns)
  if (content.includes('interface ') || content.includes('type ') ||
      content.includes(': string') || content.includes(': number') ||
      content.includes(': boolean') || content.includes('private ') ||
      content.includes('public ') || content.includes('protected ') ||
      content.includes('implements ') || content.includes('extends ') ||
      content.includes('enum ') || content.includes('namespace ') ||
      content.includes('declare ') || content.includes('readonly ') ||
      content.includes('generic<') || content.includes('Promise<') ||
      content.includes('Array<') || content.includes('Map<') ||
      content.includes('Set<')) {
    return 'typescript'
  }
  
  // JavaScript detection
  if (content.includes('function ') || content.includes('const ') || 
      content.includes('let ') || content.includes('var ') ||
      content.includes('import ') || content.includes('export ') ||
      content.includes('console.log') || content.includes('require(') ||
      content.includes('module.exports') || content.includes('=> ')) {
    return 'javascript'
  }
  
  // CSS detection
  if (content.includes('{') && content.includes('}') && 
      (content.includes(':') && content.includes(';'))) {
    return 'css'
  }
  
  // JSON detection
  if ((content.startsWith('{') && content.endsWith('}')) ||
      (content.startsWith('[') && content.endsWith(']'))) {
    try {
      JSON.parse(code)
      return 'json'
    } catch {
      // Not valid JSON
    }
  }
  
  // Python detection
  if (content.includes('def ') || content.includes('import ') ||
      content.includes('from ') || content.includes('print(') ||
      content.includes('class ') && content.includes(':')) {
    return 'python'
  }
  
  // SQL detection
  if (content.includes('select ') || content.includes('from ') ||
      content.includes('where ') || content.includes('insert ') ||
      content.includes('update ') || content.includes('delete ')) {
    return 'sql'
  }
  
  // PHP detection
  if (content.includes('<?php') || content.includes('$') && 
      content.includes('function ')) {
    return 'php'
  }
  
  // Bash/Shell detection
  if (content.includes('#!/bin/bash') || content.includes('echo ') ||
      content.includes('cd ') || content.includes('ls ') ||
      content.includes('mkdir ') || content.includes('rm ')) {
    return 'bash'
  }
  
  return 'text'
}

// Function to render code with syntax highlighting and return HTML string
export function renderCodeWithHighlighting(code: string, language?: string): string {
  const detectedLanguage = language || detectLanguage(code)
  
  // This is a server-side safe way to generate the highlighted HTML
  // We'll use a more basic approach that can work in SSR
  const escapedCode = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  // For now, return with data attributes that can be picked up by client-side highlighting
  return `<code data-language="${detectedLanguage}" data-highlighted="true" style="
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
    white-space: pre-line;
    word-wrap: break-word;
    color: #24292e;
  ">${escapedCode}</code>`
}