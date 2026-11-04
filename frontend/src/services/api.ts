import {
  RegisterInput,
  LoginInput,
  OnboardingInput,
  ProfileUpdateInput,
  SkillCreateInput,
  UserSkillCreateInput,
  UserSkillUpdateInput,
  CreateExchangeInput,
  UpdateExchangeStatusInput,
  CreateSessionInput,
  UpdateSessionStatusInput,
  CreateReviewInput,
  CreatePostInput,
  CreateReportInput,
  AdminUpdateUserInput,
  AdminReportActionInput,
  ApiResponse,
  AuthUser,
  PublicUserProfile,
  SkillDto,
  UserSkillDto,
  ExchangeDto,
  ExchangeSessionDto,
  ConversationDto,
  MessageDto,
  NotificationDto,
  ReviewDto,
  ConnectionDto,
  CommunityPostDto,
  ReportDto,
  PlatformStatsDto,
  AnalyticsSummaryDto,
} from "@skillbarter/shared";

const API_BASE_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "/api/v1"
    : process.env.BACKEND_API_URL
      ? `${process.env.BACKEND_API_URL.replace(/\/+$/, "")}/api/v1`
      : process.env.PUBLIC_API_URL ||
        (process.env.NEXT_PUBLIC_API_URL?.startsWith("http") ? process.env.NEXT_PUBLIC_API_URL : undefined) ||
        "http://localhost:4000/api/v1";

class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(message: string, code = "API_ERROR", details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const payload = await response.json().catch(() => null) as ApiResponse<{ accessToken: string }> | null;
        const accessToken = payload?.success ? payload.data?.accessToken : undefined;

        if (!response.ok || !accessToken) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("skillbarter_token");
          }
          return false;
        }

        localStorage.setItem("skillbarter_token", accessToken);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  retryAfterRefresh = true,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  // Attach the short-lived access token when available. The refresh token stays
  // in an HttpOnly cookie and is never exposed to JavaScript.
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("skillbarter_token");
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const authEndpoint = endpoint.split("?")[0] ?? endpoint;
  const shouldRefresh = ![
    "/auth/login",
    "/auth/register",
    "/auth/logout",
    "/auth/refresh",
    "/auth/verify-email",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/phone/request-otp",
    "/auth/phone/verify-otp",
    "/auth/email/request-otp",
    "/auth/email/verify-otp",
  ].includes(authEndpoint);

  if (res.status === 401 && retryAfterRefresh && shouldRefresh && await refreshAccessToken()) {
    return fetchApi<T>(endpoint, options, false);
  }

  const data: ApiResponse<T> = await res.json().catch(() => ({
    success: false,
    error: { code: "INVALID_RESPONSE", message: `Server returned status ${res.status}` },
  }));

  if (!res.ok || !data.success) {
    const error = data.error || {
      code: `HTTP_${res.status}`,
      message: res.statusText || "Request failed",
    };
    throw new ApiError(error.message, error.code, error.details);
  }

  return data.data as T;
}
export const api = {
  // Auth
  auth: {
    register: (input: RegisterInput) =>
      fetchApi<{ user: AuthUser; accessToken: string }>(
        "/auth/register",
        { method: "POST", body: JSON.stringify(input) }
      ),
    resendVerification: (email: string) =>
      fetchApi<{ message: string }>("/auth/resend-verification", {
        method: "POST", body: JSON.stringify({ email }),
      }),
    login: (input: LoginInput) =>
      fetchApi<{ user: AuthUser; accessToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    requestPhoneOtp: (phone: string) =>
      fetchApi<{ challengeId: string; phone: string }>("/auth/phone/request-otp", {
        method: "POST",
        body: JSON.stringify({ phone }),
      }),
    verifyPhoneOtp: (phone: string, otp: string, challengeId: string) =>
      fetchApi<{ user: AuthUser; accessToken: string }>("/auth/phone/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, otp, challengeId }),
      }),
    requestEmailOtp: (email: string) =>
      fetchApi<{ message: string }>("/auth/email/request-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    verifyEmailOtp: (email: string, otp: string) =>
      fetchApi<{ user: AuthUser; accessToken: string }>("/auth/email/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      }),
    logout: () => fetchApi<{ message: string }>("/auth/logout", { method: "POST" }),
    me: () => fetchApi<{ user: AuthUser }>("/auth/me"),
    verifyEmail: (token: string) =>
      fetchApi<{ user: AuthUser; message: string }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    forgotPassword: (email: string) =>
      fetchApi<{ message: string; resetToken?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token: string, newPassword: string) =>
      fetchApi<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      }),
    changePassword: (currentPassword: string, newPassword: string) =>
      fetchApi<{ message: string }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },

  // Users & Profiles
  users: {
    completeOnboarding: (input: OnboardingInput) =>
      fetchApi<{ user: AuthUser }>("/users/onboarding", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    getProfile: (id: string) => fetchApi<{ profile: PublicUserProfile }>(`/users/${id}`),
    updateProfile: (input: ProfileUpdateInput) =>
      fetchApi<{ user: AuthUser }>("/users/profile", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
  },

  // Skills
  skills: {
    list: (category?: string, search?: string, page = 1) => {
      const params = new URLSearchParams({ page: String(page) });
      if (category) params.set("category", category);
      if (search) params.set("search", search);
      return fetchApi<SkillDto[]>(`/skills?${params.toString()}`);
    },
    create: (input: SkillCreateInput) =>
      fetchApi<{ skill: SkillDto }>("/skills", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    mySkills: () => fetchApi<{ skills: UserSkillDto[] }>("/skills/user"),
    addMySkill: (input: UserSkillCreateInput) =>
      fetchApi<{ userSkill: UserSkillDto }>("/skills/user", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    updateMySkill: (id: string, input: UserSkillUpdateInput) =>
      fetchApi<{ userSkill: UserSkillDto }>(`/skills/user/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    removeMySkill: (id: string) =>
      fetchApi<{ message: string }>(`/skills/user/${id}`, { method: "DELETE" }),
  },

  // Matches
  matches: {
    discover: (category?: string, search?: string, format?: string, page = 1) => {
      const params = new URLSearchParams({ page: String(page) });
      if (category) params.set("category", category);
      if (search) params.set("search", search);
      if (format) params.set("format", format);
      return fetchApi<any[]>(`/matches/discover?${params.toString()}`);
    },
  },

  // Exchanges
  exchanges: {
    create: (input: CreateExchangeInput) =>
      fetchApi<{ exchange: ExchangeDto }>("/exchanges", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    list: (status?: string) =>
      fetchApi<{ exchanges: ExchangeDto[] }>(`/exchanges${status ? `?status=${status}` : ""}`),
    getById: (id: string) => fetchApi<{ exchange: ExchangeDto }>(`/exchanges/${id}`),
    updateStatus: (id: string, input: UpdateExchangeStatusInput) =>
      fetchApi<{ exchange: ExchangeDto }>(`/exchanges/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    complete: (id: string) =>
      fetchApi<{ exchange: ExchangeDto }>(`/exchanges/${id}/complete`, { method: "POST" }),
    dispute: (id: string, reason: string) =>
      fetchApi<{ exchange: ExchangeDto }>(`/exchanges/${id}/dispute`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    // Sessions
    createSession: (exchangeId: string, input: CreateSessionInput) =>
      fetchApi<{ session: ExchangeSessionDto }>(`/exchanges/${exchangeId}/sessions`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    listSessions: (exchangeId: string) =>
      fetchApi<{ sessions: ExchangeSessionDto[] }>(`/exchanges/${exchangeId}/sessions`),
    updateSessionStatus: (exchangeId: string, sessionId: string, input: UpdateSessionStatusInput) =>
      fetchApi<{ session: ExchangeSessionDto }>(`/exchanges/${exchangeId}/sessions/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
  },

  // Messages & Conversations
  messages: {
    conversations: () =>
      fetchApi<{ conversations: ConversationDto[] }>("/messages/conversations"),
    getOrCreateConversation: (targetUserId: string) =>
      fetchApi<{ conversation: { id: string } }>("/messages/conversations", {
        method: "POST",
        body: JSON.stringify({ targetUserId }),
      }),
    getMessages: (conversationId: string, page = 1) =>
      fetchApi<MessageDto[]>(`/messages/conversations/${conversationId}?page=${page}`),
    sendMessage: (conversationId: string, content: string) =>
      fetchApi<{ message: MessageDto }>(`/messages/conversations/${conversationId}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
  },

  // Notifications
  notifications: {
    list: (page = 1) => fetchApi<NotificationDto[]>(`/notifications?page=${page}`),
    unreadCount: () => fetchApi<{ unreadCount: number }>("/notifications/unread-count"),
    markRead: (id: string) =>
      fetchApi<{ message: string }>(`/notifications/${id}/read`, { method: "PATCH" }),
    markAllRead: () =>
      fetchApi<{ message: string }>("/notifications/mark-all-read", { method: "POST" }),
  },

  // Reviews
  reviews: {
    create: (input: CreateReviewInput) =>
      fetchApi<{ review: ReviewDto }>("/reviews", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    getUserReviews: (userId: string) =>
      fetchApi<{ reviews: ReviewDto[] }>(`/reviews/user/${userId}`),
  },

  // Community
  community: {
    requestConnection: (recipientId: string) =>
      fetchApi<{ connection: ConnectionDto }>("/community/connections", {
        method: "POST",
        body: JSON.stringify({ recipientId }),
      }),
    acceptConnection: (id: string) =>
      fetchApi<{ connection: ConnectionDto }>(`/community/connections/${id}/accept`, {
        method: "PATCH",
      }),
    removeConnection: (id: string) =>
      fetchApi<{ message: string }>(`/community/connections/${id}`, { method: "DELETE" }),
    listConnections: (status?: string) =>
      fetchApi<{ connections: ConnectionDto[] }>(
        `/community/connections${status ? `?status=${status}` : ""}`
      ),
    createPost: (input: CreatePostInput) =>
      fetchApi<{ post: CommunityPostDto }>("/community/posts", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    listPosts: (page = 1) => fetchApi<CommunityPostDto[]>(`/community/posts?page=${page}`),
    deletePost: (id: string) =>
      fetchApi<{ message: string }>(`/community/posts/${id}`, { method: "DELETE" }),
  },

  // Safety
  safety: {
    block: (userId: string, reason?: string) =>
      fetchApi<{ message: string }>("/safety/block", {
        method: "POST",
        body: JSON.stringify({ userId, reason }),
      }),
    unblock: (userId: string) =>
      fetchApi<{ message: string }>(`/safety/block/${userId}`, { method: "DELETE" }),
    listBlocked: () => fetchApi<{ blockedUsers: any[] }>("/safety/blocked"),
    createReport: (input: CreateReportInput) =>
      fetchApi<{ report: ReportDto }>("/safety/report", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },

  // Admin
  admin: {
    stats: () => fetchApi<{ stats: PlatformStatsDto }>("/admin/stats"),
    users: (page = 1, search?: string, role?: string) => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (role) params.set("role", role);
      return fetchApi<any[]>(`/admin/users?${params.toString()}`);
    },
    updateUser: (id: string, input: AdminUpdateUserInput) =>
      fetchApi<{ user: any }>(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    reports: (page = 1, status?: string) => {
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.set("status", status);
      return fetchApi<ReportDto[]>(`/admin/reports?${params.toString()}`);
    },
    handleReport: (id: string, input: AdminReportActionInput) =>
      fetchApi<{ report: ReportDto }>(`/admin/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    auditLogs: (page = 1) => fetchApi<any[]>(`/admin/audit-logs?page=${page}`),
    bootstrap: (secretKey: string, email: string, password: string, displayName: string) =>
      fetchApi<{ message: string; adminId: string }>("/admin/bootstrap", {
        method: "POST",
        body: JSON.stringify({ secretKey, email, password, displayName }),
      }),
  },

  // Analytics
  analytics: {
    track: (eventName: string, metadata?: Record<string, unknown>) =>
      fetchApi<{ tracked: boolean }>("/analytics/track", {
        method: "POST",
        body: JSON.stringify({ eventName, metadata }),
      }),
    summary: () => fetchApi<{ summary: AnalyticsSummaryDto }>("/analytics/summary"),
  },
};
