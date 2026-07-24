import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      hover={true}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gray-900/95 group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:backdrop-blur-md",
          description: "group-[.toast]:text-gray-300 group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-blue-500 group-[.toast]:text-white group-[.toast]:hover:bg-blue-600",
          cancelButton:
            "group-[.toast]:bg-gray-700 group-[.toast]:text-white group-[.toast]:hover:bg-gray-600",
          success: "group-[.toaster]:border-green-500/30",
          error: "group-[.toaster]:border-red-500/30",
          info: "group-[.toaster]:border-blue-500/30",
          warning: "group-[.toaster]:border-yellow-500/30",
        },
        style: {
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
