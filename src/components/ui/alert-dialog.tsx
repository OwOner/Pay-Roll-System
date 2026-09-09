"use client"

/**
 * AlertDialog built on top of the project's Dialog primitives.
 * Provides a standard AlertDialog API (AlertDialog, AlertDialogTrigger,
 * AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
 * AlertDialogDescription, AlertDialogFooter, AlertDialogAction,
 * AlertDialogCancel) that mirrors the Radix-style API expected by components
 * that import from '@/components/ui/alert-dialog'.
 */

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const AlertDialog = Dialog

function AlertDialogTrigger({ ...props }: React.ComponentProps<"button">) {
  return <button {...props} />
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn("sm:max-w-[425px]", className)}
      {...props}
    />
  )
}

const AlertDialogHeader = DialogHeader
const AlertDialogTitle = DialogTitle
const AlertDialogDescription = DialogDescription

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  onClick,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...(props as any)}
    >
      {children}
    </Button>
  )
}

function AlertDialogCancel({
  className,
  onClick,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...(props as any)}
    >
      {children}
    </Button>
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
}
