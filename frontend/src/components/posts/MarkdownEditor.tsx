import { useRef, useState } from "react";
import {
  Bold,
  Check,
  Eye,
  FileText,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  PenLine,
  Quote,
  Underline,
  X,
} from "lucide-react";
import MentionTextarea from "@/components/MentionTextarea";
import {
  SegmentedToggle,
  SegmentedToggleOption,
} from "@/components/ui/SegmentedToggle";
import PostMarkdown from "@/components/posts/PostMarkdown";
import { getCaretPosition } from "@/lib/caret";
import { wordCount } from "@/lib/posts";
import { cn } from "@/lib/utils";

type EditorMode = "write" | "preview";

const MODE_OPTIONS: readonly SegmentedToggleOption<EditorMode>[] = [
  { value: "write", label: "Write", icon: PenLine },
  { value: "preview", label: "Preview", icon: Eye },
];

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  /** Resolved URLs for attachment:N references, so preview matches the post. */
  attachments?: string[];
  /** Called once on mount with a resolver that replaces @Name → @[Name](userId) */
  onResolverReady?: (resolver: (text: string) => string) => void;
  enableSpecialMentions?: boolean;
}

type InsertMode = "link" | "image";

// Markdown composer for post bodies: a formatting toolbar over the shared
// MentionTextarea, so @mentions keep working inside markdown.
const MarkdownEditor = ({
  value,
  onChange,
  placeholder = "Write your post content here… Markdown is supported.",
  minHeight = "320px",
  attachments = [],
  onResolverReady,
  enableSpecialMentions = false,
}: MarkdownEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const resolverRef = useRef<(text: string) => string>((t) => t);
  const [preview, setPreview] = useState(false);
  const [insertMode, setInsertMode] = useState<InsertMode | null>(null);
  const [insertAnchor, setInsertAnchor] = useState({ top: 0, left: 0 });
  const [url, setUrl] = useState("");
  // Where the caret sat when the popover opened — the textarea loses the
  // selection to the popover's input.
  const savedRange = useRef<[number, number]>([0, 0]);

  const focusAt = (position: number) => {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(position, position);
    });
  };

  const replaceRange = (start: number, end: number, snippet: string) => {
    onChange(value.slice(0, start) + snippet + value.slice(end));
    focusAt(start + snippet.length);
  };

  // Wraps the selection in the given delimiters. With nothing selected the
  // delimiters go in empty and the caret lands between them, ready to type.
  const wrapSelection = (before: string, after = before) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);

    onChange(value.slice(0, start) + before + selected + after + value.slice(end));
    focusAt(start + before.length + selected.length);
  };

  // Prefixes every line the selection touches — headings, quotes and lists are
  // line-scoped in markdown, not span-scoped.
  const prefixLines = (prefix: string | ((index: number) => string)) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd =
      value.indexOf("\n", end) === -1 ? value.length : value.indexOf("\n", end);

    const block = value.slice(lineStart, lineEnd) || "";
    const next = block
      .split("\n")
      .map((line, index) => {
        const token = typeof prefix === "function" ? prefix(index) : prefix;
        // Toggle: applying the same prefix twice removes it.
        return line.startsWith(token) ? line.slice(token.length) : token + line;
      })
      .join("\n");

    onChange(value.slice(0, lineStart) + next + value.slice(lineEnd));
    focusAt(lineStart + next.length);
  };

  const openInsert = (mode: InsertMode) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    savedRange.current = [textarea.selectionStart, textarea.selectionEnd];

    const caret = getCaretPosition(textarea);
    const width = wrapperRef.current?.clientWidth ?? 0;
    setInsertAnchor({
      top: textarea.offsetTop + caret.top + caret.lineHeight + 4,
      // Keep the popover inside the editor no matter where the caret sits.
      left: Math.max(8, Math.min(caret.left, Math.max(8, width - 300))),
    });
    setInsertMode(mode);
  };

  const confirmInsert = () => {
    if (!url.trim()) return;

    const [start, end] = savedRange.current;
    const selected = value.slice(start, end);
    const snippet =
      insertMode === "image"
        ? `![${selected || "image"}](${url.trim()})`
        : `[${selected || "link text"}](${url.trim()})`;

    replaceRange(start, end, snippet);
    setInsertMode(null);
    setUrl("");
  };

  const tools = [
    { icon: Bold, label: "Bold", action: () => wrapSelection("**") },
    { icon: Italic, label: "Italic", action: () => wrapSelection("*") },
    { icon: Underline, label: "Underline", action: () => wrapSelection("<u>", "</u>") },
    { divider: true },
    { icon: Heading1, label: "Heading 1", action: () => prefixLines("# ") },
    { icon: Heading2, label: "Heading 2", action: () => prefixLines("## ") },
    { divider: true },
    { icon: List, label: "Bulleted list", action: () => prefixLines("- ") },
    {
      icon: ListOrdered,
      label: "Numbered list",
      action: () => prefixLines((index) => `${index + 1}. `),
    },
    { icon: Quote, label: "Quote", action: () => prefixLines("> ") },
    { divider: true },
    { icon: LinkIcon, label: "Link", action: () => openInsert("link") },
    { icon: ImageIcon, label: "Image by URL", action: () => openInsert("image") },
  ] as const;

  const words = wordCount(value);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted px-2 py-1.5">
        {tools.map((tool, index) =>
          "divider" in tool ? (
            <span
              key={`divider-${index}`}
              aria-hidden="true"
              className="mx-1.5 hidden h-5 w-px bg-border sm:block"
            />
          ) : (
            <button
              key={tool.label}
              type="button"
              title={tool.label}
              aria-label={tool.label}
              disabled={preview}
              onClick={tool.action}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-card hover:text-primary disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            >
              <tool.icon className="h-4 w-4" />
            </button>
          )
        )}

        {/* Write / Preview */}
        <SegmentedToggle
          label="Editor mode"
          value={preview ? "preview" : "write"}
          onChange={(mode) => {
            setPreview(mode === "preview");
            setInsertMode(null);
          }}
          options={MODE_OPTIONS}
          trackClassName="bg-card"
          className="ml-auto h-9"
        />
      </div>

      {/* Body */}
      <div ref={wrapperRef} className="relative">
        {preview ? (
          <div className="px-4 py-4" style={{ minHeight }}>
            {value.trim() ? (
              <PostMarkdown
                content={resolverRef.current(value)}
                attachments={attachments}
              />
            ) : (
              <p className="text-body-md text-muted-foreground">
                Nothing to preview yet.
              </p>
            )}
          </div>
        ) : (
          <MentionTextarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            placement="bottom"
            enableSpecialMentions={enableSpecialMentions}
            onResolverReady={(fn) => {
              resolverRef.current = fn;
              onResolverReady?.(fn);
            }}
            placeholder={`${placeholder} Type @ to mention someone.`}
            className={cn(
              "rounded-none border-0 bg-card px-4 py-4 text-body-md leading-relaxed",
              "focus-visible:ring-0 focus-visible:ring-offset-0"
            )}
            style={{ minHeight }}
          />
        )}

        {/* Compact URL prompt, anchored to the caret */}
        {insertMode && !preview && (
          <div
            className="absolute z-20 flex w-[290px] items-center gap-1 rounded-lg border border-border bg-popover p-1 shadow-overlay"
            style={{ top: insertAnchor.top, left: insertAnchor.left }}
          >
            <input
              type="url"
              autoFocus
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  confirmInsert();
                }
                if (event.key === "Escape") {
                  setInsertMode(null);
                  setUrl("");
                }
              }}
              placeholder={
                insertMode === "image" ? "Image URL…" : "Link URL…"
              }
              className="h-7 min-w-0 flex-1 rounded-md bg-transparent px-2 text-body-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="button"
              onClick={confirmInsert}
              disabled={!url.trim()}
              aria-label="Insert"
              className="rounded-md p-1.5 text-primary transition-colors hover:bg-accent disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Cancel"
              onClick={() => {
                setInsertMode(null);
                setUrl("");
              }}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-body-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Markdown supported
        </span>
        <span>
          {words} {words === 1 ? "word" : "words"}
        </span>
      </div>
    </div>
  );
};

export default MarkdownEditor;
