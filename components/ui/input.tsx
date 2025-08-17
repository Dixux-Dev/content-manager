import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Props for the Input component
 * @description Extends native HTML input attributes with consistent styling
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Styled input component with consistent design system integration
 * @description A flexible input component that extends the native HTML input with
 * consistent styling, focus states, and accessibility features
 * 
 * Features:
 * - Consistent styling with design system
 * - Focus ring and hover states
 * - Disabled state styling
 * - File input styling
 * - Placeholder text styling
 * 
 * @component
 * @example
 * ```tsx
 * // Basic text input
 * <Input type="text" placeholder="Enter your name" />
 * 
 * // Email input with validation
 * <Input type="email" required placeholder="your@email.com" />
 * 
 * // Number input
 * <Input type="number" min={0} max={100} />
 * 
 * // File input
 * <Input type="file" accept="image/*" />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }