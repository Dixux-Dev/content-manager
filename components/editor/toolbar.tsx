"use client"

import { useCallback, useState, useEffect } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from "@lexical/rich-text"
import { $createCodeNode, $isCodeNode } from "@lexical/code"
import { 
  $createTableNode, 
  $createTableRowNode, 
  $createTableCellNode,
  INSERT_TABLE_COMMAND
} from "@lexical/table"
import {
  $createListNode,
  $createListItemNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND
} from "@lexical/list"
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
} from "lexical"
import { $setBlocksType } from "@lexical/selection"
import { mergeRegister } from "@lexical/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Indent,
  Outdent,
  Code,
  FileCode,
  List,
  ListOrdered,
  Table,
} from "lucide-react"

interface ToolbarProps {
  onHtmlSourceClick?: () => void
}

// Format flags for text formatting detection
const IS_BOLD = 1
const IS_ITALIC = 2
const IS_STRIKETHROUGH = 4
const IS_UNDERLINE = 8
const IS_CODE = 16
const IS_SUBSCRIPT = 32
const IS_SUPERSCRIPT = 64

export function Toolbar({ onHtmlSourceClick }: ToolbarProps) {
  const [editor] = useLexicalComposerContext()
  
  // State for tracking active formatting
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
  })
  
  const [blockType, setBlockType] = useState('paragraph')
  const [alignment, setAlignment] = useState('left')
  
  // Update active formats based on current selection
  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      // Get format flags from selection
      const format = selection.format
      
      setActiveFormats({
        bold: (format & IS_BOLD) !== 0,
        italic: (format & IS_ITALIC) !== 0,
        underline: (format & IS_UNDERLINE) !== 0,
        strikethrough: (format & IS_STRIKETHROUGH) !== 0,
        code: (format & IS_CODE) !== 0,
      })
      
      // Get block type from the anchor node
      const anchorNode = selection.anchor.getNode()
      const element = anchorNode.getKey() === 'root' 
        ? anchorNode 
        : anchorNode.getTopLevelElementOrThrow()
      
      const elementType = element.getType()
      
      if (elementType === 'heading') {
        const headingNode = element as any
        setBlockType(headingNode.getTag())
      } else if (elementType === 'quote') {
        setBlockType('quote')
      } else if (elementType === 'code') {
        setBlockType('code')
      } else {
        setBlockType('paragraph')
      }
      
      // Get element format (alignment)
      const elementFormat = element.getFormatType() || 'left'
      setAlignment(elementFormat)
    }
  }, [])
  
  // Register selection change listener
  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar()
        })
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar()
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      )
    )
  }, [editor, updateToolbar])

  const formatText = useCallback((format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  }, [editor])

  const formatHeading = useCallback((headingSize: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize))
      }
    })
  }, [editor])

  const formatParagraph = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode())
      }
    })
  }, [editor])


  const formatCodeBlock = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createCodeNode())
      }
    })
  }, [editor])

  const indentContent = useCallback(() => {
    editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
  }, [editor])

  const outdentContent = useCallback(() => {
    editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
  }, [editor])

  const formatAlignment = useCallback((alignment: 'left' | 'center' | 'right') => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment)
  }, [editor])

  const insertTable = useCallback(() => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, { 
      columns: '3', 
      rows: '3',
      includeHeaders: true
    })
  }, [editor])

  const insertBulletList = useCallback(() => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
  }, [editor])

  const insertNumberedList = useCallback(() => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
  }, [editor])

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
      {/* TEXT FORMATTING GROUP */}
      <div className="flex items-center gap-1 px-1">
        <Button
          type="button"
          variant={activeFormats.bold ? "default" : "ghost"}
          size="sm"
          onClick={() => formatText('bold')}
          className={`h-8 w-8 p-0 ${activeFormats.bold ? 'bg-blue-100 text-blue-900' : ''}`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={activeFormats.italic ? "default" : "ghost"}
          size="sm"
          onClick={() => formatText('italic')}
          className={`h-8 w-8 p-0 ${activeFormats.italic ? 'bg-blue-100 text-blue-900' : ''}`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={activeFormats.underline ? "default" : "ghost"}
          size="sm"
          onClick={() => formatText('underline')}
          className={`h-8 w-8 p-0 ${activeFormats.underline ? 'bg-blue-100 text-blue-900' : ''}`}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={activeFormats.strikethrough ? "default" : "ghost"}
          size="sm"
          onClick={() => formatText('strikethrough')}
          className={`h-8 w-8 p-0 ${activeFormats.strikethrough ? 'bg-blue-100 text-blue-900' : ''}`}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* HEADINGS GROUP */}
      <div className="flex items-center gap-1 px-1">
        <Button
          type="button"
          variant={blockType === 'paragraph' ? "default" : "ghost"}
          size="sm"
          onClick={formatParagraph}
          className={`h-8 px-2 text-xs ${blockType === 'paragraph' ? 'bg-blue-100 text-blue-900' : ''}`}
          title="Paragraph"
        >
          P
        </Button>
        <Button
          type="button"
          variant={blockType === 'h1' ? "default" : "ghost"}
          size="sm"
          onClick={() => formatHeading('h1')}
          className={`h-8 w-8 p-0 ${blockType === 'h1' ? 'bg-blue-100 text-blue-900' : ''}`}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={blockType === 'h2' ? "default" : "ghost"}
          size="sm"
          onClick={() => formatHeading('h2')}
          className={`h-8 w-8 p-0 ${blockType === 'h2' ? 'bg-blue-100 text-blue-900' : ''}`}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={blockType === 'h3' ? "default" : "ghost"}
          size="sm"
          onClick={() => formatHeading('h3')}
          className={`h-8 w-8 p-0 ${blockType === 'h3' ? 'bg-blue-100 text-blue-900' : ''}`}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={blockType === 'code' ? "default" : "ghost"}
          size="sm"
          onClick={formatCodeBlock}
          className={`h-8 w-8 p-0 ${blockType === 'code' ? 'bg-blue-100 text-blue-900' : ''}`}
          title="Code Block"
        >
          <FileCode className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* ALIGNMENT GROUP */}
      <div className="flex items-center gap-1 px-1">
        <Button
          type="button"
          variant={alignment === 'left' ? "default" : "ghost"}
          size="sm"
          onClick={() => formatAlignment('left')}
          className={`h-8 w-8 p-0 ${alignment === 'left' ? 'bg-blue-100 text-blue-900' : ''}`}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={alignment === 'center' ? "default" : "ghost"}
          size="sm"
          onClick={() => formatAlignment('center')}
          className={`h-8 w-8 p-0 ${alignment === 'center' ? 'bg-blue-100 text-blue-900' : ''}`}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={alignment === 'right' ? "default" : "ghost"}
          size="sm"
          onClick={() => formatAlignment('right')}
          className={`h-8 w-8 p-0 ${alignment === 'right' ? 'bg-blue-100 text-blue-900' : ''}`}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* LISTS & CONTENT GROUP */}
      <div className="flex items-center gap-1 px-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertBulletList}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertNumberedList}
          className="h-8 w-8 p-0"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertTable}
          className="h-8 w-8 p-0"
          title="Insert Table"
        >
          <Table className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* INDENTATION GROUP */}
      <div className="flex items-center gap-1 px-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={outdentContent}
          className="h-8 w-8 p-0"
          title="Decrease Indent"
        >
          <Outdent className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={indentContent}
          className="h-8 w-8 p-0"
          title="Increase Indent"
        >
          <Indent className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* TOOLS GROUP */}
      <div className="flex items-center gap-1 px-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onHtmlSourceClick}
          className="h-8 w-8 p-0"
          title="HTML Source View"
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}