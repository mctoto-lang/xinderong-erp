"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

function FieldGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  )
}

function Field({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="field-label"
      className={cn(
        "text-sm leading-none font-medium select-none",
        className
      )}
      {...props}
    />
  )
}

function FieldDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function FieldSeparator({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <div data-slot="field-separator" className="relative my-2">
      <SeparatorPrimitive.Root
        data-slot="field-separator-content"
        decorative
        orientation="horizontal"
        className={cn(
          "shrink-0 h-px w-full",
          className
        )}
        {...props}
      />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
        {children}
      </span>
    </div>
  )
}

export { FieldGroup, Field, FieldLabel, FieldDescription, FieldSeparator }
