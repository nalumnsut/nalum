import {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { BASE_URL } from "@/lib/constants";
import api from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MentionUser {
  _id: string;
  name: string;
  role: "alumni" | "student";
  profile_picture: string | null;
}

interface MentionTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Called once on mount with a resolver that replaces @Name → @[Name](userId) */
  onResolverReady?: (resolver: (text: string) => string) => void;
}

// ─── Helper: auto-grow textarea ──────────────────────────────────────────────

function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

// ─── Component ───────────────────────────────────────────────────────────────

const MentionTextarea = forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
  ({ value, onChange, className, onResolverReady, ...rest }, forwardedRef) => {
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
    const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [query, setQuery] = useState("");
    const [mentionStart, setMentionStart] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── fetch suggestions ──
    const fetchSuggestions = useCallback(async (q: string) => {
      if (!q) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }
      try {
        const { data } = await api.get(`/mention?q=${encodeURIComponent(q)}`);
        setSuggestions(data.users || []);
        setShowDropdown((data.users || []).length > 0);
        setActiveIndex(0);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, []);

    // ── detect @mention trigger in onChange ──
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursor = e.target.selectionStart ?? newValue.length;

      // Find the last word before cursor
      const textBeforeCursor = newValue.slice(0, cursor);
      const match = textBeforeCursor.match(/@(\w*)$/);

      if (match) {
        const q = match[1];
        const start = cursor - match[0].length; // position of '@'
        setMentionStart(start);
        setQuery(q);

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
      (user: MentionUser) => {
        const textarea = internalRef.current;
        if (!textarea || mentionStart === null) return;

        const cursor = textarea.selectionStart ?? value.length;
        // Replace the @query segment with just @Name (clean, readable)
        const before = value.slice(0, mentionStart);
        const after = value.slice(cursor);
        const token = `@${user.name}`;
        const newValue = before + token + " " + after;

        // Track name → userId for resolver
        mentionsMapRef.current[user.name] = user._id;

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
        if (!showDropdown) return;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" || e.key === "Tab") {
          if (suggestions[activeIndex]) {
            e.preventDefault();
            insertMention(suggestions[activeIndex]);
          }
        } else if (e.key === "Escape") {
          setShowDropdown(false);
        }
      },
      [showDropdown, suggestions, activeIndex, insertMention]
    );

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

    return (
      <div className="relative w-full">
        <textarea
          ref={internalRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-md p-3 text-sm leading-relaxed overflow-hidden",
            className
          )}
          {...rest}
        />

        {/* Mention suggestions dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 left-0 mt-1 w-72 max-h-56 overflow-y-auto bg-slate-900 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md"
          >
            {suggestions.map((user, i) => (
              <button
                key={user._id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent textarea blur
                  insertMention(user);
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors text-sm",
                  i === activeIndex
                    ? "bg-blue-600/20 text-white"
                    : "text-gray-300 hover:bg-white/5"
                )}
              >
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-white/10 border border-white/10 flex items-center justify-center">
                  {user.profile_picture ? (
                    <img
                      src={`${BASE_URL}/uploads/profile/${user.profile_picture}`}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-gray-300">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name + role */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>

                {/* @hint */}
                <span className="text-xs text-blue-400 flex-shrink-0">@mention</span>
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
