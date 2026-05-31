package com.challengerewards.web;

import com.challengerewards.domain.Challenge;
import com.challengerewards.domain.Coupon;
import com.challengerewards.domain.Enums.ChallengeStatus;
import com.challengerewards.domain.Enums.CouponStatus;
import com.challengerewards.domain.Enums.Role;
import com.challengerewards.domain.Enums.SubmissionStatus;
import com.challengerewards.domain.Participation;
import com.challengerewards.domain.Submission;
import com.challengerewards.repo.ChallengeRepo;
import com.challengerewards.repo.CouponRepo;
import com.challengerewards.repo.OrgRepo;
import com.challengerewards.repo.ParticipationRepo;
import com.challengerewards.repo.SubmissionRepo;
import com.challengerewards.repo.UserRepo;
import com.challengerewards.service.AuthService;
import com.challengerewards.service.AuthService.Session;
import com.challengerewards.service.SeedService;
import com.challengerewards.web.Dtos.ActionResult;
import com.challengerewards.web.Dtos.CreateChallengeRequest;
import com.challengerewards.web.Dtos.RedeemRequest;
import com.challengerewards.web.Dtos.ReviewRequest;
import com.challengerewards.web.Dtos.StateResponse;
import com.challengerewards.web.Dtos.SubmitRequest;
import java.security.SecureRandom;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class ApiController {

    private static final long DAY = 24L * 60 * 60 * 1000;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepo users;
    private final OrgRepo orgs;
    private final ChallengeRepo challenges;
    private final ParticipationRepo participations;
    private final SubmissionRepo submissions;
    private final CouponRepo coupons;
    private final SeedService seedService;
    private final AuthService auth;

    public ApiController(UserRepo users, OrgRepo orgs, ChallengeRepo challenges,
                         ParticipationRepo participations, SubmissionRepo submissions,
                         CouponRepo coupons, SeedService seedService, AuthService auth) {
        this.users = users;
        this.orgs = orgs;
        this.challenges = challenges;
        this.participations = participations;
        this.submissions = submissions;
        this.coupons = coupons;
        this.seedService = seedService;
        this.auth = auth;
    }

    private Session require(String authHeader, Role role) {
        return auth.require(AuthController.token(authHeader), role);
    }

    private Session requireAny(String authHeader) {
        return auth.requireAny(AuthController.token(authHeader));
    }

    @GetMapping("/state")
    public StateResponse state(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireAny(authHeader);
        return snapshot();
    }

    private StateResponse snapshot() {
        return new StateResponse(
                users.findAll(),
                orgs.findAll(),
                challenges.findAll(),
                participations.findAll(),
                submissions.findAll(),
                coupons.findAll());
    }

    @PostMapping("/reset")
    public StateResponse reset(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireAny(authHeader);
        seedService.seed();
        return snapshot();
    }

    @PostMapping("/challenges")
    public StateResponse createChallenge(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                         @RequestBody CreateChallengeRequest req) {
        Session s = require(authHeader, Role.ORG);
        Challenge c = new Challenge();
        c.id = uid("ch");
        c.orgId = s.subjectId();
        c.title = req.title();
        c.description = req.description();
        c.category = req.category();
        c.moderationType = req.moderationType();
        c.rewardLabel = req.rewardLabel();
        c.points = req.points();
        c.capacity = req.capacity();
        c.startDate = req.startDate();
        c.endDate = req.endDate();
        c.createdAt = System.currentTimeMillis();
        c.status = ChallengeStatus.PENDING_REVIEW;
        challenges.save(c);
        return snapshot();
    }

    @PostMapping("/challenges/{id}/approve")
    public StateResponse approveChallenge(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                          @PathVariable String id, @RequestBody(required = false) ReviewRequest req) {
        require(authHeader, Role.ADMIN);
        Challenge c = challenges.findById(id).orElseThrow(this::notFound);
        c.status = ChallengeStatus.APPROVED;
        c.reviewedAt = System.currentTimeMillis();
        c.reviewerNote = req == null ? null : req.reviewerNote();
        challenges.save(c);
        return snapshot();
    }

    @PostMapping("/challenges/{id}/reject")
    public StateResponse rejectChallenge(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                         @PathVariable String id, @RequestBody(required = false) ReviewRequest req) {
        require(authHeader, Role.ADMIN);
        Challenge c = challenges.findById(id).orElseThrow(this::notFound);
        c.status = ChallengeStatus.REJECTED;
        c.reviewedAt = System.currentTimeMillis();
        c.reviewerNote = req == null ? null : req.reviewerNote();
        challenges.save(c);
        return snapshot();
    }

    @PostMapping("/challenges/{id}/join")
    public StateResponse join(@RequestHeader(value = "Authorization", required = false) String authHeader,
                              @PathVariable String id) {
        Session s = require(authHeader, Role.USER);
        String userId = s.subjectId();
        challenges.findById(id).orElseThrow(this::notFound);
        // Joining is unlimited — capacity only limits reward submissions.
        boolean already = !participations.findByChallengeIdAndUserId(id, userId).isEmpty();
        if (!already) {
            Participation p = new Participation();
            p.id = uid("p");
            p.challengeId = id;
            p.userId = userId;
            p.joinedAt = System.currentTimeMillis();
            participations.save(p);
        }
        return snapshot();
    }

    @PostMapping("/challenges/{id}/leave")
    public StateResponse leave(@RequestHeader(value = "Authorization", required = false) String authHeader,
                               @PathVariable String id) {
        Session s = require(authHeader, Role.USER);
        List<Participation> mine = participations.findByChallengeIdAndUserId(id, s.subjectId());
        participations.deleteAll(mine);
        return snapshot();
    }

    @PostMapping("/submissions")
    public ResponseEntity<StateResponse> submit(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                                 @RequestBody SubmitRequest req) {
        Session s = require(authHeader, Role.USER);
        String userId = s.subjectId();
        Challenge c = challenges.findById(req.challengeId()).orElseThrow(this::notFound);

        // A reward slot is consumed per distinct participant who submits.
        List<Submission> existing = submissions.findByChallengeId(req.challengeId());
        boolean alreadySubmitted = existing.stream().anyMatch(x -> userId.equals(x.userId));
        long submitters = existing.stream().map(x -> x.userId).distinct().count();
        if (!alreadySubmitted && submitters >= c.capacity) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(snapshot());
        }

        // Ensure the user is recorded as a participant (no capacity limit on joining).
        boolean joined = !participations.findByChallengeIdAndUserId(req.challengeId(), userId).isEmpty();
        if (!joined) {
            Participation p = new Participation();
            p.id = uid("p");
            p.challengeId = req.challengeId();
            p.userId = userId;
            p.joinedAt = System.currentTimeMillis();
            participations.save(p);
        }

        Submission sub = new Submission();
        sub.id = uid("s");
        sub.challengeId = req.challengeId();
        sub.userId = userId;
        sub.type = c.moderationType; // proof type is fixed by the challenge
        sub.note = req.note();
        sub.proofImage = req.proofImage();
        sub.status = SubmissionStatus.PENDING;
        sub.createdAt = System.currentTimeMillis();
        submissions.save(sub);
        return ResponseEntity.ok(snapshot());
    }

    @PostMapping("/submissions/{id}/approve")
    public StateResponse approveSubmission(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                           @PathVariable String id, @RequestBody(required = false) ReviewRequest req) {
        Session session = require(authHeader, Role.ORG);
        Submission s = submissions.findById(id).orElseThrow(this::notFound);
        Challenge c = challenges.findById(s.challengeId).orElse(null);
        if (c == null || !session.subjectId().equals(c.orgId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your challenge");
        }
        s.status = SubmissionStatus.APPROVED;
        s.reviewedAt = System.currentTimeMillis();
        s.reviewerNote = req == null ? null : req.reviewerNote();
        submissions.save(s);

        Coupon coupon = new Coupon();
        coupon.id = uid("cp");
        coupon.code = couponCode();
        coupon.challengeId = s.challengeId;
        coupon.userId = s.userId;
        coupon.orgId = c.orgId;
        coupon.label = c.rewardLabel;
        coupon.status = CouponStatus.ACTIVE;
        coupon.createdAt = System.currentTimeMillis();
        coupon.expiresAt = System.currentTimeMillis() + 30 * DAY;
        coupons.save(coupon);
        return snapshot();
    }

    @PostMapping("/submissions/{id}/reject")
    public StateResponse rejectSubmission(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                          @PathVariable String id, @RequestBody(required = false) ReviewRequest req) {
        Session session = require(authHeader, Role.ORG);
        Submission s = submissions.findById(id).orElseThrow(this::notFound);
        Challenge c = challenges.findById(s.challengeId).orElse(null);
        if (c == null || !session.subjectId().equals(c.orgId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your challenge");
        }
        s.status = SubmissionStatus.REJECTED;
        s.reviewedAt = System.currentTimeMillis();
        s.reviewerNote = req == null ? null : req.reviewerNote();
        submissions.save(s);
        return snapshot();
    }

    @PostMapping("/coupons/redeem")
    public ActionResult redeem(@RequestHeader(value = "Authorization", required = false) String authHeader,
                               @RequestBody RedeemRequest req) {
        Session session = require(authHeader, Role.ORG);
        String code = req.code() == null ? "" : req.code().trim().toUpperCase();
        Coupon coupon = coupons.findAll().stream()
                .filter(c -> c.code != null && c.code.equalsIgnoreCase(code))
                .findFirst()
                .orElse(null);
        if (coupon == null) {
            return new ActionResult(false, "Coupon not found.");
        }
        if (!session.subjectId().equals(coupon.orgId)) {
            return new ActionResult(false, "This coupon was issued by another organization.");
        }
        if (coupon.status == CouponStatus.REDEEMED) {
            return new ActionResult(false, "This coupon was already redeemed.");
        }
        if (coupon.status == CouponStatus.EXPIRED || coupon.expiresAt < System.currentTimeMillis()) {
            return new ActionResult(false, "This coupon has expired.");
        }
        coupon.status = CouponStatus.REDEEMED;
        coupon.redeemedAt = System.currentTimeMillis();
        coupons.save(coupon);
        return new ActionResult(true, "Redeemed: " + coupon.label);
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found");
    }

    private static String uid(String prefix) {
        return prefix + "-" + Long.toString(System.nanoTime(), 36)
                + Integer.toString(RANDOM.nextInt(46656), 36);
    }

    private static String couponCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
        }
        return sb.substring(0, 4) + "-" + sb.substring(4);
    }
}
