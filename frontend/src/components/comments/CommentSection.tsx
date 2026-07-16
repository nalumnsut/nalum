import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronDown,
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
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  submitLabel: string;
  isSubmitting: boolean;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative group">
      <MentionTextarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-h-[100px] w-full bg-white/[0.03] border border-white/10 group-focus-within:bg-white/[0.06] group-focus-within:border-white/20 transition-all duration-300 rounded-[24px] px-4 py-3.5 text-[15px] leading-relaxed text-gray-100 outline-none resize-none placeholder:text-gray-500 shadow-inner"
      />
      <div className="absolute bottom-2 right-2">
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !value.trim()}
          className="rounded-full bg-gradient-to-r from-[#800000] to-[#a33] px-5 py-2 h-auto text-[14px] font-semibold text-white shadow-lg hover:shadow-[#800000]/25 transition-all duration-300 disabled:opacity-40"
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
      setShowReplies(true);
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
    <div className={cn("flex flex-col gap-2", depth > 0 && "mt-4")}>
      <div className="flex gap-3">
        <Link
          to={`/dashboard/alumni/${comment.author?._id || comment.authorId}`}
          className="shrink-0 relative z-10"
        >
          <div className="rounded-full ring-2 ring-slate-900 shadow-sm">
            <UserAvatar src={undefined} name={comment.author?.name || "User"} size="sm" />
          </div>
        </Link>

        <div className="flex-1 min-w-0 group">
          <div className="bg-white/[0.04] border border-white/[0.05] hover:bg-white/[0.06] transition-colors rounded-[22px] rounded-tl-sm px-4 py-3 relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Link
                  to={`/dashboard/alumni/${comment.author?._id || comment.authorId}`}
                  className="text-[14px] font-semibold text-gray-100 hover:text-white transition-colors"
                >
                  {comment.author?.name || "Unknown user"}
                </Link>
                <span className="text-[12px] text-gray-500 font-medium">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                  {comment.editedAt ? " • edited" : ""}
                </span>
              </div>

              {canManage && !comment.isDeleted && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3 bg-slate-900/80 backdrop-blur-sm rounded-full p-0.5">
                  <button
                    onClick={() => {
                      setEditValue(comment.content || "");
                      setIsEditing((value) => !value);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-300 rounded-full transition-colors"
                  >
                    <PencilLine className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="p-1.5 text-gray-400 hover:text-red-400 rounded-full transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-1">
              {isEditing ? (
                <div className="space-y-3 mt-2">
                  <MentionTextarea
                    value={editValue}
                    onChange={setEditValue}
                    className="min-h-[60px] bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-[14px] leading-relaxed outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                      className="text-[12px] h-7 px-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdate}
                      disabled={isSaving || !editValue.trim()}
                      className="text-[12px] h-7 px-4 bg-[#800000] text-white hover:bg-[#600000] rounded-full"
                    >
                      {isSaving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                      Save
                    </Button>
                  </div>
                </div>
              ) : comment.isDeleted ? (
                <span className="text-[14px] italic text-gray-500">{displayContent}</span>
              ) : (
                <div className="text-[14.5px] text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
                  {parseFormattedText(displayContent)}
                </div>
              )}
            </div>
          </div>

          {!comment.isDeleted && (
            <div className="mt-2 ml-2 flex flex-wrap items-center gap-4 text-[12px] font-semibold text-gray-400">
              {depth === 0 && (
                <button
                  onClick={handleOpenReply}
                  className="hover:text-gray-100 transition-colors"
                >
                  Reply
                </button>
              )}
              {depth === 0 && comment.replies.length > 0 && (
                <button
                  onClick={() => setShowReplies((value) => !value)}
                  className="flex items-center gap-1 hover:text-gray-100 transition-colors"
                >
                  {showReplies ? "Hide replies" : `View ${comment.replies.length} replies`}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", showReplies && "rotate-180")} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {replyOpen && (
        <div className="ml-10 sm:ml-12 mt-2">
          <CommentComposer
            value={replyValue}
            onChange={setReplyValue}
            onSubmit={handleReply}
            submitLabel="Reply"
            isSubmitting={isReplying}
            placeholder={`Replying to @${comment.author?.name || "user"}...`}
            autoFocus
          />
        </div>
      )}

      {depth === 0 && showReplies && comment.replies.length > 0 && (
        <div className="ml-5 sm:ml-6 pl-5 sm:pl-6 mt-2 border-l-2 border-white/5 space-y-4">
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
    <Card className="mt-5 sm:mt-8 overflow-hidden border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl rounded-3xl">
      <CardContent className="p-5 sm:p-7 space-y-7">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#800000]/20 p-2 rounded-xl">
              <MessageSquare className="h-5 w-5 text-[#a33]" />
            </div>
            <h2 className="text-[18px] font-bold text-white tracking-wide">Discussion</h2>
          </div>
          <span className="bg-white/5 text-gray-300 px-3 py-1 rounded-full text-[13px] font-semibold">
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </span>
        </div>

        <div className="bg-black/20 rounded-[28px] p-2">
          <CommentComposer
            value={commentValue}
            onChange={setCommentValue}
            onSubmit={handleCreateComment}
            submitLabel="Post Comment"
            isSubmitting={isSubmitting}
            placeholder="Share your thoughts or ask a question..."
          />
        </div>

        <div className="space-y-6 pt-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#a33]" />
              <span className="text-sm font-medium">Loading conversation...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-3">
              <div className="bg-white/5 p-4 rounded-full">
                <MessageSquare className="h-8 w-8 text-gray-600" />
              </div>
              <p className="text-[15px] font-medium text-gray-400">No comments yet</p>
              <p className="text-[13px] text-gray-500">Be the first to share your thoughts!</p>
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