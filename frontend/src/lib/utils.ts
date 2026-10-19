import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Without this, twMerge doesn't know the "Academic Prestige" type-scale
// classes (text-body-md, text-headline-xl, ...) conflict with core Tailwind
// sizes (text-base, text-sm, ...) — both stay in the merged className, and
// whichever wins by source order is undefined. That let an Input's built-in
// "text-base md:text-sm" silently coexist with an override, so on some
// viewports the effective font-size dropped below 16px — which makes mobile
// Safari zoom the whole viewport on focus (its input-zoom-prevention rule).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-headline-xl",
        "text-headline-lg",
        "text-headline-lg-mobile",
        "text-headline-md",
        "text-body-lg",
        "text-body-md",
        "text-body-sm",
        "text-label-md",
        "text-label-sm",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getUserIdString = (idOrObj: any): string => {
  if (!idOrObj) return "";
  if (typeof idOrObj === "string") return idOrObj;
  if (typeof idOrObj === "object") {
    if (idOrObj._id) return String(idOrObj._id);
    if (idOrObj.id) return String(idOrObj.id);
    return String(idOrObj);
  }
  return "";
};

export const checkIsOwner = (currentUserId: any, resourceUserId: any): boolean => {
  const currentStr = getUserIdString(currentUserId);
  const resourceStr = getUserIdString(resourceUserId);
  if (!currentStr || !resourceStr) return false;
  return currentStr === resourceStr;
};

/** Pulls the API's message off an axios error, falling back to a caller-supplied one. */
export function apiErrorMessage(error: unknown, fallback: string) {
  const message = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message
  return message || fallback
}