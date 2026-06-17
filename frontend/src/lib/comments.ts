import api from "@/lib/api";

export interface CommentAuthor {
  _id: string;
  name: string;
  role?: string | null;
}

export interface CommentItem {
  _id: string;
  postId: string;
  authorId: string;
  author: CommentAuthor;
  parentCommentId: string | null;
  rootCommentId: string | null;
  content: string | null;
  mentions: Array<{ userId: string; name: string }>;
  status: "active" | "deleted" | "hidden";
  isDeleted?: boolean;
  replyCount: number;
  likeCount: number;
  replies: CommentItem[];
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
}

export interface CommentThreadResponse {
  comments: CommentItem[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export async function fetchPostComments(postId: string, page = 1, limit = 20) {
  const { data } = await api.get(`/posts/${postId}/comments`, {
    params: { page, limit },
  });

  return data.data as CommentThreadResponse;
}

export async function createPostComment(
  postId: string,
  content: string,
  parentCommentId: string | null = null
) {
  const { data } = await api.post(`/posts/${postId}/comments`, {
    content,
    parentCommentId,
  });

  return data.data as CommentItem;
}

export async function createCommentReply(
  postId: string,
  commentId: string,
  content: string
) {
  const { data } = await api.post(`/posts/${postId}/comments/${commentId}/replies`, {
    content,
  });

  return data.data as CommentItem;
}

export async function updatePostComment(
  postId: string,
  commentId: string,
  content: string
) {
  const { data } = await api.patch(`/posts/${postId}/comments/${commentId}`, {
    content,
  });

  return data.data as CommentItem;
}

export async function deletePostComment(postId: string, commentId: string) {
  const { data } = await api.delete(`/posts/${postId}/comments/${commentId}`);

  return data.data as CommentItem;
}