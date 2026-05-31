export type AppMode = "user" | "org" | "admin";

export type Role = "USER" | "ORG" | "ADMIN";

export interface Session {
  token: string;
  role: Role;
  subjectId: string | null;
  username: string;
  displayName: string;
}

export type ModerationType = "STRAVA" | "CHECKIN" | "MANUAL";

export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type CouponStatus = "ACTIVE" | "REDEEMED" | "EXPIRED";

export type ChallengeStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Organization {
  id: string;
  name: string;
  avatar: string;
}

export interface Challenge {
  id: string;
  orgId: string;
  title: string;
  description: string;
  category: string;
  moderationType: ModerationType;
  rewardLabel: string;
  points: number;
  capacity: number;
  startDate: string;
  endDate: string;
  createdAt: number;
  status: ChallengeStatus;
  reviewedAt?: number;
  reviewerNote?: string;
}

export interface Participation {
  id: string;
  challengeId: string;
  userId: string;
  joinedAt: number;
}

export interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  type: ModerationType;
  note: string;
  proofImage?: string; // data URL
  status: SubmissionStatus;
  createdAt: number;
  reviewedAt?: number;
  reviewerNote?: string;
}

export interface Coupon {
  id: string;
  code: string;
  challengeId: string;
  userId: string;
  orgId: string;
  label: string;
  status: CouponStatus;
  createdAt: number;
  expiresAt: number;
  redeemedAt?: number;
}

export interface Database {
  users: User[];
  organizations: Organization[];
  challenges: Challenge[];
  participations: Participation[];
  submissions: Submission[];
  coupons: Coupon[];
}

export const MODERATION_LABELS: Record<ModerationType, string> = {
  STRAVA: "Strava screenshot",
  CHECKIN: "Event check-in",
  MANUAL: "Manual proof",
};

export const MODERATION_HINTS: Record<ModerationType, string> = {
  STRAVA: "Upload a screenshot of your Strava activity to verify your effort.",
  CHECKIN: "Confirm your check-in at the event location.",
  MANUAL: "Describe what you did and attach any supporting proof.",
};
