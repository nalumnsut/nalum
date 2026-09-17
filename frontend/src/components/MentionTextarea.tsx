import {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
  TextareaHTMLAttributes,
} from "react";
// createPortal removed — dropdown will render inside wrapper to preserve functionality
import { cn } from "@/lib/utils";
import { BASE_URL } from "@/lib/constants";
import api from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MentionUser {
  type: "user";
  _id: string;
  name: string;
  role: "alumni" | "student" | "faculty";
  profile_picture: string | null;
}

interface SpecialMention {
  type: "special";
  name: "All" | "Alumni" | "Student" | "Faculty";
  description: string;
}

type MentionSuggestion = MentionUser | SpecialMention;

const SPECIAL_MENTIONS: SpecialMention[] = [
  { type: "special", name: "All", description: "Email all users" },
  { type: "special", name: "Alumni", description: "Email all alumni" },
  { type: "special", name: "Student", description: "Email all students" },
  { type: "special", name: "Faculty", description: "Email all faculty" },
];

interface MentionTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Called once on mount with a resolver that replaces @Name → @[Name](userId) */
  onResolverReady?: (resolver: (text: string) => string) => void;
  /** Dropdown placement preference (default: "auto") */
  placement?: "auto" | "bottom" | "top";
  enableSpecialMentions?: boolean;
}

// ─── Helper: auto-grow textarea ──────────────────────────────────────────────

function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

// ─── Component ───────────────────────────────────────────────────────────────

const MentionTextarea = forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
  ({ value, onChange, className, onResolverReady, placement = "auto", enableSpecialMentions = false, ...rest }, forwardedRef) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(forwardedRef, () => internalRef.current!);

    // Map of mention name → userId accumulated during this session
    const mentionsMapRef = useRef<Record<string, string>>({});

    // Fire onResolverReady once with a resolver that converts @Name → @[Name](userId)
    useEffect(() => {
      if (!onResolverReady) return;
      onResolverReady((text: string) => {
        let result = text;
        for (const [name, id] of Object.entries(mentionsMapRef.current)) {
          const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          result = result.replace(
            new RegExp("@" + escaped + "(?=[\\s.,!?]|$)", "g"),
            `@[${name}](${id})`
          );
        }
        return result;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Mention dropdown state
    const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [query, setQuery] = useState("");
    const [mentionStart, setMentionStart] = useState<number | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{
      top?: number;
      bottom?: number;
      left: number;
    }>({ left: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const updateDropdownPosition = useCallback((cursor: number) => {
      const textarea = internalRef.current;
      const wrapper = textarea?.parentElement;
      if (!textarea || !wrapper) return;

      const computed = window.getComputedStyle(textarea);
      const mirror = document.createElement("div");
      const textBeforeCursor = textarea.value.slice(0, cursor);

      mirror.style.position = "absolute";
      mirror.style.visibility = "hidden";
      mirror.style.pointerEvents = "none";
      mirror.style.whiteSpace = "pre-wrap";
      mirror.style.wordBreak = "break-word";
      mirror.style.overflowWrap = "break-word";
      mirror.style.boxSizing = computed.boxSizing;
      const textareaRect = textarea.getBoundingClientRect();
      mirror.style.width = `${textareaRect.width}px`;
      // match textarea height/scroll so caret marker aligns when textarea is scrolled
      mirror.style.height = `${textareaRect.height}px`;
      mirror.style.overflow = "auto";
      mirror.style.padding = computed.padding;
      mirror.style.border = computed.border;
      mirror.style.font = computed.font;
      mirror.style.lineHeight = computed.lineHeight;
      mirror.style.letterSpacing = computed.letterSpacing;
      mirror.style.textIndent = computed.textIndent;
      mirror.style.textTransform = computed.textTransform;
      mirror.style.tabSize = computed.tabSize;
      // position the mirror over the textarea so the marker's viewport
      // coordinates match the real caret position
      const textareaRectForMirror = textarea.getBoundingClientRect();
      mirror.style.top = `${textareaRectForMirror.top}px`;
      mirror.style.left = `${textareaRectForMirror.left}px`;

      mirror.textContent = textBeforeCursor;
      const marker = document.createElement("span");
      marker.textContent = "\u200b";
      mirror.appendChild(marker);
      document.body.appendChild(mirror);
      // sync scroll position so the mirror shows same wrapped/visible area
      mirror.scrollTop = textarea.scrollTop;
      mirror.scrollLeft = textarea.scrollLeft;

      const caretRect = marker.getBoundingClientRect();
      const dropdownWidth = dropdownRef.current?.offsetWidth ?? 288;
      const dropdownHeight = 224; // max-h-56 = 14rem = 224px

      document.body.removeChild(mirror);

      // compute position relative to the wrapper so the dropdown (absolute)
      // placed inside it is positioned correctly and not clipped
      const extraOffset = 8; // px below or above the caret
      const wrapperRect = wrapper.getBoundingClientRect();

      // Check available vertical space below the caret in viewport
      const spaceBelow = window.innerHeight - caretRect.bottom;
      const spaceAbove = caretRect.top;

      let shouldPlaceAbove = false;
      if (placement === "top") {
        shouldPlaceAbove = true;
      } else if (placement === "bottom") {
        shouldPlaceAbove = false;
      } else {
        // "auto": only flip upward if cramped near the very bottom of the screen (e.g. bottom chat bar)
        shouldPlaceAbove = spaceBelow < 120 && spaceAbove > 200;
      }

      // center dropdown horizontally under the caret
      const caretCenter = (caretRect.left + caretRect.right) / 2;
      const relativeLeftUnclamped = caretCenter - wrapperRect.left - dropdownWidth / 2;

      const maxLeft = Math.max(wrapperRect.width - dropdownWidth, 0);
      const nextLeft = Math.max(Math.min(relativeLeftUnclamped, maxLeft), 0);

      if (shouldPlaceAbove) {
        setDropdownPosition({
          top: undefined,
          bottom: wrapperRect.bottom - caretRect.top + extraOffset,
          left: nextLeft,
        });
      } else {
        setDropdownPosition({
          top: Math.max(caretRect.bottom - wrapperRect.top + extraOffset, 0),
          bottom: undefined,
          left: nextLeft,
        });
      }
    }, [placement]);

    // ── fetch suggestions ──
    const fetchSuggestions = useCallback(async (q: string) => {
      const cleanQuery = q.trim();
      try {
        const url = cleanQuery
          ? `/mention?q=${encodeURIComponent(cleanQuery)}`
          : `/mention`;
        const { data } = await api.get(url);
        const users = (data.users || []).map((user: MentionUser) => ({
          ...user,
          type: "user" as const,
        }));

        const next = enableSpecialMentions
          ? [...SPECIAL_MENTIONS, ...users]
          : users;
        setSuggestions(next);
        setShowDropdown(next.length > 0);
        setActiveIndex(0);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, [enableSpecialMentions]);

    // ── detect @mention trigger in onChange ──
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursor = e.target.selectionStart ?? newValue.length;

      // Find mention trigger before cursor (support up to 30 chars of multi-word names)
      const textBeforeCursor = newValue.slice(0, cursor);
      const match = textBeforeCursor.match(/@([A-Za-z0-9_.' -]{0,30})$/);

      const isCompletedSpecialMention =
        enableSpecialMentions && /^@(All|Alumni|Student|Faculty)\s/i.test(match?.[0] || "");

      if (match && !isCompletedSpecialMention) {
        const q = match[1];
        const start = cursor - match[0].length; // position of '@'
        setMentionStart(start);
        setQuery(q);
        updateDropdownPosition(cursor);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(q), 200);
      } else {
        setShowDropdown(false);
        setMentionStart(null);
        setQuery("");
      }

      onChange(newValue);
      autoGrow(internalRef.current);
    };

    // ── insert chosen mention ──
    const insertMention = useCallback(
      (suggestion: MentionSuggestion) => {
        const textarea = internalRef.current;
        if (!textarea || mentionStart === null) return;

        const cursor = textarea.selectionStart ?? value.length;
        // Replace the @query segment with just @Name (clean, readable)
        const before = value.slice(0, mentionStart);
        const after = value.slice(cursor);
        const token = `@${suggestion.name}`;
        const newValue = before + token + " " + after;

        // Track name → userId for resolver
        if (suggestion.type !== "special") mentionsMapRef.current[suggestion.name] = suggestion._id;

        onChange(newValue);
        setShowDropdown(false);
        setSuggestions([]);
        setMentionStart(null);
        setQuery("");

        // restore cursor position after state update
        const newCursor = mentionStart + token.length + 1;
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(newCursor, newCursor);
          autoGrow(textarea);
        });
      },
      [value, mentionStart, onChange]
    );

    // ── keyboard navigation ──
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showDropdown && suggestions.length > 0) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
            return;
          }
          if (e.key === "Enter" || e.key === "Tab") {
            if (suggestions[activeIndex]) {
              e.preventDefault();
              e.stopPropagation();
              insertMention(suggestions[activeIndex]);
              return;
            }
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setShowDropdown(false);
            return;
          }
        }

        // Forward to external onKeyDown when dropdown is not consuming the key
        rest.onKeyDown?.(e);
      },
      [showDropdown, suggestions, activeIndex, insertMention, rest]
    );

    // ── scroll active suggestion into view on keyboard navigation ──
    useEffect(() => {
      if (!showDropdown || !dropdownRef.current) return;
      const container = dropdownRef.current;
      const activeButton = container.children[activeIndex] as HTMLElement | undefined;
      if (activeButton && typeof activeButton.scrollIntoView === "function") {
        activeButton.scrollIntoView({ block: "nearest" });
      }
    }, [activeIndex, showDropdown]);

    // ── close dropdown on outside click ──
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target as Node) &&
          internalRef.current &&
          !internalRef.current.contains(e.target as Node)
        ) {
          setShowDropdown(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── auto-grow on mount / value change ──
    useEffect(() => {
      autoGrow(internalRef.current);
    }, [value]);

    const { onKeyDown: _discardedOnKeyDown, ...textareaProps } = rest;

    return (
      <div className="relative w-full">
        <textarea
          ref={internalRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn(
            // Mirrors components/ui/textarea.tsx so a MentionTextarea sits in a
            // form indistinguishably from a plain <Textarea>.
            "w-full min-w-0 resize-none overflow-x-hidden overflow-y-auto rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [overflow-wrap:anywhere]",
            className
          )}
          {...textareaProps}
        />

        {/* Mention suggestions dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            // Positioned inline from the caret mirror, so no `left-0`/`mt-1`
            // here — a Tailwind `left` would fight the computed one.
            style={{
              top: dropdownPosition.top !== undefined ? `${dropdownPosition.top}px` : undefined,
              bottom: dropdownPosition.bottom !== undefined ? `${dropdownPosition.bottom}px` : undefined,
              left: `${dropdownPosition.left}px`,
            }}
            className="absolute z-50 w-full sm:w-72 max-h-56 overflow-y-auto bg-popover text-popover-foreground border border-border rounded-xl shadow-overlay"
          >
            {suggestions.map((suggestion, i) => (
              <button
                key={suggestion.type === "special" ? `special-${suggestion.name}` : suggestion._id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent textarea blur
                  insertMention(suggestion);
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors text-sm",
                  i === activeIndex
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-muted border border-border flex items-center justify-center">
                  {suggestion.type !== "special" && suggestion.profile_picture ? (
                    <img
                      src={`${BASE_URL}/uploads/profile/${suggestion.profile_picture}`}
                      alt={suggestion.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">
                      {suggestion.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name + role */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{suggestion.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{suggestion.type === "special" ? suggestion.description : suggestion.role}</p>
                </div>

                {/* @hint */}
                <span className="text-xs text-primary flex-shrink-0">@mention</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

MentionTextarea.displayName = "MentionTextarea";
export default MentionTextarea;
