package com.challengerewards.domain;

public final class Enums {
    private Enums() {}

    public enum ModerationType { STRAVA, CHECKIN, MANUAL }

    public enum SubmissionStatus { PENDING, APPROVED, REJECTED }

    public enum CouponStatus { ACTIVE, REDEEMED, EXPIRED }

    public enum ChallengeStatus { PENDING_REVIEW, APPROVED, REJECTED }

    public enum Role { USER, ORG, ADMIN }
}
