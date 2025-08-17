import React from 'react'
import {
  $applyNodeReplacement,
  createEditor,
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical'

/**
 * Serialized representation of an ImageNode
 * @description JSON structure for persisting image nodes in Lexical editor state
 */
export type SerializedImageNode = Spread<
  {
    /** Alternative text for accessibility and fallback display */
    altText: string
    /** Optional caption text displayed below the image */
    caption?: string
    /** Height in pixels, undefined for auto height */
    height?: number
    /** Maximum width constraint in pixels
     * @default 500
     */
    maxWidth?: number
    /** Whether to display the caption
     * @default false
     */
    showCaption?: boolean
    /** Image source URL or data URI */
    src: string
    /** Width in pixels, undefined for auto width */
    width?: number
    /** Node type identifier for Lexical */
    type: 'image'
    /** Schema version for migration support */
    version: 1
  },
  SerializedLexicalNode
>

function convertImageElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src, width, height } = domNode
    const node = $createImageNode({ altText, height, src, width })
    return { node }
  }
  return null
}

export class ImageNode extends DecoratorNode<React.ReactElement> {
  __src: string
  __altText: string
  __width: 'inherit' | number
  __height: 'inherit' | number
  __maxWidth: number
  __showCaption: boolean
  __caption?: string

  static getType(): string {
    return 'image'
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__width,
      node.__height,
      node.__showCaption,
      node.__caption,
      node.__key,
    )
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, height, width, maxWidth, caption, src, showCaption } =
      serializedNode
    const node = $createImageNode({
      altText,
      height,
      maxWidth,
      showCaption,
      src,
      width,
      caption,
    })
    return node
  }

  constructor(
    src: string,
    altText: string,
    maxWidth?: number,
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    showCaption?: boolean,
    caption?: string,
    key?: NodeKey,
  ) {
    super(key)
    this.__src = src
    this.__altText = altText
    this.__maxWidth = maxWidth || 500
    this.__width = width || 'inherit'
    this.__height = height || 'inherit'
    this.__showCaption = showCaption || false
    this.__caption = caption
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img')
    element.setAttribute('src', this.__src)
    element.setAttribute('alt', this.__altText)
    if (this.__width !== 'inherit') {
      element.setAttribute('width', this.__width.toString())
    }
    if (this.__height !== 'inherit') {
      element.setAttribute('height', this.__height.toString())
    }
    element.style.maxWidth = '100%'
    element.style.height = 'auto'
    return { element }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    }
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      caption: this.__caption,
      height: this.__height === 'inherit' ? 0 : this.__height,
      maxWidth: this.__maxWidth,
      showCaption: this.__showCaption,
      src: this.getSrc(),
      type: 'image',
      version: 1,
      width: this.__width === 'inherit' ? 0 : this.__width,
    }
  }

  setWidthAndHeight(
    width: 'inherit' | number,
    height: 'inherit' | number,
  ): void {
    const writable = this.getWritable()
    writable.__width = width
    writable.__height = height
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span')
    const theme = config.theme
    const className = theme.image
    if (className !== undefined) {
      span.className = className
    }
    return span
  }

  updateDOM(): false {
    return false
  }

  getSrc(): string {
    return this.__src
  }

  getAltText(): string {
    return this.__altText
  }

  decorate(): React.ReactElement {
    // If no valid src, don't render the image
    if (!this.__src || this.__src.trim() === '') {
      return <div className="text-gray-500 italic">Image without valid source</div>
    }

    return (
      <img
        src={this.__src}
        alt={this.__altText}
        style={{
          height: this.__height === 'inherit' ? 'auto' : this.__height,
          maxWidth: '100%',
          width: this.__width === 'inherit' ? '100%' : this.__width,
        }}
      />
    )
  }
}

/**
 * Parameters for creating an ImageNode
 * @description Configuration object for creating new image nodes in the editor
 */
interface CreateImageNodeParams {
  /** Alternative text for accessibility
   * @description Required for accessibility compliance and screen readers
   */
  altText: string
  /** Height in pixels
   * @description Optional - if not provided, height will be calculated automatically
   */
  height?: number
  /** Maximum width constraint in pixels
   * @default 500
   * @description Prevents images from becoming too large in the editor
   */
  maxWidth?: number
  /** Whether to show caption below image
   * @default false
   */
  showCaption?: boolean
  /** Image source URL
   * @description Can be absolute URL, relative path, or data URI
   * @example "https://example.com/image.jpg" | "/uploads/image.png" | "data:image/png;base64,..."
   */
  src: string
  /** Width in pixels
   * @description Optional - if not provided, width will be calculated automatically
   */
  width?: number
  /** Caption text to display
   * @description Only shown if showCaption is true
   */
  caption?: string
  /** Lexical node key for tracking
   * @description Internal Lexical identifier - usually auto-generated
   */
  key?: NodeKey
}

/**
 * Factory function to create a new ImageNode
 * @description Creates and returns a new ImageNode with the specified parameters
 * @param params - Configuration object for the image node
 * @returns A new ImageNode instance ready for insertion into the editor
 */
export function $createImageNode({
  altText,
  height,
  maxWidth = 500,
  showCaption = false,
  src,
  width,
  caption,
  key,
}: CreateImageNodeParams): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(
      src,
      altText,
      maxWidth,
      width,
      height,
      showCaption,
      caption,
      key,
    ),
  )
}

/**
 * Type guard to check if a node is an ImageNode
 * @description Utility function to safely determine if a Lexical node is an ImageNode
 * @param node - The node to check, can be null or undefined
 * @returns True if the node is an ImageNode, false otherwise
 * @example
 * ```typescript
 * if ($isImageNode(selectedNode)) {
 *   // selectedNode is now typed as ImageNode
 *   const src = selectedNode.getSrc()
 * }
 * ```
 */
export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode
}