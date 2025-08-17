import { EditorState, SerializedEditorState, $getRoot } from 'lexical'
import { $generateHtmlFromNodes } from '@lexical/html'
import { detectLanguage } from '@/components/ui/code-block'

// Convierte el estado del editor a texto plano
export function editorStateToText(editorState: EditorState): string {
  return editorState.read(() => {
    const root = $getRoot()
    return root.getTextContent()
  })
}

// Convierte el estado serializado a texto plano
export function serializedStateToText(serializedState: SerializedEditorState): string {
  try {
    const content = serializedState.root.children
      .map((child: any) => {
        if (child.type === 'code') {
          // For code blocks, preserve them as code blocks in text
          const codeContent = child.children
            .map((textNode: any) => textNode.text || '')
            .join('')
          return `\`\`\`\n${codeContent}\n\`\`\``
        } else if (child.type === 'table') {
          // For tables, extract text from all cells
          let tableText = ''
          child.children.forEach((row: any) => {
            if (row.type === 'tablerow') {
              const rowText = row.children
                .map((cell: any) => {
                  if (cell.type === 'tablecell') {
                    return cell.children
                      .map((child: any) => {
                        if (child.type === 'paragraph') {
                          return child.children
                            .map((textNode: any) => textNode.text || '')
                            .join('')
                        } else {
                          return child.text || ''
                        }
                      })
                      .join('')
                  }
                  return ''
                })
                .join(' | ')
              tableText += rowText + '\n'
            }
          })
          return tableText.trim()
        } else if (child.children) {
          return child.children
            .map((textNode: any) => textNode.text || '')
            .join('')
        }
        return child.text || ''
      })
      .join('\n')
    return content
  } catch (error) {
    console.error('Error converting serialized state to text:', error)
    return ''
  }
}

// Helper function to parse inline elements and extract formatting
function parseInlineElements(element: HTMLElement): any[] {
  const nodes: any[] = []
  
  const processNode = (node: Node, format: number = 0) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      // FIX: Don't skip whitespace-only text nodes - they are important for table cells
      if (text.length > 0) {
        nodes.push({
          detail: 0,
          format: format,
          mode: "normal",
          style: "",
          text: text,
          type: "text",
          version: 1
        })
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      const tagName = el.tagName.toLowerCase()
      
      let newFormat = format
      if (tagName === 'strong' || tagName === 'b') newFormat = newFormat | 1 // bold
      if (tagName === 'em' || tagName === 'i') newFormat = newFormat | 2 // italic
      if (tagName === 'u') newFormat = newFormat | 8 // underline
      if (tagName === 's' || tagName === 'strike') newFormat = newFormat | 4 // strikethrough
      
      // Handle <br> tags as newlines in text content
      if (tagName === 'br') {
        nodes.push({
          detail: 0,
          format: format,
          mode: "normal",
          style: "",
          text: "\n",
          type: "text",
          version: 1
        })
      } else if (tagName === 'code') {
        // For inline code elements, preserve their text content as-is
        const text = el.textContent || ''
        nodes.push({
          detail: 0,
          format: format,
          mode: "normal",
          style: "",
          text: text,
          type: "text",
          version: 1
        })
      } else {
        el.childNodes.forEach(child => processNode(child, newFormat))
      }
    }
  }
  
  element.childNodes.forEach(child => processNode(child))
  
  // FIX: Always ensure we have at least one text node, even if empty
  if (nodes.length === 0) {
    nodes.push({
      detail: 0,
      format: 0,
      mode: "normal",
      style: "",
      text: "",
      type: "text",
      version: 1
    })
  }
  
  return nodes
}

// Convierte HTML a un estado serializado de Lexical
export function htmlToSerializedState(html: string): SerializedEditorState {
  if (!html || html.trim() === '') {
    return {
      root: {
        children: [{
          children: [],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1
        }],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1
      }
    } as any
  }
  
  // Clean HTML by removing inline styles to force use of CSS classes
  const cleanedHtml = html.replace(/style="[^"]*"/gi, '')

  // Parse HTML and create Lexical nodes
  const parser = new DOMParser()
  const doc = parser.parseFromString(cleanedHtml, 'text/html')
  const elements = Array.from(doc.body.childNodes)
  
  const children: any[] = []
  
  elements.forEach((element) => {
    if (element.nodeType === Node.TEXT_NODE) {
      const text = element.textContent?.trim()
      if (text) {
        children.push({
          children: [{
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: text,
            type: "text",
            version: 1
          }],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1
        })
      }
    } else if (element.nodeType === Node.ELEMENT_NODE) {
      const el = element as HTMLElement
      const tagName = el.tagName.toLowerCase()
      
      if (tagName === 'p') {
        const textNodes = parseInlineElements(el)
        if (textNodes.length > 0) {
          children.push({
            children: textNodes,
            direction: "ltr",
            format: "",
            indent: 0,
            type: "paragraph",
            version: 1
          })
        }
      } else if (tagName.match(/^h[1-6]$/)) {
        const textNodes = parseInlineElements(el)
        if (textNodes.length > 0) {
          children.push({
            children: textNodes,
            direction: "ltr",
            format: "",
            indent: 0,
            tag: tagName,
            type: "heading",
            version: 1
          })
        }
      } else if (tagName === 'blockquote') {
        const textNodes = parseInlineElements(el)
        if (textNodes.length > 0) {
          children.push({
            children: textNodes,
            direction: "ltr",
            format: "",
            indent: 0,
            type: "quote",
            version: 1
          })
        }
      } else if (tagName === 'code') {
        // Special handling for Lexical code blocks with span structure
        const spans = el.querySelectorAll('span[data-lexical-text="true"]')
        
        if (spans.length > 0) {
          // Lexical structure: multiple spans + br tags
          const textParts: string[] = []
          
          // Process each child node to preserve line breaks
          Array.from(el.childNodes).forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement
              if (element.tagName.toLowerCase() === 'span' && element.getAttribute('data-lexical-text') === 'true') {
                // Extract text from span and decode HTML entities
                let spanText = element.textContent || ''
                spanText = decodeHtmlEntities(spanText)
                textParts.push(spanText)
              } else if (element.tagName.toLowerCase() === 'br') {
                // Add newline for br tags
                textParts.push('\n')
              }
            } else if (node.nodeType === Node.TEXT_NODE) {
              // Handle text nodes (though they shouldn't exist in Lexical structure)
              const text = node.textContent || ''
              if (text.trim()) {
                textParts.push(text)
              }
            }
          })
          
          const finalText = textParts.join('')
          
          // Extract language information from data-language attribute
          const language = el.getAttribute('data-language') || detectLanguage(finalText)
          
          children.push({
            children: [{
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: finalText,
              type: "text",
              version: 1
            }],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "code",
            language: language, // Store language for future use
            version: 1
          })
        } else {
          // Fallback for non-Lexical code blocks
          // Try textContent first to preserve natural newlines from white-space: pre-line
          let text = el.textContent || ''
          
          if (!text || text.length === 0) {
            // If textContent is empty, try innerHTML and process it
            text = el.innerHTML || ''
            
            if (text) {
              // Handle <br> tags and normalize line endings
              text = text
                .replace(/<br\s*\/?>/gi, '\n') // Convert <br> tags to newlines
                .replace(/\r\n/g, '\n') // Normalize line endings
                .replace(/\r/g, '\n')
              
              // Then decode HTML entities
              text = decodeHtmlEntities(text)
            }
          }
          
          // Extract language information from data-language attribute
          const language = el.getAttribute('data-language') || detectLanguage(text)
          
          children.push({
            children: [{
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: text,
              type: "text",
              version: 1
            }],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "code",
            language: language, // Store language for future use
            version: 1
          })
        }
      } else if (tagName === 'table') {
        // Handle table parsing
        const rows = Array.from(el.querySelectorAll('tr'))
        if (rows.length > 0) {
          const tableChildren: any[] = []
          
          rows.forEach((row, rowIndex) => {
            const cells = Array.from(row.querySelectorAll('td, th'))
            const rowChildren: any[] = []
            
            cells.forEach((cell, cellIndex) => {
              const cellTextNodes = parseInlineElements(cell as HTMLElement)
              
              // Create a paragraph inside the cell
              // FIX: Ensure we always have text content, use cell.textContent as fallback
              let finalTextNodes = cellTextNodes
              if (cellTextNodes.length === 0 || (cellTextNodes.length === 1 && !cellTextNodes[0].text)) {
                const fallbackText = cell.textContent || ""
                finalTextNodes = [{
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                  text: fallbackText,
                  type: "text",
                  version: 1
                }]
              }
              
              const cellParagraph = {
                children: finalTextNodes,
                direction: "ltr",
                format: "",
                indent: 0,
                type: "paragraph",
                version: 1
              }
              
              rowChildren.push({
                children: [cellParagraph],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "tablecell",
                headerState: cell.tagName.toLowerCase() === 'th' ? 3 : 0, // 3 for header, 0 for normal
                version: 1
              })
            })
            
            if (rowChildren.length > 0) {
              tableChildren.push({
                children: rowChildren,
                direction: "ltr",
                format: "",
                indent: 0,
                type: "tablerow",
                version: 1
              })
            }
          })
          
          if (tableChildren.length > 0) {
            children.push({
              children: tableChildren,
              direction: "ltr",
              format: "",
              indent: 0,
              type: "table",
              version: 1
            })
          }
        }
      } else if (tagName === 'ul' || tagName === 'ol') {
        // Handle list parsing with nested list support
        const processListItem = (item: HTMLElement): any => {
          const itemTextNodes: any[] = []
          const nestedLists: any[] = []
          
          // Process child nodes to separate text content from nested lists
          Array.from(item.childNodes).forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
              const text = child.textContent?.trim()
              if (text) {
                itemTextNodes.push({
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                  text: text,
                  type: "text",
                  version: 1
                })
              }
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              const childEl = child as HTMLElement
              const childTag = childEl.tagName.toLowerCase()
              
              if (childTag === 'ul' || childTag === 'ol') {
                // Found nested list - process it recursively
                const nestedItems = Array.from(childEl.querySelectorAll(':scope > li'))
                const nestedListChildren: any[] = []
                
                nestedItems.forEach((nestedItem) => {
                  const nestedTextNodes = parseInlineElements(nestedItem as HTMLElement)
                  
                  // Create paragraph for nested item
                  const nestedParagraph = {
                    children: nestedTextNodes.length > 0 ? nestedTextNodes : [{
                      detail: 0,
                      format: 0,
                      mode: "normal", 
                      style: "",
                      text: "",
                      type: "text",
                      version: 1
                    }],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    type: "paragraph",
                    version: 1
                  }
                  
                  nestedListChildren.push({
                    children: [nestedParagraph],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    type: "listitem",
                    version: 1
                  })
                })
                
                if (nestedListChildren.length > 0) {
                  nestedLists.push({
                    children: nestedListChildren,
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    listType: childTag === 'ol' ? 'number' : 'bullet',
                    start: childTag === 'ol' ? 1 : null,
                    tag: childTag,
                    type: "list",
                    version: 1
                  })
                }
              } else {
                // Process other inline elements
                const inlineNodes = parseInlineElements(childEl)
                itemTextNodes.push(...inlineNodes)
              }
            }
          })
          
          // Create the main paragraph for this list item
          const itemParagraph = {
            children: itemTextNodes.length > 0 ? itemTextNodes : [{
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: "",
              type: "text",
              version: 1
            }],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "paragraph",
            version: 1
          }
          
          // Combine paragraph and nested lists
          const itemChildren = [itemParagraph, ...nestedLists]
          
          return {
            children: itemChildren,
            direction: "ltr",
            format: "",
            indent: 0,
            type: "listitem",
            version: 1
          }
        }
        
        // Process only direct li children (not nested ones)
        const directListItems = Array.from(el.querySelectorAll(':scope > li'))
        if (directListItems.length > 0) {
          const listChildren: any[] = []
          
          directListItems.forEach((item) => {
            const listItem = processListItem(item as HTMLElement)
            listChildren.push(listItem)
          })
          
          if (listChildren.length > 0) {
            children.push({
              children: listChildren,
              direction: "ltr",
              format: "",
              indent: 0,
              listType: tagName === 'ol' ? 'number' : 'bullet',
              start: tagName === 'ol' ? 1 : null,
              tag: tagName,
              type: "list",
              version: 1
            })
          }
        }
      } else if (tagName === 'img') {
        // Handle images with proper ImageNode
        const src = el.getAttribute('src') || ''
        const alt = el.getAttribute('alt') || ''
        const width = el.getAttribute('width')
        const height = el.getAttribute('height')
        
        // Create proper image node
        children.push({
          type: 'image',
          version: 1,
          src: src,
          altText: alt,
          width: width ? parseInt(width) : 0,
          height: height ? parseInt(height) : 0,
          maxWidth: 800,
          showCaption: false
        })
      } else if (tagName === 'br') {
        // Handle line breaks by creating empty paragraph
        children.push({
          children: [],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1
        })
      } else {
        // Default to paragraph for other elements, but preserve HTML if it contains tags
        if (el.children.length > 0) {
          // Element has child elements - preserve as HTML
          const htmlContent = el.outerHTML || el.innerHTML || ''
          if (htmlContent.trim()) {
            children.push({
              children: [{
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: htmlContent,
                type: "text",
                version: 1
              }],
              direction: "ltr",
              format: "",
              indent: 0,
              type: "paragraph",
              version: 1
            })
          }
        } else {
          // Element only has text content
          const text = el.textContent || ''
          if (text.trim()) {
            children.push({
              children: [{
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: text,
                type: "text",
                version: 1
              }],
              direction: "ltr",
              format: "",
              indent: 0,
              type: "paragraph",
              version: 1
            })
          }
        }
      }
    }
  })
  
  // If no children, add an empty paragraph
  if (children.length === 0) {
    children.push({
      children: [],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "paragraph",
      version: 1
    })
  }
  
  return {
    root: {
      children: children,
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1
    }
  } as any
}

// Helper function to convert text node with formatting to HTML with inline styles
function textNodeToHtml(node: any): string {
  let text = node.text || ''
  const format = node.format || 0
  
  // Check if text contains HTML elements that should be preserved
  // This allows users to insert raw HTML like <img> tags
  const hasHtmlTags = /<[^>]+>/.test(text)
  
  if (hasHtmlTags) {
    // If text contains HTML tags, return it as-is to preserve the HTML
    // This allows things like <img src="..."> to work
    return text
  }
  
  // Apply formatting based on format bitmask with inline styles
  if (format & 1) text = `<strong style="font-weight: bold;">${text}</strong>` // bold
  if (format & 2) text = `<em style="font-style: italic;">${text}</em>` // italic
  if (format & 4) text = `<s style="text-decoration: line-through;">${text}</s>` // strikethrough
  if (format & 8) text = `<u style="text-decoration: underline;">${text}</u>` // underline
  
  return text
}

// Convierte el estado del editor a HTML con estilos inline
export function serializedStateToHtml(serializedState: SerializedEditorState): string {
  try {
    let html = ''
    serializedState.root.children.forEach((child: any) => {
      if (child.type === 'paragraph') {
        const content = child.children.map((c: any) => textNodeToHtml(c)).join('')
        const alignment = child.format || ''
        let alignmentStyle = ''
        if (alignment === 'center') alignmentStyle = ' text-align: center;'
        else if (alignment === 'right') alignmentStyle = ' text-align: right;'
        else if (alignment === 'left') alignmentStyle = ' text-align: left;'
        
        // Check if the content is pure HTML elements (like img, div, etc.)
        // If so, don't wrap it in a paragraph
        const isPureHtml = /^<(?:img|div|section|article|aside|header|footer|nav|iframe|video|audio|canvas|svg|table|form|input|button|select|textarea|hr|br)[^>]*>/.test(content.trim())
        
        if (isPureHtml) {
          // Content is already a complete HTML element, don't wrap it
          html += content + '\n'
        } else {
          // Normal text or inline elements, wrap in paragraph
          html += `<p style="line-height: 1.75; margin: 0 0 1rem 0;${alignmentStyle}">${content}</p>\n`
        }
      } else if (child.type === 'heading') {
        const content = child.children.map((c: any) => textNodeToHtml(c)).join('')
        const tag = child.tag || 'h1'
        const alignment = child.format || ''
        let alignmentStyle = ''
        if (alignment === 'center') alignmentStyle = ' text-align: center;'
        else if (alignment === 'right') alignmentStyle = ' text-align: right;'
        else if (alignment === 'left') alignmentStyle = ' text-align: left;'
        
        // Define inline styles for different heading levels
        let headingStyles = ''
        switch (tag) {
          case 'h1':
            headingStyles = 'font-size: 2.25rem; font-weight: 800; line-height: 1.2; margin: 0 0 1.5rem 0; letter-spacing: -0.025em;'
            break
          case 'h2':
            headingStyles = 'font-size: 1.875rem; font-weight: 600; line-height: 1.3; margin: 0 0 1.25rem 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem;'
            break
          case 'h3':
            headingStyles = 'font-size: 1.5rem; font-weight: 600; line-height: 1.4; margin: 0 0 1rem 0;'
            break
          case 'h4':
            headingStyles = 'font-size: 1.25rem; font-weight: 600; line-height: 1.5; margin: 0 0 0.875rem 0;'
            break
          case 'h5':
            headingStyles = 'font-size: 1.125rem; font-weight: 600; line-height: 1.5; margin: 0 0 0.75rem 0;'
            break
          case 'h6':
            headingStyles = 'font-size: 1rem; font-weight: 600; line-height: 1.5; margin: 0 0 0.75rem 0;'
            break
        }
        
        html += `<${tag} style="${headingStyles}${alignmentStyle}">${content}</${tag}>\n`
      } else if (child.type === 'quote') {
        const content = child.children.map((c: any) => textNodeToHtml(c)).join('')
        const alignment = child.format || ''
        let alignmentStyle = ''
        if (alignment === 'center') alignmentStyle = ' text-align: center;'
        else if (alignment === 'right') alignmentStyle = ' text-align: right;'
        else if (alignment === 'left') alignmentStyle = ' text-align: left;'
        
        html += `<blockquote style="margin: 1.5rem 0; border-left: 4px solid #d1d5db; padding-left: 1.5rem; font-style: italic; color: #6b7280;${alignmentStyle}">${content}</blockquote>\n`
      } else if (child.type === 'code') {
        const content = child.children.map((c: any) => c.text || '').join('')
        
        // Use stored language or detect from content
        const detectedLanguage = child.language || detectLanguage(content)
        
        // Convert newlines to <br> tags for proper HTML rendering and reconversion
        const htmlContent = content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/\n/g, '<br>')
        
        // Enhanced inline styles with syntax highlighting support
        const codeStyles = `
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
          white-space: normal;
          word-wrap: break-word;
          color: #24292e;
        `.replace(/\s+/g, ' ').trim()
        
        // Add data attributes for client-side syntax highlighting
        html += `<code data-language="${detectedLanguage}" data-highlighted="true" style="${codeStyles}">${htmlContent}</code>\n`
      } else if (child.type === 'table') {
        // Handle table rendering
        const tableStyles = `
          border-collapse: collapse;
          border-spacing: 0;
          width: 100%;
          margin: 1rem 0;
          border: 1px solid #e1e4e8;
          border-radius: 6px;
          overflow: hidden;
        `.replace(/\s+/g, ' ').trim()
        
        let tableHtml = `<table style="${tableStyles}">`
        
        child.children.forEach((row: any) => {
          if (row.type === 'tablerow') {
            tableHtml += '<tr>'
            row.children.forEach((cell: any) => {
              if (cell.type === 'tablecell') {
                // Handle paragraphs inside cells
                const cellContent = cell.children.map((child: any) => {
                  if (child.type === 'paragraph') {
                    return child.children.map((c: any) => textNodeToHtml(c)).join('')
                  } else {
                    return textNodeToHtml(child)
                  }
                }).join('')
                
                const isHeader = cell.headerState === 3
                const cellTag = isHeader ? 'th' : 'td'
                
                const cellStyles = `
                  padding: 8px 12px;
                  border: 1px solid #e1e4e8;
                  text-align: left;
                  vertical-align: top;
                  ${isHeader ? 'background-color: #f6f8fa; font-weight: 600;' : 'background-color: white;'}
                `.replace(/\s+/g, ' ').trim()
                
                tableHtml += `<${cellTag} style="${cellStyles}">${cellContent || ''}</${cellTag}>`
              }
            })
            tableHtml += '</tr>'
          }
        })
        
        tableHtml += '</table>'
        html += tableHtml + '\n'
      } else if (child.type === 'list') {
        // Handle list rendering
        const listTag = child.listType === 'number' ? 'ol' : 'ul'
        const listStyles = `
          margin: 1rem 0;
          padding-left: 2rem;
          ${child.listType === 'number' ? 'list-style-type: decimal;' : 'list-style-type: disc;'}
        `.replace(/\s+/g, ' ').trim()
        
        html += `<${listTag} style="${listStyles}">`
        
        child.children.forEach((item: any) => {
          if (item.type === 'listitem') {
            const itemStyles = `
              margin: 0.25rem 0;
              line-height: 1.6;
              padding-left: 0.5rem;
            `.replace(/\s+/g, ' ').trim()
            
            html += `<li style="${itemStyles}">`
            
            // Handle nested content in list items (including nested lists)
            item.children.forEach((itemChild: any) => {
              if (itemChild.type === 'paragraph') {
                const content = itemChild.children.map((c: any) => textNodeToHtml(c)).join('')
                html += content
              } else if (itemChild.type === 'list') {
                // Handle nested list
                const nestedListTag = itemChild.listType === 'number' ? 'ol' : 'ul'
                const nestedListStyles = `
                  margin: 0.5rem 0;
                  padding-left: 1.5rem;
                  ${itemChild.listType === 'number' ? 'list-style-type: lower-alpha;' : 'list-style-type: circle;'}
                `.replace(/\s+/g, ' ').trim()
                
                html += `<${nestedListTag} style="${nestedListStyles}">`
                
                itemChild.children.forEach((nestedItem: any) => {
                  if (nestedItem.type === 'listitem') {
                    html += '<li>'
                    nestedItem.children.forEach((nestedItemChild: any) => {
                      if (nestedItemChild.type === 'paragraph') {
                        const nestedContent = nestedItemChild.children.map((c: any) => textNodeToHtml(c)).join('')
                        html += nestedContent
                      } else {
                        html += textNodeToHtml(nestedItemChild)
                      }
                    })
                    html += '</li>'
                  }
                })
                
                html += `</${nestedListTag}>`
              } else {
                html += textNodeToHtml(itemChild)
              }
            })
            
            html += '</li>'
          }
        })
        
        html += `</${listTag}>\n`
      } else if (child.type === 'image') {
        // Handle image nodes
        const src = child.src || ''
        const alt = child.altText || ''
        const width = child.width
        const height = child.height
        
        let imgHtml = `<img src="${src}" alt="${alt}"`
        if (width && width > 0) imgHtml += ` width="${width}"`
        if (height && height > 0) imgHtml += ` height="${height}"`
        imgHtml += ` style="max-width: 100%; height: auto;" />\n`
        
        html += imgHtml
      }
    })
    return html.trim()
  } catch (error) {
    console.error('Error converting to HTML:', error)
    return ''
  }
}

// Helper function to decode HTML entities
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

// Verifica si el contenido del editor está vacío
export function isEditorEmpty(serializedState: SerializedEditorState): boolean {
  try {
    const text = serializedStateToText(serializedState)
    return !text || text.trim().length === 0
  } catch (error) {
    return true
  }
}

// Extract clean HTML from editor state without additional editor markup
export function extractCleanHtml(editorState: EditorState): string {
  return editorState.read(() => {
    const serializedState = editorState.toJSON()
    return serializedStateToCleanHtml(serializedState)
  })
}

// Convert serialized state to clean HTML without editor-specific styling
export function serializedStateToCleanHtml(serializedState: SerializedEditorState): string {
  try {
    let html = ''
    serializedState.root.children.forEach((child: any) => {
      if (child.type === 'paragraph') {
        const content = child.children.map((c: any) => textNodeToCleanHtml(c)).join('')
        
        // Check if the content is pure HTML elements
        const isPureHtml = /^<(?:img|div|section|article|aside|header|footer|nav|iframe|video|audio|canvas|svg|table|form|input|button|select|textarea|hr|br)[^>]*>/.test(content.trim())
        
        if (isPureHtml) {
          // Content is already a complete HTML element, don't wrap it
          html += content + '\n'
        } else if (content || child.children.length === 0) {
          // Only add paragraph tags if there's content or if it's an intentionally empty paragraph
          html += `<p>${content}</p>\n`
        }
      } else if (child.type === 'heading') {
        const content = child.children.map((c: any) => textNodeToCleanHtml(c)).join('')
        const tag = child.tag || 'h1'
        html += `<${tag}>${content}</${tag}>\n`
      } else if (child.type === 'quote') {
        const content = child.children.map((c: any) => textNodeToCleanHtml(c)).join('')
        html += `<blockquote>${content}</blockquote>\n`
      } else if (child.type === 'code') {
        const content = child.children.map((c: any) => c.text || '').join('')
        // Escape HTML entities and preserve line breaks
        const escapedContent = content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/\n/g, '<br>')
        
        html += `<code>${escapedContent}</code>\n`
      } else if (child.type === 'table') {
        html += '<table>\n'
        child.children.forEach((row: any) => {
          if (row.type === 'tablerow') {
            html += '  <tr>\n'
            row.children.forEach((cell: any) => {
              if (cell.type === 'tablecell') {
                const cellContent = cell.children.map((child: any) => {
                  if (child.type === 'paragraph') {
                    return child.children.map((c: any) => textNodeToCleanHtml(c)).join('')
                  } else {
                    return textNodeToCleanHtml(child)
                  }
                }).join('')
                
                const isHeader = cell.headerState === 3
                const cellTag = isHeader ? 'th' : 'td'
                html += `    <${cellTag}>${cellContent || ''}</${cellTag}>\n`
              }
            })
            html += '  </tr>\n'
          }
        })
        html += '</table>\n'
      } else if (child.type === 'list') {
        // Handle list rendering in clean HTML
        const listTag = child.listType === 'number' ? 'ol' : 'ul'
        html += `<${listTag}>\n`
        
        child.children.forEach((item: any) => {
          if (item.type === 'listitem') {
            html += '  <li>'
            
            // Handle nested content in list items
            item.children.forEach((itemChild: any) => {
              if (itemChild.type === 'paragraph') {
                const content = itemChild.children.map((c: any) => textNodeToCleanHtml(c)).join('')
                html += content
              } else {
                html += textNodeToCleanHtml(itemChild)
              }
            })
            
            html += '</li>\n'
          }
        })
        
        html += `</${listTag}>\n`
      } else if (child.type === 'image') {
        // Handle image nodes in clean HTML
        const src = child.src || ''
        const alt = child.altText || ''
        const width = child.width
        const height = child.height
        
        let imgHtml = `<img src="${src}" alt="${alt}"`
        if (width && width > 0) imgHtml += ` width="${width}"`
        if (height && height > 0) imgHtml += ` height="${height}"`
        imgHtml += ` />\n`
        
        html += imgHtml
      }
    })
    return html.trim()
  } catch (error) {
    console.error('Error converting to clean HTML:', error)
    return ''
  }
}

// Helper function to convert text node with formatting to clean HTML
function textNodeToCleanHtml(node: any): string {
  let text = node.text || ''
  const format = node.format || 0
  
  // Check if text contains HTML elements that should be preserved
  const hasHtmlTags = /<[^>]+>/.test(text)
  
  if (hasHtmlTags) {
    // If text contains HTML tags, return it as-is to preserve the HTML
    return text
  }
  
  // Apply formatting based on format bitmask without inline styles
  if (format & 1) text = `<strong>${text}</strong>` // bold
  if (format & 2) text = `<em>${text}</em>` // italic
  if (format & 4) text = `<s>${text}</s>` // strikethrough
  if (format & 8) text = `<u>${text}</u>` // underline
  
  return text
}

// Agregar funciones al window para debugging en browser
if (typeof window !== 'undefined') {
  (window as any).htmlToSerializedState = htmlToSerializedState;
  (window as any).serializedStateToHtml = serializedStateToHtml;
  (window as any).serializedStateToText = serializedStateToText;
  (window as any).extractCleanHtml = extractCleanHtml;
  (window as any).serializedStateToCleanHtml = serializedStateToCleanHtml;
}