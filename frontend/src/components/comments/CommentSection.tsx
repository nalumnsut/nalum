import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronDown,
  Loader2,
  MessageSquare,
  MoreVertical,
  PencilLine,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MentionTextarea from "@/components/MentionTextarea";
import UserAvatar from "@/components/UserAvatar";
import PostMarkdown from "@/components/posts/PostMarkdown";
import { useAuth } from "@/context/AuthContext";
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
  onCancel,
  onResolverReady,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  submitLabel: string;
  isSubmitting: boolean;
  placeholder: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  onResolverReady?: (resolver: (text: string) => string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Replies open pre-filled with "@author ", and focus alone would park the
  // caret at position 0 — in front of the mention rather than after it.
  useEffect(() => {
    if (!autoFocus) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    const end = textarea.value.length;
    textarea.focus();
    textarea.setSelectionRange(end, end);
    // Deliberately keyed on autoFocus alone — later value changes are the user
    // typing, and re-running would yank their caret to the end.
  }, [autoFocus]);

  return (
    <div className="space-y-3">
      <MentionTextarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onResolverReady={onResolverReady}
        placeholder={placeholder}
        className="min-h-[96px] rounded-lg border-input bg-card px-4 py-3 text-body-md"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-full px-4 text-label-md text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !value.trim()}
          className="gap-2 rounded-full bg-primary px-5 text-label-md text-primary-foreground hover:bg-primary-hover"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const replyResolverRef = useRef<(text: string) => string>((t) => t);
  const editResolverRef = useRef<(text: string) => string>((t) => t);

  const currentUserId = user?.id;
  const commentAuthorId = comment.author?._id ?? comment.authorId;
  const isOwner = String(currentUserId ?? "") === String(commentAuthorId ?? "");
  const canManage = isOwner || user?.role === "admin";
  // The API nulls the content of a deleted comment; we keep the node in the
  // thread and show a tombstone so replies below it stay anchored.
  const displayContent = comment.isDeleted
    ? "This comment was deleted."
    : comment.content || "";

  const handleReply = async () => {
    if (!replyValue.trim()) return;
    try {
      setIsReplying(true);
      const resolved = replyResolverRef.current(replyValue.trim());
      await createCommentReply(postId, comment._id, resolved);
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
      const resolved = editResolverRef.current(editValue.trim());
      await updatePostComment(postId, comment._id, resolved);
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
      setConfirmOpen(false);
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
      if (authorName) setReplyValue(`@${authorName} `);
    }
  };

  const authorId = comment.author?._id || comment.authorId;
  const isAuthorAdmin = comment.author?.role === "admin";

  return (
    <div className={cn("flex flex-col gap-2", depth > 0 && "mt-4")}>
      <div className="flex gap-3">
        {isAuthorAdmin ? (
          <div className="shrink-0">
            <UserAvatar src={undefined} name={comment.author?.name || "Admin"} size="sm" />
          </div>
        ) : (
          <Link to={`/dashboard/alumni/${authorId}`} className="shrink-0">
            <UserAvatar src={undefined} name={comment.author?.name || "User"} size="sm" />
          </Link>
        )}

        <div className="min-w-0 flex-1">
          <div className="rounded-card border border-border bg-card p-4 shadow-card">
            <div className="mb-1 flex items-center justify-between gap-3">
              {isAuthorAdmin ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="min-w-0 truncate text-label-md font-semibold text-foreground">
                    {comment.author?.name || "Administrator"}
                  </span>
                  <span className="rounded bg-primary-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Admin
                  </span>
                </div>
              ) : (
                <Link
                  to={`/dashboard/alumni/${authorId}`}
                  className="min-w-0 truncate text-label-md text-foreground hover:text-primary"
                >
                  {comment.author?.name || "Unknown user"}
                </Link>
              )}

              <div className="flex shrink-0 items-center gap-1">
                <span className="text-body-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                  {comment.editedAt ? " • edited" : ""}
                </span>

                {canManage && !comment.isDeleted && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Comment actions"
                        className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-primary"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditValue(comment.content || "");
                          setIsEditing(true);
                        }}
                      >
                        <PencilLine className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setConfirmOpen(true)}
                        disabled={isSaving}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="mt-3">
                <CommentComposer
                  value={editValue}
                  onChange={setEditValue}
                  onSubmit={handleUpdate}
                  onResolverReady={(fn) => { editResolverRef.current = fn; }}
                  submitLabel="Save"
                  isSubmitting={isSaving}
                  placeholder="Edit your comment…"
                  onCancel={() => setIsEditing(false)}
                />
              </div>
            ) : comment.isDeleted ? (
              <p className="text-body-sm italic text-muted-foreground">
                {displayContent}
              </p>
            ) : (
              <div className="whitespace-pre-line">
                <PostMarkdown
                  content={displayContent}
                  compact
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {!comment.isDeleted && depth === 0 && (
            <div className="ml-2 mt-2 flex flex-wrap items-center gap-4 text-label-md text-muted-foreground">
              <button
                type="button"
                onClick={handleOpenReply}
                className="transition-colors hover:text-primary"
              >
                Reply
              </button>
              {comment.replies.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowReplies((value) => !value)}
                  className="flex items-center gap-1 transition-colors hover:text-primary"
                >
                  {showReplies
                    ? `Hide replies (${comment.replies.length})`
                    : `View ${comment.replies.length} ${
                        comment.replies.length === 1 ? "reply" : "replies"
                      }`}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      showReplies && "rotate-180"
                    )}
                  />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete comment?"
        description="This will permanently remove your comment."
        isDeleting={isSaving}
        onConfirm={handleDelete}
      />

      {replyOpen && (
        <div className="ml-11 mt-2">
          <CommentComposer
            value={replyValue}
            onChange={setReplyValue}
            onSubmit={handleReply}
            onResolverReady={(fn) => { replyResolverRef.current = fn; }}
            submitLabel="Reply"
            isSubmitting={isReplying}
            placeholder={`Replying to @${comment.author?.name || "user"}…`}
            autoFocus
            onCancel={() => setReplyOpen(false)}
          />
        </div>
      )}

      {depth === 0 && showReplies && comment.replies.length > 0 && (
        <div className="ml-5 mt-2 space-y-4 border-l-2 border-border pl-5 sm:ml-6 sm:pl-6">
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const commentResolverRef = useRef<(text: string) => string>((t) => t);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const data = await fetchPostComments(postId);
      setComments(normalizeCommentThread(data.comments || []));
      setPage(1);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error("Failed to load comments:", error);
      toast.error("Failed to load comments");
      setComments([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Root comments come back newest-first, so the next page is strictly older
  // — appending it to the end of the list is what "load more" means here.
  const loadMoreComments = async () => {
    if (page >= totalPages || isLoadingMore) return;
    const nextPage = page + 1;
    try {
      setIsLoadingMore(true);
      const data = await fetchPostComments(postId, nextPage);
      setComments((prev) => [...prev, ...normalizeCommentThread(data.comments || [])]);
      setPage(nextPage);
      setTotalPages(data.pagination?.pages || totalPages);
    } catch (error) {
      console.error("Failed to load more comments:", error);
      toast.error("Failed to load more comments");
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleCreateComment = async () => {
    if (!commentValue.trim()) return;

    try {
      setIsSubmitting(true);
      const resolved = commentResolverRef.current(commentValue.trim());
      await createPostComment(postId, resolved);
      setCommentValue("");
      await loadComments();
    } catch (error) {
      console.error("Failed to create comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Replies are nested one level deep, so the headline count has to include them.
  const total = comments.reduce(
    (count, comment) => count + 1 + comment.replies.length,
    0
  );

  return (
    <section className="space-y-6">
      <h2 className="text-headline-md text-foreground">Comments ({total})</h2>

      <CommentComposer
        value={commentValue}
        onChange={setCommentValue}
        onSubmit={handleCreateComment}
        onResolverReady={(fn) => { commentResolverRef.current = fn; }}
        submitLabel="Post Comment"
        isSubmitting={isSubmitting}
        placeholder="Add a comment to the discussion…"
      />

      {isLoading ? (
        <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <span className="text-body-sm">Loading conversation…</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="rounded-full bg-muted p-4">
            <MessageSquare className="h-7 w-7 text-muted-foreground" />
          </span>
          <p className="text-label-md text-foreground">No comments yet</p>
          <p className="text-body-sm text-muted-foreground">
            Be the first to share your thoughts.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentCard
              key={comment._id}
              comment={comment}
              postId={postId}
              onChanged={loadComments}
            />
          ))}

          {page < totalPages && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={loadMoreComments}
                disabled={isLoadingMore}
                className="gap-2 rounded-full border-border px-5 text-label-md text-muted-foreground hover:border-primary hover:text-primary"
              >
                {isLoadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                Load more comments
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
