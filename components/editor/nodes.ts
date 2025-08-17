import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { CodeNode, CodeHighlightNode } from "@lexical/code"
// REMOVED: Table nodes
import { ListNode, ListItemNode } from "@lexical/list"
import { ImageNode } from "./nodes/ImageNode"
import {
  Klass,
  LexicalNode,
  LexicalNodeReplacement,
  ParagraphNode,
  TextNode,
} from "lexical"

export const nodes: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement> =
  [HeadingNode, ParagraphNode, TextNode, QuoteNode, CodeNode, CodeHighlightNode, ListNode, ListItemNode, ImageNode]