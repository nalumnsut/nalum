import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

// The app has no working dark-mode toggle (next-themes is wired but never
// switched), and every other surface — cards, buttons, the header — is
// always light with maroon accents. Toasts are forced to "light" instead of
// "system" so they don't silently flip to a dark look the rest of the app
// never uses.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-sm group-[.toaster]:rounded-lg",
          title: "group-[.toast]:font-semibold group-[.toast]:text-sm",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-nsut-maroon group-[.toast]:text-white group-[.toast]:rounded-md group-[.toast]:hover:bg-nsut-maroon/90",
          cancelButton:
            "group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground group-[.toast]:rounded-md group-[.toast]:hover:bg-secondary/80",
          success:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-green-600 [&_[data-icon]]:text-green-600",
          error:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-destructive [&_[data-icon]]:text-destructive",
          info:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-nsut-maroon [&_[data-icon]]:text-nsut-maroon",
          warning:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-yellow-500 [&_[data-icon]]:text-yellow-500",
        },
        style: {
          // Montserrat is the brand font declared in tailwind.config (font-sans);
          // the old override fell back to a generic system stack instead.
          fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
