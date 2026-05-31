import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, setToken, getToken, type ActionResult } from "./api";
import type { Challenge, Database, Role, Session } from "./types";

const EMPTY_DB: Database = {
  users: [],
  organizations: [],
  challenges: [],
  participations: [],
  submissions: [],
  coupons: [],
};

export interface OrgStats {
  totalParticipants: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  redeemedCoupons: number;
  estimatedStoreVisits: number;
  activeChallenges: number;
}

export interface UserStats {
  joined: number;
  submitted: number;
  approved: number;
  pending: number;
  points: number;
  activeCoupons: number;
}

export interface AdminStats {
  pendingReview: number;
  approvedChallenges: number;
  rejectedChallenges: number;
  organizations: number;
}

interface StoreValue {
  db: Database;
  session: Session | null;
  booting: boolean;
  authError: string | null;
  currentUserId: string;
  currentOrgId: string;
  login: (username: string, password: string) => Promise<void>;
  register: (input: {
    username: string;
    password: string;
    role: Role;
    displayName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<void>;
  leaveChallenge: (challengeId: string) => Promise<void>;
  submitProof: (input: {
    challengeId: string;
    note: string;
    proofImage?: string;
  }) => Promise<void>;
  createChallenge: (
    input: Omit<Challenge, "id" | "orgId" | "createdAt" | "status">,
  ) => Promise<void>;
  approveSubmission: (submissionId: string, reviewerNote?: string) => Promise<void>;
  rejectSubmission: (submissionId: string, reviewerNote?: string) => Promise<void>;
  approveChallenge: (challengeId: string, reviewerNote?: string) => Promise<void>;
  rejectChallenge: (challengeId: string, reviewerNote?: string) => Promise<void>;
  redeemCoupon: (code: string) => Promise<ActionResult>;
  reset: () => Promise<void>;
  isJoined: (challengeId: string) => boolean;
  spotsTaken: (challengeId: string) => number;
  spotsLeft: (challengeId: string) => number;
  orgStats: OrgStats;
  userStats: UserStats;
  adminStats: AdminStats;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(EMPTY_DB);
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const currentUserId = session?.role === "USER" ? session.subjectId ?? "" : "";
  const currentOrgId = session?.role === "ORG" ? session.subjectId ?? "" : "";

  const refresh = useCallback(async () => {
    const state = await api.getState();
    setDb(state);
  }, []);

  // Restore an existing token on first load.
  useEffect(() => {
    (async () => {
      const token = getToken();
      if (token) {
        try {
          const me = await api.me();
          setSession(me);
          await refresh();
        } catch {
          setToken(null);
          setSession(null);
        }
      }
      setBooting(false);
    })();
  }, [refresh]);

  const login = useCallback(
    async (username: string, password: string) => {
      setAuthError(null);
      try {
        const s = await api.login(username, password);
        setToken(s.token);
        setSession(s);
        await refresh();
      } catch (e) {
        setAuthError(e instanceof Error ? e.message : "Login failed");
        throw e;
      }
    },
    [refresh],
  );

  const register = useCallback(
    async (input: { username: string; password: string; role: Role; displayName: string }) => {
      setAuthError(null);
      try {
        const s = await api.register(input);
        setToken(s.token);
        setSession(s);
        await refresh();
      } catch (e) {
        setAuthError(e instanceof Error ? e.message : "Registration failed");
        throw e;
      }
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore network errors on logout
    }
    setToken(null);
    setSession(null);
    setDb(EMPTY_DB);
    setAuthError(null);
  }, []);

  const joinChallenge = useCallback(async (challengeId: string) => {
    setDb(await api.join(challengeId));
  }, []);

  const leaveChallenge = useCallback(async (challengeId: string) => {
    setDb(await api.leave(challengeId));
  }, []);

  const submitProof = useCallback(
    async (input: { challengeId: string; note: string; proofImage?: string }) => {
      setDb(await api.submit(input));
    },
    [],
  );

  const createChallenge = useCallback(
    async (input: Omit<Challenge, "id" | "orgId" | "createdAt" | "status">) => {
      setDb(
        await api.createChallenge({
          title: input.title,
          description: input.description,
          category: input.category,
          moderationType: input.moderationType,
          rewardLabel: input.rewardLabel,
          points: input.points,
          capacity: input.capacity,
          startDate: input.startDate,
          endDate: input.endDate,
        }),
      );
    },
    [],
  );

  const approveSubmission = useCallback(async (submissionId: string, reviewerNote?: string) => {
    setDb(await api.approveSubmission(submissionId, reviewerNote));
  }, []);

  const rejectSubmission = useCallback(async (submissionId: string, reviewerNote?: string) => {
    setDb(await api.rejectSubmission(submissionId, reviewerNote));
  }, []);

  const approveChallenge = useCallback(async (challengeId: string, reviewerNote?: string) => {
    setDb(await api.approveChallenge(challengeId, reviewerNote));
  }, []);

  const rejectChallenge = useCallback(async (challengeId: string, reviewerNote?: string) => {
    setDb(await api.rejectChallenge(challengeId, reviewerNote));
  }, []);

  const redeemCoupon = useCallback(
    async (code: string): Promise<ActionResult> => {
      const result = await api.redeem(code);
      await refresh();
      return result;
    },
    [refresh],
  );

  const reset = useCallback(async () => {
    setDb(await api.reset());
  }, []);

  const isJoined = useCallback(
    (challengeId: string) =>
      db.participations.some((p) => p.challengeId === challengeId && p.userId === currentUserId),
    [db.participations, currentUserId],
  );

  // A reward slot is consumed per distinct participant who submits proof.
  const spotsTaken = useCallback(
    (challengeId: string) =>
      new Set(
        db.submissions.filter((s) => s.challengeId === challengeId).map((s) => s.userId),
      ).size,
    [db.submissions],
  );

  const spotsLeft = useCallback(
    (challengeId: string) => {
      const challenge = db.challenges.find((c) => c.id === challengeId);
      if (!challenge) return 0;
      const taken = new Set(
        db.submissions.filter((s) => s.challengeId === challengeId).map((s) => s.userId),
      ).size;
      return Math.max(0, challenge.capacity - taken);
    },
    [db.challenges, db.submissions],
  );

  const orgStats = useMemo<OrgStats>(() => {
    const orgChallengeIds = new Set(
      db.challenges.filter((c) => c.orgId === currentOrgId).map((c) => c.id),
    );
    const participants = new Set(
      db.participations.filter((p) => orgChallengeIds.has(p.challengeId)).map((p) => p.userId),
    );
    const orgSubs = db.submissions.filter((s) => orgChallengeIds.has(s.challengeId));
    const pending = orgSubs.filter((s) => s.status === "PENDING").length;
    const approved = orgSubs.filter((s) => s.status === "APPROVED").length;
    const orgCoupons = db.coupons.filter((c) => c.orgId === currentOrgId);
    const redeemed = orgCoupons.filter((c) => c.status === "REDEEMED").length;
    const today = new Date().toISOString().slice(0, 10);
    const active = db.challenges.filter(
      (c) => c.orgId === currentOrgId && c.status === "APPROVED" && c.endDate >= today,
    ).length;
    const activeCoupons = orgCoupons.filter((c) => c.status === "ACTIVE").length;
    const estimated = redeemed + Math.round(activeCoupons * 0.6);
    return {
      totalParticipants: participants.size,
      pendingSubmissions: pending,
      approvedSubmissions: approved,
      redeemedCoupons: redeemed,
      estimatedStoreVisits: estimated,
      activeChallenges: active,
    };
  }, [db, currentOrgId]);

  const userStats = useMemo<UserStats>(() => {
    const joined = db.participations.filter((p) => p.userId === currentUserId).length;
    const mySubs = db.submissions.filter((s) => s.userId === currentUserId);
    const approved = mySubs.filter((s) => s.status === "APPROVED");
    const pending = mySubs.filter((s) => s.status === "PENDING").length;
    const points = approved.reduce((sum, s) => {
      const ch = db.challenges.find((c) => c.id === s.challengeId);
      return sum + (ch?.points ?? 0);
    }, 0);
    const activeCoupons = db.coupons.filter(
      (c) => c.userId === currentUserId && c.status === "ACTIVE",
    ).length;
    return { joined, submitted: mySubs.length, approved: approved.length, pending, points, activeCoupons };
  }, [db, currentUserId]);

  const adminStats = useMemo<AdminStats>(() => {
    const pendingReview = db.challenges.filter((c) => c.status === "PENDING_REVIEW").length;
    const approvedChallenges = db.challenges.filter((c) => c.status === "APPROVED").length;
    const rejectedChallenges = db.challenges.filter((c) => c.status === "REJECTED").length;
    return {
      pendingReview,
      approvedChallenges,
      rejectedChallenges,
      organizations: db.organizations.length,
    };
  }, [db]);

  const value = useMemo<StoreValue>(
    () => ({
      db,
      session,
      booting,
      authError,
      currentUserId,
      currentOrgId,
      login,
      register,
      logout,
      joinChallenge,
      leaveChallenge,
      submitProof,
      createChallenge,
      approveSubmission,
      rejectSubmission,
      approveChallenge,
      rejectChallenge,
      redeemCoupon,
      reset,
      isJoined,
      spotsTaken,
      spotsLeft,
      orgStats,
      userStats,
      adminStats,
    }),
    [
      db,
      session,
      booting,
      authError,
      currentUserId,
      currentOrgId,
      login,
      register,
      logout,
      joinChallenge,
      leaveChallenge,
      submitProof,
      createChallenge,
      approveSubmission,
      rejectSubmission,
      approveChallenge,
      rejectChallenge,
      redeemCoupon,
      reset,
      isJoined,
      spotsTaken,
      spotsLeft,
      orgStats,
      userStats,
      adminStats,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
