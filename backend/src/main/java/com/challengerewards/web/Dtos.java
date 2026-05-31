package com.challengerewards.web;

import com.challengerewards.domain.AppUser;
import com.challengerewards.domain.Challenge;
import com.challengerewards.domain.Coupon;
import com.challengerewards.domain.Enums.ModerationType;
import com.challengerewards.domain.Enums.Role;
import com.challengerewards.domain.Organization;
import com.challengerewards.domain.Participation;
import com.challengerewards.domain.Submission;
import java.util.List;

public final class Dtos {
    private Dtos() {}

    public record LoginRequest(String username, String password) {}

    public record RegisterRequest(String username, String password, Role role, String displayName) {}

    public record StateResponse(
            List<AppUser> users,
            List<Organization> organizations,
            List<Challenge> challenges,
            List<Participation> participations,
            List<Submission> submissions,
            List<Coupon> coupons) {}

    public record CreateChallengeRequest(
            String title,
            String description,
            String category,
            ModerationType moderationType,
            String rewardLabel,
            int points,
            int capacity,
            String startDate,
            String endDate) {}

    public record ReviewRequest(String reviewerNote) {}

    public record SubmitRequest(
            String challengeId,
            ModerationType type,
            String note,
            String proofImage) {}

    public record RedeemRequest(String code) {}

    public record ActionResult(boolean ok, String message) {}
}
