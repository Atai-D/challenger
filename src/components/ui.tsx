import type { ButtonHTMLAttributes, ReactNode } from "react";
import type {
  ChallengeStatus,
  CouponStatus,
  ModerationType,
  SubmissionStatus,
} from "../types";
import { MODERATION_LABELS } from "../types";

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`card ${onClick ? "card-clickable" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: {
  children: ReactNode;
  variant?: ButtonVariant;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`btn btn-${variant} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "danger" | "brand";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function SubmissionBadge({ status }: { status: SubmissionStatus }) {
  const map: Record<SubmissionStatus, "warning" | "success" | "danger"> = {
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "danger",
  };
  return <Badge tone={map[status]}>{status}</Badge>;
}

export function CouponBadge({ status }: { status: CouponStatus }) {
  const map: Record<CouponStatus, "success" | "neutral" | "danger"> = {
    ACTIVE: "success",
    REDEEMED: "neutral",
    EXPIRED: "danger",
  };
  return <Badge tone={map[status]}>{status}</Badge>;
}

export function ModerationBadge({ type }: { type: ModerationType }) {
  return <Badge tone="info">{MODERATION_LABELS[type]}</Badge>;
}

export function ChallengeStatusBadge({ status }: { status: ChallengeStatus }) {
  const map: Record<ChallengeStatus, { tone: "warning" | "success" | "danger"; label: string }> = {
    PENDING_REVIEW: { tone: "warning", label: "Awaiting review" },
    APPROVED: { tone: "success", label: "Approved" },
    REJECTED: { tone: "danger", label: "Rejected" },
  };
  const { tone, label } = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`tab ${active === t.id ? "tab-active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {typeof t.count === "number" && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: string;
  hint?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  );
}

export function Avatar({ text, tone = "brand" }: { text: string; tone?: "brand" | "user" }) {
  return <div className={`avatar avatar-${tone}`}>{text}</div>;
}

export function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-text">{text}</div>
    </div>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="progress">
      <div className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
