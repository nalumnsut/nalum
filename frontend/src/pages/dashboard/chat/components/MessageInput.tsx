import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import MentionTextarea from "@/components/MentionTextarea";
import { Send } from "lucide-react";
import { useChatContext } from "@/context/ChatContext";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  conversationId: string;
  receiverId: string;
  onInputFocus?: () => void;
}

export const MessageInput = ({
  onSendMessage,
  disabled,
  conversationId,
  receiverId,
  onInputFocus,
}: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const { socket } = useChatContext();
  const { emitTyping } = useTypingIndicator(socket, conversationId);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolverRef = useRef<(text: string) => string>((t) => t);

  const handleInputChange = (value: string) => {
    setMessage(value);

    // Emit typing start
    emitTyping(true, receiverId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit typing stop
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false, receiverId);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      const resolvedContent = resolverRef.current(message.trim());
      onSendMessage(resolvedContent);
      setMessage("");
      emitTyping(false, receiverId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Scroll into view on mobile when keyboard appears
    if (window.innerWidth < 768) {
      setTimeout(() => {
        // Check if element still exists and is mounted
        if (e.target && document.contains(e.target)) {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 300);
    }
    onInputFocus?.();
  };

  return (
    <div className="p-3 border-t border-border bg-card">
      <div className="flex gap-2 items-center min-w-0">
        <MentionTextarea
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onResolverReady={(fn) => { resolverRef.current = fn; }}
          placeholder="Type a message... (@mention)"
          className="flex-1 min-w-0 min-h-[44px] resize-none bg-background border-input focus:border-primary focus:ring-ring/20 rounded-lg transition-all shadow-sm text-sm text-foreground placeholder:text-muted-foreground pr-2"
          disabled={disabled}
          style={{ maxHeight: "84px", overflowY: "auto" }}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="icon"
          className="h-[44px] w-[44px] rounded-full shadow-sm transition-all hover:scale-105 shrink-0 bg-primary hover:bg-primary-hover text-primary-foreground mb-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
