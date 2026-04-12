"use client"

import {
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const badgeCls =
  "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
const iconCls = "h-[11px] w-[11px]"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:py-2.5 group-[.toaster]:pl-3 group-[.toaster]:pr-4 group-[.toaster]:gap-2.5",
          title: "group-[.toaster]:text-sm group-[.toaster]:font-medium group-[.toaster]:text-gray-900",
          description: "group-[.toaster]:text-sm group-[.toaster]:text-gray-600",
          actionButton:
            "group-[.toaster]:bg-black group-[.toaster]:text-white group-[.toaster]:hover:bg-gray-800 group-[.toaster]:rounded-md group-[.toaster]:text-xs group-[.toaster]:px-3 group-[.toaster]:py-1.5",
          cancelButton:
            "group-[.toaster]:bg-gray-100 group-[.toaster]:text-gray-700 group-[.toaster]:hover:bg-gray-200 group-[.toaster]:rounded-md group-[.toaster]:text-xs group-[.toaster]:px-3 group-[.toaster]:py-1.5",
          success:
            "!bg-white !text-gray-900 !border-gray-200",
          error:
            "!bg-white !text-gray-900 !border-gray-200",
          warning:
            "!bg-white !text-gray-900 !border-gray-200",
          info:
            "!bg-white !text-gray-900 !border-gray-200",
        },
      }}
      icons={{
        success: (
          <span className={`${badgeCls} bg-emerald-100`}>
            <CheckCircle2 className={`${iconCls} text-emerald-600`} />
          </span>
        ),
        info: (
          <span className={`${badgeCls} bg-blue-100`}>
            <Info className={`${iconCls} text-blue-600`} />
          </span>
        ),
        warning: (
          <span className={`${badgeCls} bg-amber-100`}>
            <AlertTriangle className={`${iconCls} text-amber-600`} />
          </span>
        ),
        error: (
          <span className={`${badgeCls} bg-red-100`}>
            <XCircle className={`${iconCls} text-red-600`} />
          </span>
        ),
        loading: (
          <span className={`${badgeCls} bg-gray-100`}>
            <Loader2 className={`${iconCls} text-gray-500 animate-spin`} />
          </span>
        ),
      }}
      style={
        {
          "--normal-bg": "white",
          "--normal-text": "#111827",
          "--normal-border": "#e5e7eb",
          "--border-radius": "8px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
