import type { Database, ModerationType, Role, Session } from "./types";

const BASE = "/api";
const TOKEN_KEY = "challenge-rewards-token";

let authToken: string | null = localStorage.getItem(TOKEN_KEY);

export function setToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return authToken;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  return headers;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: buildHeaders() });
  if (!res.ok && res.status !== 409) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

async function requestVoid(path: string, options?: RequestInit): Promise<void> {
  await fetch(`${BASE}${path}`, { ...options, headers: buildHeaders() });
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

export const api = {
  login: (username: string, password: string) =>
    request<Session>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  register: (input: { username: string; password: string; role: Role; displayName: string }) =>
    request<Session>("/auth/register", { method: "POST", body: JSON.stringify(input) }),

  me: () => request<Session>("/auth/me"),

  logout: () => requestVoid("/auth/logout", { method: "POST" }),

  getState: () => request<Database>("/state"),

  reset: () => request<Database>("/reset", { method: "POST" }),

  createChallenge: (input: {
    title: string;
    description: string;
    category: string;
    moderationType: ModerationType;
    rewardLabel: string;
    capacity: number;
    startDate: string;
    endDate: string;
  }) => request<Database>("/challenges", { method: "POST", body: JSON.stringify(input) }),

  approveChallenge: (id: string, reviewerNote?: string) =>
    request<Database>(`/challenges/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ reviewerNote }),
    }),

  rejectChallenge: (id: string, reviewerNote?: string) =>
    request<Database>(`/challenges/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reviewerNote }),
    }),

  join: (id: string) => request<Database>(`/challenges/${id}/join`, { method: "POST" }),

  leave: (id: string) => request<Database>(`/challenges/${id}/leave`, { method: "POST" }),

  submit: (input: { challengeId: string; note: string; proofImage?: string }) =>
    request<Database>("/submissions", { method: "POST", body: JSON.stringify(input) }),

  approveSubmission: (id: string, reviewerNote?: string) =>
    request<Database>(`/submissions/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ reviewerNote }),
    }),

  rejectSubmission: (id: string, reviewerNote?: string) =>
    request<Database>(`/submissions/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reviewerNote }),
    }),

  redeem: (code: string) =>
    request<ActionResult>("/coupons/redeem", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
};
