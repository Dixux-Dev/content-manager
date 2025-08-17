import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Props for the Button component
 * @description Extends native button attributes with variant styling options
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as child element instead of button
   * @default false
   * @description When true, renders the component as a Slot for composition
   */
  asChild?: boolean
}

/**
 * Versatile button component with multiple variants and sizes
 * @description A flexible button component based on Radix UI with customizable styling
 * 
 * Available variants:
 * - default: Primary action button
 * - destructive: For dangerous actions (delete, etc.)
 * - outline: Bordered button for secondary actions
 * - secondary: Muted secondary button
 * - ghost: Text-only button with hover effects
 * - link: Link-styled button
 * 
 * Available sizes:
 * - default: Standard size (h-10)
 * - sm: Small size (h-9)
 * - lg: Large size (h-11) 
 * - icon: Square icon button (h-10 w-10)
 * 
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Button>Click me</Button>
 * 
 * // With variants
 * <Button variant="destructive">Delete</Button>
 * <Button variant="outline" size="sm">Cancel</Button>
 * 
 * // As a link component
 * <Button asChild>
 *   <Link href="/about">About</Link>
 * </Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }