import apiClient from "./api";

// Re-export types
export interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    admin: Admin;
  };
}

export interface DashboardStats {
  users: {
    total: number;
    students: number;
    alumni: number;
    verified_alumni: number;
    banned: number;
    recent_registrations: number;
  };
  verifications: {
    pending: number;
    verified: number;
  };
  events: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  newsletters: {
    total: number;
    total_views: number;
    total_downloads: number;
  };
  bans: {
    active: number;
    total: number;
  };
}

export interface VerificationQueueItem {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  };
  details_provided: {
    name: string;
    roll_no?: string;
    batch: string;
    branch: string;
  };
  createdAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  verified_alumni: boolean;
  banned: boolean;
  ban_expires_at?: string;
  createdAt: string;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  event_type: string;
  image_url?: string;
  created_by: string;
  creator_name: string;
  creator_email: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  max_participants?: number;
  registration_link?: string;
  contact_info?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  likes?: number;
  gallery?: string[];
  recap?: string;
  createdAt: string;
}

export interface Newsletter {
  _id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_by: string;
  uploaded_by_name?: string;
  view_count: number;
  download_count: number;
  is_active: boolean;
  published_date: string;
  upload_date: string;
  createdAt: string;
}

export interface BannedUser {
  _id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  banned_by: string;
  banned_by_name: string;
  reason: string;
  duration: string;
  ban_expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface VerificationCodeType {
  _id: string;
  code: string;
  generated_by: {
    _id: string;
    name: string;
    email: string;
  };
  used_by?: {
    _id: string;
    name: string;
    email: string;
  };
  is_used: boolean;
  used_at?: string;
  expires_at: string;
  createdAt: string;
}

export interface CodeStats {
  total: number;
  active: number;
  used: number;
  expired: number;
}

/**
 * Simplified Admin API - Uses main apiClient with automatic auth
 * All functions use the unified authentication system
 */

// API Functions

// Dashboard & Statistics
export const getDashboardStats = async () => {
  const response = await apiClient.get<{ success: boolean; stats: DashboardStats }>("/admin/statistics/dashboard");
  return response.data;
};

export const getRegistrationGraph = async (days: number = 30) => {
  const response = await apiClient.get(`/admin/statistics/registrations?days=${days}`);
  return response.data;
};

export const getAllUsers = async (params?: {
  page?: number;
  limit?: number;
  role?: string;
  verified?: boolean;
  banned?: boolean;
  search?: string;
}) => {
  const response = await apiClient.get("/admin/statistics/users", { params });
  return response.data;
};

// Verification Queue
export const getVerificationQueue = async (page: number = 1, limit: number = 10) => {
  console.log("[adminApi] getVerificationQueue called with page:", page, "limit:", limit);
  const response = await apiClient.get(`/admin/verification/queue?page=${page}&limit=${limit}`);
  console.log("[adminApi] getVerificationQueue response:", response.data);
  return response.data;
};

export const approveVerification = async (userId: string, notes?: string) => {
  const response = await apiClient.post(`/admin/verification/approve/${userId}`, { notes });
  return response.data;
};

export const rejectVerification = async (userId: string, reason: string) => {
  const response = await apiClient.post(`/admin/verification/reject/${userId}`, { reason });
  return response.data;
};

export const getVerificationStats = async () => {
  const response = await apiClient.get("/admin/verification/stats");
  return response.data;
};

// User Management (Ban/Unban)
export const banUser = async (userId: string, duration: string, reason: string) => {
  const response = await apiClient.post(`/admin/users/ban/${userId}`, { duration, reason });
  return response.data;
};

export const unbanUser = async (userId: string, notes?: string) => {
  const response = await apiClient.post(`/admin/users/unban/${userId}`, { notes });
  return response.data;
};

export const getBannedUsers = async (page: number = 1, limit: number = 10) => {
  const response = await apiClient.get(`/admin/users/banned?page=${page}&limit=${limit}`);
  return response.data;
};

export const getUserBanHistory = async (userId: string) => {
  const response = await apiClient.get(`/admin/users/history/${userId}`);
  return response.data;
};

// Events
export const getAllEvents = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  event_type?: string;
}) => {
  const response = await apiClient.get("/admin/events/all", { params });
  return response.data;
};

export const getPendingEvents = async (page: number = 1, limit: number = 10) => {
  const response = await apiClient.get(`/admin/events/pending?page=${page}&limit=${limit}`);
  return response.data;
};

export const getEventById = async (eventId: string) => {
  const response = await apiClient.get(`/admin/events/${eventId}`);
  return response.data;
};

export const approveEvent = async (eventId: string, notes?: string) => {
  const response = await apiClient.post(`/admin/events/approve/${eventId}`, { notes });
  return response.data;
};

export const rejectEvent = async (eventId: string, reason: string) => {
  const response = await apiClient.post(`/admin/events/reject/${eventId}`, { reason });
  return response.data;
};

export const deleteEvent = async (eventId: string) => {
  const response = await apiClient.delete(`/admin/events/delete/${eventId}`);
  return response.data;
};

export const addEventGalleryPhotos = async (eventId: string, files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("gallery_images", file));
  const response = await apiClient.post(`/admin/events/${eventId}/gallery`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const removeEventGalleryPhoto = async (eventId: string, photoUrl: string) => {
  const response = await apiClient.delete(`/admin/events/${eventId}/gallery`, {
    data: { photo_url: photoUrl },
  });
  return response.data;
};

// Newsletters
export const uploadNewsletter = async (file: File, title: string, description: string) => {
  const formData = new FormData();
  formData.append("newsletter", file);
  formData.append("title", title);
  formData.append("description", description);
  
  const response = await apiClient.post("/admin/newsletters/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getAllNewsletters = async (page: number = 1, limit: number = 10, is_active?: boolean) => {
  const params = is_active !== undefined ? { page, limit, is_active } : { page, limit };
  const response = await apiClient.get("/admin/newsletters/all", { params });
  return response.data;
};

export const deleteNewsletter = async (newsletterId: string) => {
  const response = await apiClient.delete(`/admin/newsletters/${newsletterId}`);
  return response.data;
};

// Verification Codes
export const generateVerificationCodes = async (count: number = 1) => {
  const response = await apiClient.post("/admin/codes/generate", { count });
  return response.data;
};

export const getAllVerificationCodes = async (params?: {
  page?: number;
  limit?: number;
  status?: "all" | "active" | "used" | "expired";
}) => {
  const response = await apiClient.get("/admin/codes", { params });
  return response.data;
};

export const getCodeStatistics = async () => {
  const response = await apiClient.get("/admin/codes/stats");
  return response.data;
};

export const deleteExpiredCodes = async () => {
  const response = await apiClient.delete("/admin/codes/expired");
  return response.data;
};
