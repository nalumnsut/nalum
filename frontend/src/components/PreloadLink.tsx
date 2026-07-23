import { useCallback } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { normalizePath, preloadPath, preloadRoute } from "@/lib/preloadRoutes";

/**
 * Works like react-router-dom's <Link> but preloads route chunks on hover,
 * focus, or touch — before the user clicks.
 */
interface PreloadLinkProps extends LinkProps {
  /** Optional explicit import function (bypasses routeImportMap lookup) */
  importFn?: () => Promise<unknown>;
}

function resolveLinkPath(to: LinkProps["to"]): string {
  if (typeof to === "string") return normalizePath(to);
  if (typeof to === "object" && to !== null) {
    return normalizePath(to.pathname ?? "/");
  }
  return "/";
}

export function PreloadLink({
  to,
  importFn,
  onMouseEnter,
  onFocus,
  onTouchStart,
  onPointerEnter,
  children,
  ...rest
}: PreloadLinkProps) {
  const triggerPreload = useCallback(() => {
    if (importFn) {
      preloadRoute(importFn);
    } else {
      preloadPath(resolveLinkPath(to));
    }
  }, [importFn, to]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    triggerPreload();
    onMouseEnter?.(e);
  };

  const handlePointerEnter = (e: React.PointerEvent<HTMLAnchorElement>) => {
    triggerPreload();
    onPointerEnter?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLAnchorElement>) => {
    triggerPreload();
    onFocus?.(e);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLAnchorElement>) => {
    triggerPreload();
    onTouchStart?.(e);
  };

  return (
    <Link
      to={to}
      onMouseEnter={handleMouseEnter}
      onPointerEnter={handlePointerEnter}
      onFocus={handleFocus}
      onTouchStart={handleTouchStart}
      {...rest}
    >
      {children}
    </Link>
  );
}
