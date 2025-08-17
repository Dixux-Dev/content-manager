// Simplified converter to test
export function simpleSerializedStateToHtml(serializedState: any): string {
  let html = ''
  
  function processNode(node: any): string {
    if (!node) return ''
    
    switch (node.type) {
      case 'paragraph':
        const pContent = node.children?.map((child: any) => processNode(child)).join('') || ''
        return `<p>${pContent}</p>`
        
      case 'text':
        return node.text || ''
        
      case 'code':
        const codeContent = node.children?.map((child: any) => processNode(child)).join('') || ''
        return `<code>${codeContent}</code>`
        
      case 'table':
        const tableContent = node.children?.map((row: any) => {
          if (row.type === 'tablerow') {
            const rowContent = row.children?.map((cell: any) => {
              if (cell.type === 'tablecell') {
                const cellContent = cell.children?.map((child: any) => processNode(child)).join('') || ''
                const tag = cell.headerState === 3 ? 'th' : 'td'
                return `<${tag}>${cellContent}</${tag}>`
              }
              return ''
            }).join('') || ''
            return `<tr>${rowContent}</tr>`
          }
          return ''
        }).join('') || ''
        return `<table>${tableContent}</table>`
        
      default:
        return ''
    }
  }
  
  if (serializedState.root?.children) {
    html = serializedState.root.children.map((child: any) => processNode(child)).join('')
  }
  
  return html
}