import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  PencilLine,
  Send,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MentionTextarea from "@/components/MentionTextarea";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/context/AuthContext";
import { parseFormattedText } from "@/lib/textFormatting";
import { cn } from "@/lib/utils";
import {
  CommentItem,
  createCommentReply,
  createPostComment,
  deletePostComment,
  fetchPostComments,
  updatePostComment,
} from "@/lib/comments";

interface CommentSectionProps {
  postId: string;
}

function normalizeCommentThread(comments: CommentItem[]): CommentItem[] {
  return comments.map((comment) => ({
    ...comment,
    replies: Array.isArray(comment.replies)
      ? comment.replies.map((reply) => ({
          ...reply,
          replies: [],
        }))
      : [],
  }));
}

function CommentComposer({
  value,
  onChange,
  onSubmit,
  submitLabel,
  isSubmitting,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  submitLabel: string;
  isSubmitting: boolean;
  placeholder: string;
}) {
  return (
    <div className="space-y-2.5">
      <MentionTextarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-h-[92px] sm:min-h-[110px] bg-slate-950/60 border-white/10 rounded-[20px] px-3.5 py-3 text-[15px] leading-6 shadow-inner shadow-black/10"
      />
      <div className="flex justify-end">
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !value.trim()}
          className="w-full sm:w-auto rounded-full bg-[#800000] px-5 text-white shadow-[0_10px_24px_rgba(128,0,0,0.22)] hover:bg-[#600000]"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  postId,
  onChanged,
  depth = 0,
}: {
  comment: CommentItem;
  postId: string;
  onChanged: () => Promise<void>;
  depth?: number;
}) {
  const { user } = useAuth();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyValue, setReplyValue] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const currentUserId = user?.user_id ?? user?.id;
  const commentAuthorId = comment.author?._id ?? comment.authorId;
  const isOwner = String(currentUserId ?? "") === String(commentAuthorId ?? "");
  const canManage = isOwner || user?.role === "admin";
  const displayContent = comment.isDeleted
    ? "This comment was deleted."
    : comment.content || "";

  const handleReply = async () => {
    if (!replyValue.trim()) return;

    try {
      setIsReplying(true);
      await createCommentReply(postId, comment._id, replyValue.trim());
      setReplyValue("");
      setReplyOpen(false);
      await onChanged();
    } catch (error) {
      console.error("Failed to reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

  const handleUpdate = async () => {
    if (!editValue.trim()) return;

    try {
      setIsSaving(true);
      await updatePostComment(postId, comment._id, editValue.trim());
      setIsEditing(false);
      await onChanged();
    } catch (error) {
      console.error("Failed to update comment:", error);
      toast.error("Failed to update comment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSaving(true);
      await deletePostComment(postId, comment._id);
      await onChanged();
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Failed to delete comment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenReply = () => {
    setReplyOpen((value) => !value);

    if (!replyOpen && !replyValue.trim()) {
      const authorName = comment.author?.name || "";
      if (authorName) {
        setReplyValue(`@${authorName} `);
      }
    }
  };

  return (
    <div className={cn("space-y-3", depth > 0 && "pl-0 sm:pl-6")}> 
      <div className="flex gap-2.5 sm:gap-3">
        <Link
          to={`/dashboard/alumni/${comment.author?._id || comment.authorId}`}
          className="shrink-0"
        >
          <UserAvatar src={undefined} name={comment.author?.name || "User"} size="sm" />
        </Link>

        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "border border-white/10 px-3 py-2.5 sm:px-4 sm:py-3",
              depth > 0
                ? "rounded-2xl bg-white/[0.035] sm:bg-white/5"
                : "rounded-[22px] bg-white/5 shadow-[0_12px_36px_rgba(0,0,0,0.16)]"
            )}
          >
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div>
                <Link
                  to={`/dashboard/alumni/${comment.author?._id || comment.authorId}`}
                  className="text-[15px] font-semibold text-white transition-colors hover:text-blue-300"
                >
                  {comment.author?.name || "Unknown user"}
                </Link>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                  {comment.editedAt ? <span>edited</span> : null}
                </div>
              </div>

              {canManage && !comment.isDeleted && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-blue-300"
                    onClick={() => {
                      setEditValue(comment.content || "");
                      setIsEditing((value) => !value);
                    }}
                  >
                    <PencilLine className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-300"
                    onClick={handleDelete}
                    disabled={isSaving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className={cn("mt-2.5 text-sm text-gray-200 whitespace-pre-wrap break-words", depth > 0 && "text-[14px] leading-6")}>
              {isEditing ? (
                <div className="space-y-3">
                  <MentionTextarea
                    value={editValue}
                    onChange={setEditValue}
                    className="min-h-[92px] bg-slate-950/70 border-white/10 rounded-[18px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                      className="text-gray-300 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdate}
                      disabled={isSaving || !editValue.trim()}
                      className="bg-[#800000] text-white hover:bg-[#600000]"
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Save
                    </Button>
                  </div>
                </div>
              ) : comment.isDeleted ? (
                <span className="italic text-gray-500">{displayContent}</span>
              ) : (
                <div>{parseFormattedText(displayContent)}</div>
              )}
            </div>

            {!comment.isDeleted && (
              <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[11px] text-gray-400">
                {depth === 0 && (
                  <button
                    type="button"
                    onClick={handleOpenReply}
                    className="rounded-full bg-white/5 px-3 py-1.5 font-medium text-gray-200 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Reply
                  </button>
                )}
                {depth === 0 && comment.replies.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowReplies((value) => !value)}
                    className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 font-medium text-gray-200 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {showReplies ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {showReplies
                      ? "Hide replies"
                      : `View replies (${comment.replies.length})`}
                  </button>
                )}
              </div>
            )}
          </div>

          {replyOpen && (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <span>Replying to</span>
                  <span className="font-medium text-white">@{comment.author?.name || "user"}</span>
                </div>
                <CommentComposer
                  value={replyValue}
                  onChange={setReplyValue}
                  onSubmit={handleReply}
                  submitLabel="Reply"
                  isSubmitting={isReplying}
                  placeholder={`Reply to ${comment.author?.name || "this comment"}...`}
                />
              </div>
            </div>
          )}

          {depth === 0 && showReplies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
              {comment.replies.map((reply) => (
                <CommentCard
                  key={reply._id}
                  comment={reply}
                  postId={postId}
                  onChanged={onChanged}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentValue, setCommentValue] = useState("");

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const data = await fetchPostComments(postId);
      setComments(normalizeCommentThread(data.comments || []));
    } catch (error) {
      console.error("Failed to load comments:", error);
      toast.error("Failed to load comments");
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  const handleCreateComment = async () => {
    if (!commentValue.trim()) return;

    try {
      setIsSubmitting(true);
      await createPostComment(postId, commentValue.trim());
      setCommentValue("");
      await loadComments();
    } catch (error) {
      console.error("Failed to create comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-5 sm:mt-6 overflow-hidden border-white/10 bg-slate-900/50 backdrop-blur-sm">
      <CardContent className="space-y-4 p-3 sm:space-y-6 sm:p-6">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-5 w-5 text-[#a33]" />
          <h2 className="text-lg font-semibold text-white">Comments</h2>
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-gray-300">{comments.length}</span>
        </div>

        <div className="space-y-3 rounded-[24px] border border-white/10 bg-black/10 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-200">Add a comment</p>
            <span className="text-[11px] text-gray-500">Instagram-style thread</span>
          </div>
          <CommentComposer
            value={commentValue}
            onChange={setCommentValue}
            onSubmit={handleCreateComment}
            submitLabel="Comment"
            isSubmitting={isSubmitting}
            placeholder="Write a comment. Use @name to mention someone."
          />
        </div>

        <div className="space-y-4 sm:space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-gray-400">
              No comments yet. Be the first to start the conversation.
            </div>
          ) : (
            comments.map((comment) => (
              <CommentCard
                key={comment._id}
                comment={comment}
                postId={postId}
                onChanged={loadComments}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}