package com.challengerewards.service;

import com.challengerewards.domain.Account;
import com.challengerewards.domain.AppUser;
import com.challengerewards.domain.Challenge;
import com.challengerewards.domain.Enums.ChallengeStatus;
import com.challengerewards.domain.Enums.ModerationType;
import com.challengerewards.domain.Enums.Role;
import com.challengerewards.domain.Enums.SubmissionStatus;
import com.challengerewards.domain.Organization;
import com.challengerewards.domain.Participation;
import com.challengerewards.domain.Submission;
import com.challengerewards.repo.AccountRepo;
import com.challengerewards.repo.ChallengeRepo;
import com.challengerewards.repo.CouponRepo;
import com.challengerewards.repo.OrgRepo;
import com.challengerewards.repo.ParticipationRepo;
import com.challengerewards.repo.SubmissionRepo;
import com.challengerewards.repo.UserRepo;
import java.time.LocalDate;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SeedService implements CommandLineRunner {

    public static final String CURRENT_USER_ID = "user-alex";
    public static final String CURRENT_ORG_ID = "org-coffeelab";
    private static final long DAY = 24L * 60 * 60 * 1000;

    private final UserRepo users;
    private final OrgRepo orgs;
    private final ChallengeRepo challenges;
    private final ParticipationRepo participations;
    private final SubmissionRepo submissions;
    private final CouponRepo coupons;
    private final AccountRepo accounts;

    public SeedService(UserRepo users, OrgRepo orgs, ChallengeRepo challenges,
                       ParticipationRepo participations, SubmissionRepo submissions,
                       CouponRepo coupons, AccountRepo accounts) {
        this.users = users;
        this.orgs = orgs;
        this.challenges = challenges;
        this.participations = participations;
        this.submissions = submissions;
        this.coupons = coupons;
        this.accounts = accounts;
    }

    private static String iso(int offsetDays) {
        return LocalDate.now().plusDays(offsetDays).toString();
    }

    @Override
    public void run(String... args) {
        if (orgs.count() == 0) {
            seed();
        }
    }

    @Transactional
    public void seed() {
        accounts.deleteAll();
        coupons.deleteAll();
        submissions.deleteAll();
        participations.deleteAll();
        challenges.deleteAll();
        users.deleteAll();
        orgs.deleteAll();

        long now = System.currentTimeMillis();

        users.save(user(CURRENT_USER_ID, "Alex", "AX"));
        users.save(user("user-mia", "Mia", "MI"));
        users.save(user("user-sam", "Sam", "SM"));

        orgs.save(org(CURRENT_ORG_ID, "CoffeeLab", "CL"));

        accounts.save(account("acc-alex", "alex", "alex123", Role.USER, CURRENT_USER_ID, "Alex"));
        accounts.save(account("acc-coffeelab", "coffeelab", "coffee123", Role.ORG, CURRENT_ORG_ID, "CoffeeLab"));
        accounts.save(account("acc-admin", "admin", "admin123", Role.ADMIN, null, "Platform Admin"));

        challenges.save(challenge("ch-run", "Morning Run 5K",
                "Run 5 kilometers any morning this week and earn a free signature latte. Share your route to inspire others!",
                "Fitness", ModerationType.STRAVA, "Free Signature Latte", 100,
                iso(-3), iso(11), now - 3 * DAY, ChallengeStatus.APPROVED, now - 3 * DAY));
        challenges.save(challenge("ch-tasting", "Coffee Tasting Night",
                "Join us in-store for a guided tasting of three single-origin beans. Check in at the event to claim your reward.",
                "Event", ModerationType.CHECKIN, "20% Off Any Beans", 12,
                iso(-1), iso(6), now - 2 * DAY, ChallengeStatus.APPROVED, now - 2 * DAY));
        challenges.save(challenge("ch-cup", "Bring Your Own Cup Week",
                "Use a reusable cup for any drink and snap a photo. Go green and grab a tasty pastry on us.",
                "Sustainability", ModerationType.MANUAL, "Free Pastry", 50,
                iso(-5), iso(9), now - 5 * DAY, ChallengeStatus.APPROVED, now - 5 * DAY));
        challenges.save(challenge("ch-sprint", "Rooftop Midnight Sprint",
                "Race up the parking-garage rooftop at midnight for a double-shot espresso. Submitted for safety review.",
                "Fitness", ModerationType.STRAVA, "Free Double Espresso", 20,
                iso(0), iso(7), now - 4 * 60 * 60 * 1000, ChallengeStatus.PENDING_REVIEW, null));

        participations.save(participation("p-1", "ch-run", "user-mia", now - 2 * DAY));
        participations.save(participation("p-2", "ch-tasting", "user-sam", now - DAY));
        participations.save(participation("p-3", "ch-cup", CURRENT_USER_ID, now - DAY));

        submissions.save(submission("s-1", "ch-run", "user-mia", ModerationType.STRAVA,
                "Finished a 5.2K loop around the park this morning!", now - 6 * 60 * 60 * 1000));
        submissions.save(submission("s-2", "ch-cup", CURRENT_USER_ID, ModerationType.MANUAL,
                "Used my bamboo cup for a flat white today.", now - 3 * 60 * 60 * 1000));
    }

    private Account account(String id, String username, String password, Role role,
                            String subjectId, String displayName) {
        Account a = new Account();
        a.id = id;
        a.username = username;
        a.password = password;
        a.role = role;
        a.subjectId = subjectId;
        a.displayName = displayName;
        return a;
    }

    private AppUser user(String id, String name, String avatar) {
        AppUser u = new AppUser();
        u.id = id;
        u.name = name;
        u.avatar = avatar;
        return u;
    }

    private Organization org(String id, String name, String avatar) {
        Organization o = new Organization();
        o.id = id;
        o.name = name;
        o.avatar = avatar;
        return o;
    }

    private Challenge challenge(String id, String title, String description, String category,
                                ModerationType type, String reward, int capacity,
                                String start, String end, long createdAt,
                                ChallengeStatus status, Long reviewedAt) {
        Challenge c = new Challenge();
        c.id = id;
        c.orgId = CURRENT_ORG_ID;
        c.title = title;
        c.description = description;
        c.category = category;
        c.moderationType = type;
        c.rewardLabel = reward;
        c.capacity = capacity;
        c.startDate = start;
        c.endDate = end;
        c.createdAt = createdAt;
        c.status = status;
        c.reviewedAt = reviewedAt;
        return c;
    }

    private Participation participation(String id, String challengeId, String userId, long joinedAt) {
        Participation p = new Participation();
        p.id = id;
        p.challengeId = challengeId;
        p.userId = userId;
        p.joinedAt = joinedAt;
        return p;
    }

    private Submission submission(String id, String challengeId, String userId,
                                  ModerationType type, String note, long createdAt) {
        Submission s = new Submission();
        s.id = id;
        s.challengeId = challengeId;
        s.userId = userId;
        s.type = type;
        s.note = note;
        s.status = SubmissionStatus.PENDING;
        s.createdAt = createdAt;
        return s;
    }
}
