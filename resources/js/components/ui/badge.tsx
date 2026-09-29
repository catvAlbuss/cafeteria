import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-gold-pale/60 bg-gold-pale/30 text-gold-deep [a&]:hover:bg-gold-pale/50 dark:bg-gold/15 dark:text-gold-light dark:border-gold/30",
        secondary:
          "border-sand bg-sand text-chocolate [a&]:hover:bg-wheat dark:bg-espresso dark:border-espresso dark:text-cocoa",
        destructive:
          "border-destructive/40 bg-red-500/10 text-destructive [a&]:hover:bg-red-500/15 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-red-500/15 dark:text-red-400 dark:border-red-400/30",
        outline:
          "border-cocoa-soft/40 text-cocoa [a&]:hover:bg-sand/60 [a&]:hover:text-chocolate",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
