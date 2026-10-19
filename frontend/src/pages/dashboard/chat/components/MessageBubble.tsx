import { Button } from "@/components/ui/button";
import { Trash2, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { renderMentions } from "@/lib/textFormatting";

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  onDelete: (messageId: string) => void;
}

/**
 * MessageBubble Component
 * 
 * Displays a single message in the chat conversation.
 * 
 * Features:
 * - Differentiates between "Own" (sent by current user) and "Other" (received) messages.
 * - Supports system messages with a distinct style.
 * - Displays read status and timestamp.
 * - Allows message deletion for the sender.
 */
export const MessageBubble = ({ message, isOwn, onDelete, isStacked, isLastInStack }: MessageBubbleProps & { isStacked?: boolean, isLastInStack?: boolean }) => {
  // Handle system messages
  if (message.messageType === 'system') {
    return (
      <div className="flex justify-center my-4 animate-in fade-in zoom-in-95 duration-300">
        <span className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted rounded-full border border-border">
          {message.content}
        </span>
      </div>
    );
  }

  // Calculate read status: Check if anyone other than the sender is in the readBy array
  const senderId = message.sender?._id || message.sender;
  const isRead = message.readBy?.some((r: any) => {
    const readerId = r.user?._id || r.user;
    return readerId?.toString() !== senderId?.toString();
  });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} group animate-in fade-in slide-in-from-bottom-2 duration-300 ${isStacked ? "mt-0.5" : "mt-4"} pr-1`}>
      <div className={`relative max-w-[85%] sm:max-w-[75%] min-w-0 ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {/* Message Content Bubble */}
        <div
          className={`max-w-full overflow-hidden rounded-2xl px-4 py-2.5 shadow-sm border text-sm ${isOwn
            ? "bg-card text-foreground border-border"
            : "bg-card text-foreground border-border"
            } ${isStacked ? (isOwn ? "rounded-tr-md" : "rounded-tl-md") : ""} ${!isLastInStack ? (isOwn ? "rounded-br-md" : "rounded-bl-md") : (isOwn ? "rounded-br-none" : "rounded-bl-none")}`}
        >
          <p className="whitespace-pre-wrap [overflow-wrap:anywhere] leading-relaxed">{renderMentions(message.content)}</p>
        </div>

        {/* Delete button for stacked messages (absolute to avoid layout shift) */}
        {!isLastInStack && isOwn && !message.isOptimistic && (
          <div className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? "-left-8" : "-right-8"} opacity-0 group-hover:opacity-100 transition-opacity`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
              onClick={() => onDelete(message._id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Message Metadata (Time, Status, Actions) */}
        {isLastInStack && (
          <div className="flex items-center gap-1 px-1 mt-0.5">
            <span className="text-[10px] text-muted-foreground font-medium">
              {format(new Date(message.createdAt), "HH:mm")}
            </span>

            {message.isOptimistic && (
              <span className="text-[10px] text-muted-foreground font-medium italic">Sending...</span>
            )}

            {!message.isOptimistic && isOwn && (
              <span className="ml-1 flex items-center min-w-[12px]" title={isRead ? "Read" : "Sent"}>
                {isRead ? (
                  <CheckCheck className="h-3 w-3 text-primary" />
                ) : (
                  <Check className="h-3 w-3 text-muted-foreground" />
                )}
              </span>
            )}

            {isOwn && !message.isOptimistic && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive text-muted-foreground ml-1"
                onClick={() => onDelete(message._id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
