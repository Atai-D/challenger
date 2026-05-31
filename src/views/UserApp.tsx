import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useStore } from "../store";
import type { Coupon, ModerationType } from "../types";
import { MODERATION_HINTS, MODERATION_LABELS } from "../types";
import { daysLeft, fileToDataUrl, formatDate, timeAgo } from "../utils";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CouponBadge,
  EmptyState,
  ModerationBadge,
  Progress,
  StatCard,
  SubmissionBadge,
  Tabs,
} from "../components/ui";

type UserTab = "challenges" | "profile";

export function UserApp() {
  const [tab, setTab] = useState<UserTab>("challenges");
  const [openChallenge, setOpenChallenge] = useState<string | null>(null);
  const store = useStore();

  if (openChallenge) {
    return (
      <ChallengeDetail
        challengeId={openChallenge}
        onBack={() => setOpenChallenge(null)}
      />
    );
  }

  return (
    <div className="container">
      <Tabs<UserTab>
        active={tab}
        onChange={setTab}
        tabs={[
          {
            id: "challenges",
            label: "Challenges",
            count: store.db.challenges.filter((c) => c.status === "APPROVED").length,
          },
          { id: "profile", label: "My Profile", count: store.userStats.activeCoupons },
        ]}
      />
      {tab === "challenges" ? (
        <ChallengeList onOpen={setOpenChallenge} />
      ) : (
        <UserProfile />
      )}
    </div>
  );
}

function ChallengeList({ onOpen }: { onOpen: (id: string) => void }) {
  const store = useStore();
  const org = store.db.organizations[0];
  const challenges = store.db.challenges.filter((c) => c.status === "APPROVED");

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Discover Challenges</h2>
          <p className="muted">Join, complete, and earn rewards from local partners.</p>
        </div>
      </div>
      <div className="grid grid-challenges">
        {challenges.map((ch) => {
          const joined = store.isJoined(ch.id);
          const taken = store.spotsTaken(ch.id);
          const slotsLeft = store.spotsLeft(ch.id);
          const full = slotsLeft <= 0;
          const daysRemaining = daysLeft(ch.endDate);
          const fillPct = (taken / ch.capacity) * 100;
          return (
            <Card key={ch.id} className="challenge-card" onClick={() => onOpen(ch.id)}>
              <div className="challenge-top">
                <Badge tone="brand">{ch.category}</Badge>
                {daysRemaining > 0 ? (
                  <Badge tone="neutral">{daysRemaining}d left</Badge>
                ) : (
                  <Badge tone="danger">Ended</Badge>
                )}
              </div>
              <h3>{ch.title}</h3>
              <p className="challenge-desc">{ch.description}</p>
              <div className="reward-row">
                <span className="gift">🎁</span>
                <span>{ch.rewardLabel}</span>
              </div>
              <div className="capacity-row">
                <div className="capacity-head">
                  <span className="muted small">
                    {taken}/{ch.capacity} reward slots
                  </span>
                  {full ? (
                    <Badge tone="danger">Rewards gone</Badge>
                  ) : (
                    <Badge tone="success">{slotsLeft} left</Badge>
                  )}
                </div>
                <Progress value={fillPct} />
              </div>
              <div className="challenge-foot">
                <span className="muted small">by {org?.name}</span>
                <ModerationBadge type={ch.moderationType} />
              </div>
              {joined && <div className="joined-flag">✓ Joined</div>}
            </Card>
          );
        })}
      </div>
    </>
  );
}

function ChallengeDetail({
  challengeId,
  onBack,
}: {
  challengeId: string;
  onBack: () => void;
}) {
  const store = useStore();
  const challenge = store.db.challenges.find((c) => c.id === challengeId);
  const [showSubmit, setShowSubmit] = useState(false);

  if (!challenge) {
    return (
      <div className="container">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <EmptyState icon="🔍" title="Challenge not found" text="It may have been removed." />
      </div>
    );
  }

  const joined = store.isJoined(challenge.id);
  const taken = store.spotsTaken(challenge.id);
  const slotsLeft = store.spotsLeft(challenge.id);
  const mySubs = store.db.submissions.filter(
    (s) => s.challengeId === challenge.id && s.userId === store.currentUserId,
  );
  const hasSubmitted = mySubs.length > 0;
  const rewardsFull = slotsLeft <= 0 && !hasSubmitted;
  const left = daysLeft(challenge.endDate);

  return (
    <div className="container narrow">
      <Button variant="ghost" onClick={onBack}>
        ← Back to challenges
      </Button>
      <Card className="detail-hero">
        <div className="challenge-top">
          <Badge tone="brand">{challenge.category}</Badge>
          <ModerationBadge type={challenge.moderationType} />
        </div>
        <h1>{challenge.title}</h1>
        <p>{challenge.description}</p>
        <div className="detail-meta">
          <div>
            <span className="muted small">Reward</span>
            <div className="meta-strong">🎁 {challenge.rewardLabel}</div>
          </div>
          <div>
            <span className="muted small">Window</span>
            <div className="meta-strong">
              {formatDate(challenge.startDate)} – {formatDate(challenge.endDate)}
            </div>
          </div>
          <div>
            <span className="muted small">Reward slots</span>
            <div className="meta-strong">
              {taken}/{challenge.capacity}
            </div>
          </div>
        </div>
        <div className="capacity-row detail-capacity">
          <div className="capacity-head">
            <span className="muted small">
              {taken} of {challenge.capacity} reward slots claimed
            </span>
            {slotsLeft > 0 ? (
              <Badge tone="success">{slotsLeft} left</Badge>
            ) : (
              <Badge tone="danger">All rewards claimed</Badge>
            )}
          </div>
          <Progress value={(taken / challenge.capacity) * 100} />
        </div>
        <div className="detail-actions">
          {!joined ? (
            <Button onClick={() => store.joinChallenge(challenge.id)}>Participate</Button>
          ) : (
            <>
              <Badge tone="success">You're in! ✓</Badge>
              <Button onClick={() => setShowSubmit((v) => !v)} disabled={rewardsFull}>
                {rewardsFull ? "Reward slots full" : showSubmit ? "Close form" : "Submit proof"}
              </Button>
              <Button variant="ghost" onClick={() => store.leaveChallenge(challenge.id)}>
                Leave
              </Button>
            </>
          )}
          {left <= 0 && <Badge tone="danger">Challenge ended</Badge>}
        </div>
        {joined && rewardsFull && (
          <p className="muted small hint">
            All {challenge.capacity} reward slots have been claimed, so new submissions are closed.
          </p>
        )}
      </Card>

      {joined && showSubmit && !rewardsFull && (
        <SubmitForm
          challengeId={challenge.id}
          proofType={challenge.moderationType}
          onDone={() => setShowSubmit(false)}
        />
      )}

      <h3 className="section-title">Your submissions</h3>
      {mySubs.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No submissions yet"
          text="Submit your proof of completion to earn the reward."
        />
      ) : (
        <div className="stack">
          {mySubs.map((s) => (
            <Card key={s.id} className="row-card">
              <div>
                <div className="row-title">{MODERATION_LABELS[s.type]}</div>
                <div className="muted small">{s.note}</div>
                <div className="muted small">{timeAgo(s.createdAt)}</div>
                {s.reviewerNote && (
                  <div className="reviewer-note">Reviewer: {s.reviewerNote}</div>
                )}
              </div>
              <SubmissionBadge status={s.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SubmitForm({
  challengeId,
  proofType,
  onDone,
}: {
  challengeId: string;
  proofType: ModerationType;
  onDone: () => void;
}) {
  const store = useStore();
  const [note, setNote] = useState("");
  const [proofImage, setProofImage] = useState<string | undefined>();

  const handleFile = async (file?: File) => {
    if (!file) return;
    const url = await fileToDataUrl(file);
    setProofImage(url);
  };

  const submit = () => {
    if (!note.trim() && !proofImage) return;
    store.submitProof({ challengeId, note: note.trim(), proofImage });
    onDone();
  };

  return (
    <Card className="form-card">
      <h3>Submit proof of completion</h3>
      <label className="field-label">Required proof</label>
      <div className="proof-type">
        <ModerationBadge type={proofType} />
        <span className="muted small">set by the organizer</span>
      </div>
      <p className="muted small hint">{MODERATION_HINTS[proofType]}</p>
      <label className="field-label">Note</label>
      <textarea
        className="input"
        rows={3}
        placeholder="Tell the organizer what you did..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <label className="field-label">Attach screenshot / photo (optional)</label>
      <input
        type="file"
        accept="image/*"
        className="input"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {proofImage && (
        <img src={proofImage} alt="proof preview" className="proof-preview" />
      )}
      <div className="form-actions">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!note.trim() && !proofImage}>
          Submit for review
        </Button>
      </div>
    </Card>
  );
}

function UserProfile() {
  const store = useStore();
  const user = store.db.users.find((u) => u.id === store.currentUserId);
  const stats = store.userStats;
  const coupons = store.db.coupons.filter((c) => c.userId === store.currentUserId);
  const mySubs = store.db.submissions.filter((s) => s.userId === store.currentUserId);
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);

  const joinedChallenges = useMemo(() => {
    const ids = new Set(
      store.db.participations
        .filter((p) => p.userId === store.currentUserId)
        .map((p) => p.challengeId),
    );
    return store.db.challenges.filter((c) => ids.has(c.id));
  }, [store.db]);

  return (
    <>
      <div className="profile-head">
        <Avatar text={user?.avatar ?? "?"} tone="user" />
        <div>
          <h2>{user?.name}</h2>
          <p className="muted">Challenge hunter · {stats.activeCoupons} active coupons</p>
        </div>
      </div>

      <div className="grid grid-stats">
        <StatCard icon="🎯" label="Challenges joined" value={stats.joined} />
        <StatCard icon="✅" label="Approved proofs" value={stats.approved} />
        <StatCard icon="⏳" label="Pending review" value={stats.pending} />
        <StatCard icon="🎟️" label="Active coupons" value={stats.activeCoupons} />
        <StatCard icon="📨" label="Total submissions" value={stats.submitted} />
        <StatCard icon="🏅" label="Rewards earned" value={stats.approved} />
      </div>

      <h3 className="section-title">My coupons</h3>
      {coupons.length === 0 ? (
        <EmptyState
          icon="🎟️"
          title="No coupons yet"
          text="Complete a challenge and get approved to earn coupons."
        />
      ) : (
        <div className="grid grid-coupons">
          {coupons.map((c) => {
            const ch = store.db.challenges.find((x) => x.id === c.challengeId);
            return (
              <Card key={c.id} className="coupon-card" onClick={() => setActiveCoupon(c)}>
                <div className="coupon-perf coupon-left">
                  <span className="coupon-gift">🎁</span>
                </div>
                <div className="coupon-main">
                  <div className="coupon-label">{c.label}</div>
                  <div className="muted small">{ch?.title}</div>
                  <div className="coupon-code">{c.code}</div>
                  <div className="coupon-foot">
                    <CouponBadge status={c.status} />
                    <span className="muted small">exp {formatDate(c.expiresAt)}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <h3 className="section-title">Submission history</h3>
      {mySubs.length === 0 ? (
        <EmptyState icon="📭" title="Nothing submitted" text="Your proofs will show up here." />
      ) : (
        <div className="stack">
          {mySubs.map((s) => {
            const ch = store.db.challenges.find((x) => x.id === s.challengeId);
            return (
              <Card key={s.id} className="row-card">
                <div>
                  <div className="row-title">{ch?.title}</div>
                  <div className="muted small">
                    {MODERATION_LABELS[s.type]} · {timeAgo(s.createdAt)}
                  </div>
                </div>
                <SubmissionBadge status={s.status} />
              </Card>
            );
          })}
        </div>
      )}

      {joinedChallenges.length > 0 && (
        <>
          <h3 className="section-title">Active goals</h3>
          <div className="stack">
            {joinedChallenges.map((ch) => {
              const left = daysLeft(ch.endDate);
              const total = Math.max(
                1,
                Math.ceil(
                  (new Date(ch.endDate).getTime() - new Date(ch.startDate).getTime()) /
                    (24 * 60 * 60 * 1000),
                ),
              );
              const elapsed = total - Math.max(0, left);
              return (
                <Card key={ch.id} className="goal-card">
                  <div className="goal-head">
                    <span className="row-title">{ch.title}</span>
                    <span className="muted small">{left > 0 ? `${left}d left` : "Ended"}</span>
                  </div>
                  <Progress value={(elapsed / total) * 100} />
                </Card>
              );
            })}
          </div>
        </>
      )}

      {activeCoupon && (
        <CouponModal coupon={activeCoupon} onClose={() => setActiveCoupon(null)} />
      )}
    </>
  );
}

function CouponModal({ coupon, onClose }: { coupon: Coupon; onClose: () => void }) {
  const store = useStore();
  const ch = store.db.challenges.find((x) => x.id === coupon.challengeId);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <div className="modal-gift">🎁</div>
        <h2>{coupon.label}</h2>
        <p className="muted">{ch?.title}</p>
        <div className="qr-wrap">
          <QRCodeSVG value={coupon.code} size={180} level="M" />
        </div>
        <div className="coupon-code big">{coupon.code}</div>
        <CouponBadge status={coupon.status} />
        <p className="muted small">
          Show this QR or code at {store.db.organizations[0]?.name} to redeem. Expires{" "}
          {formatDate(coupon.expiresAt)}.
        </p>
      </div>
    </div>
  );
}
