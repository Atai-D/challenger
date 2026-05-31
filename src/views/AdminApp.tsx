import { useMemo, useState } from "react";
import { useStore } from "../store";
import type { ChallengeStatus } from "../types";
import { formatDate, timeAgo } from "../utils";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ChallengeStatusBadge,
  EmptyState,
  ModerationBadge,
  StatCard,
  Tabs,
} from "../components/ui";

type AdminFilter = ChallengeStatus | "ALL";

export function AdminApp() {
  const store = useStore();
  const [filter, setFilter] = useState<AdminFilter>("PENDING_REVIEW");
  const s = store.adminStats;

  const counts = useMemo(() => {
    return {
      ALL: store.db.challenges.length,
      PENDING_REVIEW: store.db.challenges.filter((c) => c.status === "PENDING_REVIEW").length,
      APPROVED: store.db.challenges.filter((c) => c.status === "APPROVED").length,
      REJECTED: store.db.challenges.filter((c) => c.status === "REJECTED").length,
    };
  }, [store.db.challenges]);

  const challenges = store.db.challenges
    .filter((c) => (filter === "ALL" ? true : c.status === filter))
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="container">
      <div className="profile-head">
        <Avatar text="CR" />
        <div>
          <h2>Platform Review</h2>
          <p className="muted">Approve safe challenges or reject anything risky before it reaches users.</p>
        </div>
      </div>

      <div className="grid grid-stats">
        <StatCard icon="🛡️" label="Awaiting review" value={s.pendingReview} />
        <StatCard icon="✅" label="Approved challenges" value={s.approvedChallenges} />
        <StatCard icon="⛔" label="Rejected challenges" value={s.rejectedChallenges} />
        <StatCard icon="🏢" label="Organizations" value={s.organizations} />
      </div>

      <Tabs<AdminFilter>
        active={filter}
        onChange={setFilter}
        tabs={[
          { id: "PENDING_REVIEW", label: "Awaiting review", count: counts.PENDING_REVIEW },
          { id: "APPROVED", label: "Approved", count: counts.APPROVED },
          { id: "REJECTED", label: "Rejected", count: counts.REJECTED },
          { id: "ALL", label: "All", count: counts.ALL },
        ]}
      />

      {challenges.length === 0 ? (
        <EmptyState icon="🗂️" title="Nothing here" text="No challenges match this filter." />
      ) : (
        <div className="stack">
          {challenges.map((c) => (
            <ReviewCard key={c.id} challengeId={c.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ challengeId }: { challengeId: string }) {
  const store = useStore();
  const c = store.db.challenges.find((x) => x.id === challengeId);
  const [note, setNote] = useState("");
  if (!c) return null;
  const org = store.db.organizations.find((o) => o.id === c.orgId);

  return (
    <Card className="mod-card">
      <div className="mod-head">
        <div className="mod-user">
          <Avatar text={org?.avatar ?? "?"} />
          <div>
            <div className="row-title">{c.title}</div>
            <div className="muted small">
              {org?.name} · {timeAgo(c.createdAt)}
            </div>
          </div>
        </div>
        <div className="mod-badges">
          <Badge tone="brand">{c.category}</Badge>
          <ModerationBadge type={c.moderationType} />
          <ChallengeStatusBadge status={c.status} />
        </div>
      </div>

      <div className="mod-body">
        <p className="mod-note">{c.description}</p>
        <div className="review-meta">
          <span>🎁 {c.rewardLabel}</span>
          <span>👥 Capacity {c.capacity}</span>
          <span>
            🗓️ {formatDate(c.startDate)} – {formatDate(c.endDate)}
          </span>
        </div>
      </div>

      {c.status === "PENDING_REVIEW" ? (
        <div className="mod-actions">
          <input
            className="input mod-note-input"
            placeholder="Reason (shown to organization on reject)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="mod-buttons">
            <Button
              variant="danger"
              onClick={() => store.rejectChallenge(c.id, note.trim() || "Rejected for safety reasons.")}
            >
              Reject
            </Button>
            <Button variant="success" onClick={() => store.approveChallenge(c.id, note.trim() || undefined)}>
              Approve & publish
            </Button>
          </div>
        </div>
      ) : (
        <div className="mod-resolved">
          {c.status === "APPROVED" ? "✅ Approved & live" : "⛔ Rejected"}
          {c.reviewerNote && <span className="reviewer-note"> · {c.reviewerNote}</span>}
        </div>
      )}
    </Card>
  );
}
