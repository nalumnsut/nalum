import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

/*
 * Post bodies are markdown (GFM). Two wrinkles this renderer has to carry:
 *
 *  1. Posts written before the markdown switch may contain a little raw HTML
 *     (the old toolbar emitted <u>…</u>), so rehype-raw parses it and
 *     rehype-sanitize immediately throws away anything that isn't on the
 *     allow-list.
 *  2. Mentions are not markdown. Legacy @[Name](userId) tokens are rewritten
 *     to profile links before parsing, and bare @Name is turned into a link
 *     node by the remark plugin below; both are intercepted in the `a`
 *     renderer so they never leave the app.
 */

const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "u", "mark"],
  protocols: {
    ...defaultSchema.protocols,
    // The editor previews not-yet-uploaded attachments through object URLs,
    // which the default allow-list (http/https only) would strip. blob: is
    // same-document by construction, so it can never point off-origin.
    src: [...(defaultSchema.protocols?.src || []), "blob"],
  },
};

// react-markdown runs its own URL allow-list (http/https/mailto/…) before the
// rehype pipeline sees anything, and it blanks blob: URLs — which is what the
// editor previews unsaved attachments with. Everything else keeps the default.
const urlTransform = (url: string) =>
  url.startsWith("blob:") ? url : defaultUrlTransform(url);

const LEGACY_MENTION = /@\[([^\]]+)\]\(([^)]+)\)/g;
const MENTION_PREFIX = "/mention/";
const MENTION_PATTERN =
  /@([A-Za-z0-9_]+(?:[-.'][A-Za-z0-9_]+)*(?:\s+[A-Z][a-zA-Z0-9_]*(?:[-.'][a-zA-Z0-9_]+)*)*)(?=[.,!?;:]*(?:\s|$))/g;
// ![alt](attachment:2) — a body reference to the post's own uploaded images,
// written when the file itself has no URL yet (it uploads with the post).
const ATTACHMENT_REF = /\(attachment:(\d+)\)/g;

type MdNode = {
  type: string;
  value?: string;
  url?: string;
  children?: MdNode[];
};

function splitMentions(value: string): MdNode[] | null {
  MENTION_PATTERN.lastIndex = 0;
  const nodes: MdNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = MENTION_PATTERN.exec(value))) {
    // Guard against email addresses and paths: a mention only starts a word.
    const before = match.index > 0 ? value[match.index - 1] : "";
    if (before && /[\w/@.]/.test(before)) continue;

    if (match.index > cursor) {
      nodes.push({ type: "text", value: value.slice(cursor, match.index) });
    }
    nodes.push({
      type: "link",
      url: `${MENTION_PREFIX}${encodeURIComponent(match[1])}`,
      children: [{ type: "text", value: `@${match[1]}` }],
    });
    cursor = match.index + match[0].length;
  }

  if (!nodes.length) return null;
  if (cursor < value.length) {
    nodes.push({ type: "text", value: value.slice(cursor) });
  }
  return nodes;
}

function remarkMentions() {
  return (tree: MdNode) => {
    const walk = (node: MdNode) => {
      if (!node.children) return;

      // Never linkify inside something that is already a link.
      if (node.type === "link" || node.type === "linkReference") return;

      const next: MdNode[] = [];
      let changed = false;

      for (const child of node.children) {
        if (child.type === "text" && child.value) {
          const parts = splitMentions(child.value);
          if (parts) {
            next.push(...parts);
            changed = true;
            continue;
          }
        }
        walk(child);
        next.push(child);
      }

      if (changed) node.children = next;
    };

    walk(tree);
  };
}

// A bare @Name carries no user id, so the profile is resolved on click.
const MentionLink = ({ name }: { name: string }) => {
  const navigate = useNavigate();

  const handleClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const cleanName = name.trim();
    if (!cleanName) return;
    try {
      const { data } = await api.get(`/mention?q=${encodeURIComponent(cleanName)}`);
      const users: { _id: string; name: string }[] = data.users || [];
      const target =
        users.find((user) => user.name.toLowerCase() === cleanName.toLowerCase()) ??
        users[0];
      if (target) navigate(`/dashboard/alumni/${target._id}`);
    } catch {
      /* the mention simply stays inert if the lookup fails */
    }
  };

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(event) => event.key === "Enter" && handleClick(event as never)}
      className="cursor-pointer font-medium text-primary hover:underline"
    >
      @{name}
    </span>
  );
};

interface PostMarkdownProps {
  content: string;
  className?: string;
  /** Tightens the type scale for previews and cards. */
  compact?: boolean;
  /**
   * Resolved URLs for the post's attachments, in upload order. `attachment:1`
   * in the body maps to the first entry; unresolvable references are dropped
   * rather than rendered as a broken image.
   */
  attachments?: string[];
}

const PostMarkdown = ({
  content,
  className,
  compact,
  attachments = [],
}: PostMarkdownProps) => {
  const source = useMemo(() => {
    const withMentions = content.replace(
      LEGACY_MENTION,
      (_, name, id) => `[@${name}](/dashboard/alumni/${id})`
    );

    return withMentions.replace(ATTACHMENT_REF, (match, index) => {
      const url = attachments[Number(index) - 1];
      return url ? `(${url})` : match;
    });
  }, [content, attachments]);

  return (
    <div
      className={cn(
        "prose max-w-none [overflow-wrap:anywhere] text-muted-foreground",
        "prose-headings:text-foreground prose-headings:font-semibold",
        "prose-h1:text-headline-lg prose-h2:text-headline-md prose-h3:text-body-lg",
        "prose-p:text-muted-foreground prose-li:text-muted-foreground",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-secondary/60",
        "prose-blockquote:rounded-r-lg prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:text-foreground",
        "prose-code:text-primary prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:bg-surface-container prose-pre:text-foreground",
        "prose-img:rounded-card prose-img:border prose-img:border-border",
        "prose-hr:border-border",
        compact ? "prose-sm" : "text-body-md leading-relaxed",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMentions]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
        urlTransform={urlTransform}
        components={{
          a: ({ href, children, ...props }) => {
            if (href?.startsWith(MENTION_PREFIX)) {
              return (
                <MentionLink
                  name={decodeURIComponent(href.slice(MENTION_PREFIX.length))}
                />
              );
            }
            if (href?.startsWith("/")) {
              return (
                <Link to={href} onClick={(event) => event.stopPropagation()}>
                  {children}
                </Link>
              );
            }
            return (
              <a
                {...props}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                {children}
              </a>
            );
          },
          // An attachment reference that no longer resolves (the author deleted
          // the image) loses its src to the sanitizer — drop it entirely rather
          // than render a broken frame.
          img: ({ src, alt }) =>
            src ? (
              <img src={src} alt={alt || ""} loading="lazy" className="w-full" />
            ) : null,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
};

export default PostMarkdown;
