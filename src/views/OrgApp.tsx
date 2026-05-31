import { useMemo, useState } from "react";
import { useStore } from "../store";
import type { ModerationType, SubmissionStatus } from "../types";
import { MODERATION_LABELS } from "../types";
import { daysLeft, formatDate, timeAgo } from "../utils";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ChallengeStatusBadge,
  CouponBadge,
  EmptyState,
  ModerationBadge,
  Progress,
  StatCard,
  SubmissionBadge,
  Tabs,
} from "../components/ui";

type OrgTab = "dashboard" | "challenges" | "moderation" | "redeem";

export function OrgApp() {
  const [tab, setTab] = useState<OrgTab>("dashboard");
  const store = useStore();
  const pending = store.orgStats.pendingSubmissions;

  return (
    <div className="container">
      <Tabs<OrgTab>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "dashboard", label: "Dashboard" },
          {
            id: "challenges",
            label: "Challenges",
            count: store.db.challenges.filter((c) => c.orgId === store.currentOrgId).length,
          },
          { id: "moderation", label: "Moderation", count: pending },
          { id: "redeem", label: "Redeem" },
        ]}
      />
      {tab === "dashboard" && <Dashboard onGoModeration={() => setTab("moderation")} />}
      {tab === "challenges" && <ChallengesManager />}
      {tab === "moderation" && <Moderation />}
      {tab === "redeem" && <Redeem />}
    </div>
  );
}

function Dashboard({ onGoModeration }: { onGoModeration: () => void }) {
  const store = useStore();
  const s = store.orgStats;
  const org = store.db.organizations[0];

  return (
    <>
      <div className="profile-head">
        <Avatar text={org?.avatar ?? "?"} />
        <div>
          <h2>{org?.name} Dashboard</h2>
          <p className="muted">Track engagement and reward conversions in real time.</p>
        </div>
      </div>

      <div className="grid grid-stats">
        <StatCard icon="👥" label="Total participants" value={s.totalParticipants} />
        <StatCard icon="⏳" label="Pending submissions" value={s.pendingSubmissions} />
        <StatCard icon="✅" label="Approved submissions" value={s.approvedSubmissions} />
        <StatCard icon="🎟️" label="Redeemed coupons" value={s.redeemedCoupons} />
        <StatCard
          icon="🏬"
          label="Est. store visits"
          value={s.estimatedStoreVisits}
          hint="Redeemed + projected active coupons"
        />
        <StatCard icon="🔥" label="Active challenges" value={s.activeChallenges} />
      </div>

      {s.pendingSubmissions > 0 && (
        <Card className="cta-card">
          <div>
            <div className="row-title">You have {s.pendingSubmissions} submission(s) to review</div>
            <div className="muted small">Approve to automatically generate reward coupons.</div>
          </div>
          <Button onClick={onGoModeration}>Review now</Button>
        </Card>
      )}

      <h3 className="section-title">Recent coupons</h3>
      {store.db.coupons.length === 0 ? (
        <EmptyState
          icon="🎟️"
          title="No coupons issued yet"
          text="Approve submissions to start issuing reward coupons."
        />
      ) : (
        <div className="stack">
          {store.db.coupons.slice(0, 6).map((c) => {
            const user = store.db.users.find((u) => u.id === c.userId);
            return (
              <Card key={c.id} className="row-card">
                <div>
                  <div className="row-title">
                    {c.label} <span className="coupon-code inline">{c.code}</span>
                  </div>
                  <div className="muted small">
                    Issued to {user?.name} · {timeAgo(c.createdAt)}
                  </div>
                </div>
                <CouponBadge status={c.status} />
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function ChallengesManager() {
  const store = useStore();
  const [showForm, setShowForm] = useState(false);
  const orgChallenges = store.db.challenges.filter((c) => c.orgId === store.currentOrgId);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Your Challenges</h2>
          <p className="muted">Create and manage challenges for your community.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Close" : "+ New challenge"}
        </Button>
      </div>

      {showForm && <CreateChallengeForm onDone={() => setShowForm(false)} />}

      <div className="grid grid-challenges">
        {orgChallenges.map((ch) => {
          const joinedCount = store.db.participations.filter((p) => p.challengeId === ch.id).length;
          const slotsUsed = store.spotsTaken(ch.id);
          const subs = store.db.submissions.filter((s) => s.challengeId === ch.id);
          const left = daysLeft(ch.endDate);
          return (
            <Card key={ch.id} className="challenge-card">
              <div className="challenge-top">
                <Badge tone="brand">{ch.category}</Badge>
                <ChallengeStatusBadge status={ch.status} />
              </div>
              <h3>{ch.title}</h3>
              <p className="challenge-desc">{ch.description}</p>
              <div className="reward-row">
                <span className="gift">🎁</span>
                <span>{ch.rewardLabel}</span>
              </div>
              {ch.status === "REJECTED" && ch.reviewerNote && (
                <div className="reviewer-note">Platform: {ch.reviewerNote}</div>
              )}
              <div className="capacity-row">
                <div className="capacity-head">
                  <span className="muted small">
                    {slotsUsed}/{ch.capacity} reward slots · {joinedCount} joined · {subs.length} submissions
                  </span>
                  {left > 0 ? (
                    <Badge tone="neutral">{left}d left</Badge>
                  ) : (
                    <Badge tone="danger">Ended</Badge>
                  )}
                </div>
                <Progress value={(slotsUsed / ch.capacity) * 100} />
              </div>
              <div className="challenge-foot">
                <span className="muted small">
                  {ch.status === "PENDING_REVIEW"
                    ? "Hidden until approved"
                    : ch.status === "REJECTED"
                      ? "Not published"
                      : "Live for users"}
                </span>
                <ModerationBadge type={ch.moderationType} />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function CreateChallengeForm({ onDone }: { onDone: () => void }) {
  const store = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const in14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Fitness");
  const [moderationType, setModerationType] = useState<ModerationType>("STRAVA");
  const [rewardLabel, setRewardLabel] = useState("");
  const [capacity, setCapacity] = useState(50);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(in14);

  const valid = title.trim() && description.trim() && rewardLabel.trim() && capacity > 0;

  const create = () => {
    if (!valid) return;
    store.createChallenge({
      title: title.trim(),
      description: description.trim(),
      category,
      moderationType,
      rewardLabel: rewardLabel.trim(),
      capacity,
      startDate,
      endDate,
    });
    onDone();
  };

  return (
    <Card className="form-card">
      <h3>Create a new challenge</h3>
      <label className="field-label">Title</label>
      <input
        className="input"
        placeholder="e.g. Morning Run 5K"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <label className="field-label">Description</label>
      <textarea
        className="input"
        rows={3}
        placeholder="What should participants do?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="form-grid">
        <div>
          <label className="field-label">Category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Fitness</option>
            <option>Event</option>
            <option>Sustainability</option>
            <option>Food</option>
            <option>Community</option>
          </select>
        </div>
        <div>
          <label className="field-label">Moderation type</label>
          <select
            className="input"
            value={moderationType}
            onChange={(e) => setModerationType(e.target.value as ModerationType)}
          >
            {(Object.keys(MODERATION_LABELS) as ModerationType[]).map((t) => (
              <option key={t} value={t}>
                {MODERATION_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="field-label">Reward</label>
      <input
        className="input"
        placeholder="e.g. Free Latte"
        value={rewardLabel}
        onChange={(e) => setRewardLabel(e.target.value)}
      />
      <label className="field-label">Reward slots (max winners)</label>
      <input
        className="input"
        type="number"
        min={1}
        value={capacity}
        onChange={(e) => setCapacity(Number(e.target.value))}
      />
      <div className="form-grid">
        <div>
          <label className="field-label">Start date</label>
          <input
            className="input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">End date</label>
          <input
            className="input"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <div className="review-notice">
        🛡️ New challenges are reviewed by the platform for safety before they go live to users.
      </div>
      <div className="form-actions">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={create} disabled={!valid}>
          Submit for review
        </Button>
      </div>
    </Card>
  );
}

function Moderation() {
  const store = useStore();
  const [filter, setFilter] = useState<SubmissionStatus | "ALL">("PENDING");

  const orgChallengeIds = useMemo(
    () =>
      new Set(
        store.db.challenges.filter((c) => c.orgId === store.currentOrgId).map((c) => c.id),
      ),
    [store.db],
  );

  const subs = store.db.submissions
    .filter((s) => orgChallengeIds.has(s.challengeId))
    .filter((s) => (filter === "ALL" ? true : s.status === filter))
    .sort((a, b) => b.createdAt - a.createdAt);

  const counts = useMemo(() => {
    const all = store.db.submissions.filter((s) => orgChallengeIds.has(s.challengeId));
    return {
      ALL: all.length,
      PENDING: all.filter((s) => s.status === "PENDING").length,
      APPROVED: all.filter((s) => s.status === "APPROVED").length,
      REJECTED: all.filter((s) => s.status === "REJECTED").length,
    };
  }, [store.db, orgChallengeIds]);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Submission Moderation</h2>
          <p className="muted">Approve to issue a coupon automatically, or reject with a note.</p>
        </div>
      </div>

      <Tabs<SubmissionStatus | "ALL">
        active={filter}
        onChange={setFilter}
        tabs={[
          { id: "PENDING", label: "Pending", count: counts.PENDING },
          { id: "APPROVED", label: "Approved", count: counts.APPROVED },
          { id: "REJECTED", label: "Rejected", count: counts.REJECTED },
          { id: "ALL", label: "All", count: counts.ALL },
        ]}
      />

      {subs.length === 0 ? (
        <EmptyState icon="🗂️" title="Nothing here" text="No submissions match this filter." />
      ) : (
        <div className="stack">
          {subs.map((s) => (
            <ModerationCard key={s.id} submissionId={s.id} />
          ))}
        </div>
      )}
    </>
  );
}

function ModerationCard({ submissionId }: { submissionId: string }) {
  const store = useStore();
  const s = store.db.submissions.find((x) => x.id === submissionId);
  const [note, setNote] = useState("");
  if (!s) return null;
  const challenge = store.db.challenges.find((c) => c.id === s.challengeId);
  const user = store.db.users.find((u) => u.id === s.userId);

  return (
    <Card className="mod-card">
      <div className="mod-head">
        <div className="mod-user">
          <Avatar text={user?.avatar ?? "?"} tone="user" />
          <div>
            <div className="row-title">{user?.name}</div>
            <div className="muted small">
              {challenge?.title} · {timeAgo(s.createdAt)}
            </div>
          </div>
        </div>
        <div className="mod-badges">
          <ModerationBadge type={s.type} />
          <SubmissionBadge status={s.status} />
        </div>
      </div>

      <div className="mod-body">
        <p className="mod-note">{s.note || <span className="muted">No note provided.</span>}</p>
        {s.proofImage && <img src={s.proofImage} alt="proof" className="proof-preview" />}
        {!s.proofImage && (
          <div className="proof-placeholder">
            {s.type === "STRAVA" && "🏃 Strava activity attached (demo)"}
            {s.type === "CHECKIN" && "📍 Location check-in confirmed (demo)"}
            {s.type === "MANUAL" && "📷 No image attached"}
          </div>
        )}
      </div>

      {s.status === "PENDING" ? (
        <div className="mod-actions">
          <input
            className="input mod-note-input"
            placeholder="Optional note to participant..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="mod-buttons">
            <Button
              variant="danger"
              onClick={() => store.rejectSubmission(s.id, note.trim() || undefined)}
            >
              Reject
            </Button>
            <Button
              variant="success"
              onClick={() => store.approveSubmission(s.id, note.trim() || undefined)}
            >
              Approve & issue coupon
            </Button>
          </div>
        </div>
      ) : (
        <div className="mod-resolved">
          {s.status === "APPROVED" ? "✅ Approved" : "❌ Rejected"}
          {s.reviewerNote && <span className="reviewer-note"> · {s.reviewerNote}</span>}
        </div>
      )}
    </Card>
  );
}

function Redeem() {
  const store = useStore();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const orgCoupons = store.db.coupons.filter((c) => c.orgId === store.currentOrgId);

  const handleRedeem = async () => {
    if (!code.trim()) return;
    const res = await store.redeemCoupon(code);
    setResult({ ok: res.ok, message: res.message });
    if (res.ok) setCode("");
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Redeem Coupon</h2>
          <p className="muted">Scan the QR or enter the promo code presented by the customer.</p>
        </div>
      </div>

      <Card className="redeem-card">
        <div className="redeem-scan">🔳 Scan QR or type code</div>
        <div className="redeem-input-row">
          <input
            className="input redeem-input"
            placeholder="e.g. ABCD-1234"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
          />
          <Button onClick={handleRedeem} disabled={!code.trim()}>
            Redeem
          </Button>
        </div>
        {result && (
          <div className={`redeem-result ${result.ok ? "ok" : "err"}`}>
            {result.ok ? "✅ " : "⚠️ "}
            {result.message}
          </div>
        )}
        <p className="muted small">
          Tip: open a coupon in the User → My Profile tab to grab a valid code.
        </p>
      </Card>

      <h3 className="section-title">Issued coupons</h3>
      {orgCoupons.length === 0 ? (
        <EmptyState
          icon="🎟️"
          title="No coupons yet"
          text="Approve submissions in Moderation to issue coupons."
        />
      ) : (
        <div className="stack">
          {orgCoupons.map((c) => {
            const user = store.db.users.find((u) => u.id === c.userId);
            return (
              <Card key={c.id} className="row-card">
                <div>
                  <div className="row-title">
                    {c.label} <span className="coupon-code inline">{c.code}</span>
                  </div>
                  <div className="muted small">
                    {user?.name} · exp {formatDate(c.expiresAt)}
                    {c.redeemedAt ? ` · redeemed ${timeAgo(c.redeemedAt)}` : ""}
                  </div>
                </div>
                <CouponBadge status={c.status} />
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
