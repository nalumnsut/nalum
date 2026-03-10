import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";

// ── Mention token (legacy): @[Name](userId) → rendered as profile link ──────
const MENTION_PATTERN = /@\[([^\]]+)\]\(([^)]+)\)/g;

export const parseMentionSegment = (
  text: string,
  lineIndex: number,
  partIndex: number
): (string | JSX.Element)[] => {
  const segments = text.split(MENTION_PATTERN);
  const result: (string | JSX.Element)[] = [];
  for (let i = 0; i < segments.length; i += 3) {
    if (segments[i]) result.push(segments[i]);
    if (segments[i + 1] && segments[i + 2]) {
      result.push(
        <Link
          key={`mention-${lineIndex}-${partIndex}-${i}`}
          to={`/dashboard/alumni/${segments[i + 2]}`}
          className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          @{segments[i + 1]}
        </Link>
      );
    }
  }
  return result;
};

// ── Plain @mention: @Name → clickable, looks up profile by name on click ────
const PLAIN_MENTION_PATTERN = /@(\w+)/g;

const PlainMentionLink = ({ name, mentionKey }: { name: string; mentionKey: string }) => {
  const navigate = useNavigate();
  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const { data } = await api.get(`/mention?q=${encodeURIComponent(name)}`);
      const users: { _id: string; name: string }[] = data.users || [];
      const exact = users.find(u => u.name.toLowerCase() === name.toLowerCase());
      const target = exact ?? users[0];
      if (target) navigate(`/dashboard/alumni/${target._id}`);
    } catch { /* ignore */ }
  };
  return (
    <span
      key={mentionKey}
      className="text-blue-400 font-medium cursor-pointer hover:text-blue-300 hover:underline"
      onClick={handleClick}
    >
      @{name}
    </span>
  );
};

const parsePlainMentions = (
  text: string,
  lineIndex: number,
  partIndex: number
): (string | JSX.Element)[] => {
  const segments = text.split(PLAIN_MENTION_PATTERN);
  const result: (string | JSX.Element)[] = [];
  for (let i = 0; i < segments.length; i += 2) {
    if (segments[i]) result.push(segments[i]);
    if (segments[i + 1]) {
      result.push(
        <PlainMentionLink
          key={`pmention-${lineIndex}-${partIndex}-${i}`}
          mentionKey={`pmention-${lineIndex}-${partIndex}-${i}`}
          name={segments[i + 1]}
        />
      );
    }
  }
  return result;
};

// ── Simple mention renderer (no markdown, just mentions) ─────────────────────
// Handles both legacy @[Name](id) tokens and plain @Name mentions.
export const renderMentions = (text: string): (string | JSX.Element)[] => {
  // First resolve legacy tokens, then plain @mentions on leftover strings
  const afterLegacy = parseMentionSegment(text, 0, 0);
  return afterLegacy.flatMap((part, i) => {
    if (typeof part !== 'string') return [part];
    return parsePlainMentions(part, 0, i);
  });
};

// Parse markdown-style formatting to JSX
export const parseFormattedText = (text: string) => {
  if (!text) return null;

  // Split by lines
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    if (!line.trim()) return <br key={lineIndex} />;

    // Parse inline formatting
    let parts: (string | JSX.Element)[] = [line];

    // Helper to apply formatting recursively
    const applyFormatting = (text: string | JSX.Element, pattern: RegExp, tag: string): (string | JSX.Element)[] => {
      if (typeof text !== 'string') return [text];
      
      const segments = text.split(pattern);
      const result: (string | JSX.Element)[] = [];
      
      for (let i = 0; i < segments.length; i++) {
        if (i % 2 === 0) {
          result.push(segments[i]);
        } else {
          const key = `${tag}-${lineIndex}-${i}`;
          switch (tag) {
            case 'bold':
              result.push(<strong key={key}>{segments[i]}</strong>);
              break;
            case 'italic':
              result.push(<em key={key}>{segments[i]}</em>);
              break;
            case 'underline':
              result.push(<u key={key}>{segments[i]}</u>);
              break;
            case 'strike':
              result.push(<s key={key}>{segments[i]}</s>);
              break;
          }
        }
      }
      return result;
    };

    // Bold: **text**
    parts = parts.flatMap(part => applyFormatting(part, /\*\*(.+?)\*\*/g, 'bold'));
    
    // Italic: *text*
    parts = parts.flatMap(part => applyFormatting(part, /\*([^*]+?)\*/g, 'italic'));
    
    // Underline: <u>text</u>
    parts = parts.flatMap(part => applyFormatting(part, /<u>(.+?)<\/u>/g, 'underline'));
    
    // Strikethrough: ~~text~~
    parts = parts.flatMap(part => applyFormatting(part, /~~(.+?)~~/g, 'strike'));

    // Mentions: legacy @[Name](id) tokens first, then plain @Name
    parts = parts.flatMap((part, partIndex) => {
      if (typeof part !== 'string') return [part];
      return parseMentionSegment(part, lineIndex, partIndex);
    });
    // Plain @Name mentions (what users see after selecting from autocomplete)
    parts = parts.flatMap((part, partIndex) => {
      if (typeof part !== 'string') return [part];
      return parsePlainMentions(part, lineIndex, partIndex);
    });

    // Links: [text](url) — negative lookbehind ensures we skip any remaining
    // @ prefixed tokens (shouldn't exist after mention pass, but defensive).
    parts = parts.flatMap((part) => {
      if (typeof part !== 'string') return [part];
      
      // Use negative lookbehind to avoid @[Name](...) which contains [text](url)
      const linkPattern = /(?<!@)\[(.+?)\]\((.+?)\)/g;
      const segments = part.split(linkPattern);
      const result: (string | JSX.Element)[] = [];
      
      for (let i = 0; i < segments.length; i += 3) {
        if (segments[i]) result.push(segments[i]);
        if (segments[i + 1] && segments[i + 2]) {
          // Ensure URL has protocol
          let url = segments[i + 2];
          if (!url.match(/^https?:\/\//i)) {
            url = 'https://' + url;
          }
          result.push(
            <a
              key={`link-${lineIndex}-${i}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {segments[i + 1]}
            </a>
          );
        }
      }
      return result;
    });

    // First line is title - make it bold and larger
    if (lineIndex === 0) {
      return (
        <div key={lineIndex} className="text-xl font-bold text-white mb-2">
          {parts}
        </div>
      );
    }

    return (
      <span key={lineIndex} className="block">
        {parts}
      </span>
    );
  });
};
