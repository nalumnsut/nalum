import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search, Loader2, Users, FileText, Calendar, CornerDownLeft, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/UserAvatar";
import { searchUsers, searchPosts, searchEvents } from "@/lib/api";

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FlatResult = { id: string; href: string };
type Category = "all" | "people" | "posts" | "events";

const RESULT_LIMIT = 5;
const EMPTY_RESULTS = { users: [] as any[], posts: [] as any[], events: [] as any[] };
const CATEGORY_OPTIONS: { id: Category; label: string; icon?: LucideIcon }[] = [
  { id: "all", label: "All" },
  { id: "people", label: "People", icon: Users },
  { id: "posts", label: "Posts", icon: FileText },
  { id: "events", label: "Events", icon: Calendar },
];

const GlobalSearchModal = ({ open, onOpenChange }: GlobalSearchModalProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [isSearching, setIsSearching] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentQueryRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
    // Reset once closed so the next open starts from a blank slate, like Spotlight.
    setQuery("");
    setResults(EMPTY_RESULTS);
    setIsSearching(false);
    setHighlighted(0);
    setActiveCategory("all");
    currentQueryRef.current = "";
  }, [open]);

  const runSearch = async (value: string, category: Category) => {
    const wantPeople = category === "all" || category === "people";
    const wantPosts = category === "all" || category === "posts";
    const wantEvents = category === "all" || category === "events";

    setIsSearching(true);
    try {
      const [usersRes, postsRes, eventsRes] = await Promise.all([
        wantPeople ? searchUsers(value).catch(() => ({ data: { profiles: [] } })) : null,
        wantPosts ? searchPosts(value).catch(() => ({ data: { data: [] } })) : null,
        wantEvents ? searchEvents(value).catch(() => []) : null,
      ]);
      if (currentQueryRef.current !== value) return;
      setResults({
        users: usersRes ? usersRes.data.profiles || [] : [],
        posts: postsRes ? postsRes.data.data || [] : [],
        events: eventsRes || [],
      });
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      if (currentQueryRef.current === value) setIsSearching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    currentQueryRef.current = value;
    setHighlighted(0);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length === 0) {
      setResults(EMPTY_RESULTS);
      setIsSearching(false);
      return;
    }

    debounceRef.current = setTimeout(() => runSearch(value, activeCategory), 150);
  };

  // Re-run immediately (no debounce) when the category changes, so switching
  // pills feels instant rather than tied to typing.
  useEffect(() => {
    if (!open || query.trim().length === 0) return;
    runSearch(query, activeCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const people = results.users.slice(0, RESULT_LIMIT);
  const posts = results.posts.slice(0, RESULT_LIMIT);
  const events = results.events.slice(0, RESULT_LIMIT);

  const flatResults: FlatResult[] = useMemo(
    () => [
      ...people.map((r) => ({ id: r._id, href: `/dashboard/alumni/${r.user._id}` })),
      ...posts.map((p) => ({ id: p._id, href: `/dashboard/posts/${p._id}` })),
      ...events.map((e) => ({ id: e._id, href: `/dashboard/events?highlight=${e._id}` })),
    ],
    [people, posts, events]
  );

  const goTo = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % flatResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => (i - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = flatResults[highlighted];
      if (target) goTo(target.href);
    }
  };

  const hasQuery = query.trim().length > 0;
  const hasResults = flatResults.length > 0;

  // Running offset into the flat, keyboard-navigable list — each section
  // below claims a contiguous slice starting where the previous one ended.
  let cursor = 0;
  const peopleStart = cursor;
  cursor += people.length;
  const postsStart = cursor;
  cursor += posts.length;
  const eventsStart = cursor;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-slate-950/15 backdrop-blur-[3px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className={cn(
            "fixed left-1/2 top-[14vh] z-50 flex max-h-[calc(86vh-2rem)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 flex-col",
            "overflow-hidden rounded-2xl border border-white/70",
            "bg-white/70 backdrop-blur-2xl backdrop-saturate-150",
            "shadow-overlay ring-1 ring-black/5",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 duration-150"
          )}
        >
          <DialogPrimitive.Title className="sr-only">Quick search</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search across alumni profiles, posts, and events. Use the arrow keys to navigate and Enter to open.
          </DialogPrimitive.Description>

          {/* Input */}
          <div className="flex shrink-0 items-center gap-3 px-4 h-14">
            <Search className="h-5 w-5 text-slate-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Search alumni, posts, or events…"
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-base text-slate-900 placeholder:text-slate-500"
            />
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
          </div>

          {/* Category picker — single select, "All" by default */}
          <div className="flex shrink-0 items-center gap-1.5 px-4 pb-2.5">
            {CATEGORY_OPTIONS.map(({ id, label, icon: Icon }) => {
              const isActive = activeCategory === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveCategory(id)}
                  aria-current={isActive}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    isActive
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-slate-900/10 text-slate-500 hover:border-slate-900/20 hover:text-slate-700"
                  )}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  {label}
                </button>
              );
            })}
          </div>

          {/* Results — the only region that scrolls; input, category picker,
              and the footer hint below stay pinned in view. */}
          {hasQuery && (
            <div className="min-h-0 flex-1 overflow-y-auto border-t border-black/5">
              {!hasResults && !isSearching && (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  No results for "{query}"
                </p>
              )}

              <ResultSection icon={Users} label="People" count={people.length} hasDivider={false}>
                {people.map((result, i) => (
                  <ResultRow
                    key={result._id}
                    active={highlighted === peopleStart + i}
                    onHover={() => setHighlighted(peopleStart + i)}
                    onSelect={() => goTo(`/dashboard/alumni/${result.user._id}`)}
                  >
                    <UserAvatar src={result.profile_picture} name={result.user.name} className="h-8 w-8 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-slate-900 truncate">{result.user.name}</span>
                      <span className="text-xs text-slate-500 truncate">
                        {result.batch} • {result.branch}
                      </span>
                    </div>
                  </ResultRow>
                ))}
              </ResultSection>

              <ResultSection icon={FileText} label="Posts" count={posts.length} hasDivider={people.length > 0}>
                {posts.map((post: any, i) => (
                  <ResultRow
                    key={post._id}
                    active={highlighted === postsStart + i}
                    onHover={() => setHighlighted(postsStart + i)}
                    onSelect={() => goTo(`/dashboard/posts/${post._id}`)}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900/5">
                      <FileText className="h-4 w-4 text-slate-500" />
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-slate-900 truncate">{post.title}</span>
                      <span className="text-xs text-slate-500 truncate">by {post.userId?.name}</span>
                    </div>
                  </ResultRow>
                ))}
              </ResultSection>

              <ResultSection
                icon={Calendar}
                label="Events"
                count={events.length}
                hasDivider={people.length > 0 || posts.length > 0}
              >
                {events.map((event: any, i) => (
                  <ResultRow
                    key={event._id}
                    active={highlighted === eventsStart + i}
                    onHover={() => setHighlighted(eventsStart + i)}
                    onSelect={() => goTo(`/dashboard/events?highlight=${event._id}`)}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900/5">
                      <Calendar className="h-4 w-4 text-slate-500" />
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-slate-900 truncate">{event.title}</span>
                      <span className="text-xs text-slate-500 truncate">
                        {new Date(event.event_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        {event.location ? ` • ${event.location}` : ""}
                      </span>
                    </div>
                  </ResultRow>
                ))}
              </ResultSection>
            </div>
          )}

          {/* Footer hint — only once there's something to act on */}
          {hasQuery && hasResults && (
            <div className="flex shrink-0 items-center gap-1.5 px-4 py-2 border-t border-black/5 text-[11px] text-slate-500">
              <CornerDownLeft className="h-3 w-3" />
              to open
              {(activeCategory === "all" || activeCategory === "people") && (
                <>
                  <Users className="h-3 w-3 ml-2" />
                  {people.length}
                </>
              )}
              {(activeCategory === "all" || activeCategory === "posts") && (
                <>
                  <FileText className="h-3 w-3 ml-1.5" />
                  {posts.length}
                </>
              )}
              {(activeCategory === "all" || activeCategory === "events") && (
                <>
                  <Calendar className="h-3 w-3 ml-1.5" />
                  {events.length}
                </>
              )}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

// A section only renders once it has rows — the icon + label pairing and the
// hairline above it are the "separation," kept deliberately understated
// (no color blocks) so three categories read as one continuous list.
function ResultSection({
  icon: Icon,
  label,
  count,
  hasDivider,
  children,
}: {
  icon: LucideIcon;
  label: string;
  count: number;
  hasDivider: boolean;
  children: React.ReactNode;
}) {
  if (count === 0) return null;

  return (
    <div className={cn("py-1.5", hasDivider && "border-t border-black/5")}>
      <div className="flex items-center gap-1.5 px-4 pb-1">
        <Icon className="h-3 w-3 text-slate-400" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      </div>
      {children}
    </div>
  );
}

function ResultRow({
  active,
  onHover,
  onSelect,
  children,
}: {
  active: boolean;
  onHover: () => void;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors",
        active ? "bg-primary/10" : "hover:bg-black/5"
      )}
    >
      {children}
    </button>
  );
}

export default GlobalSearchModal;
