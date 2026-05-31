# Challenge Rewards

A hackathon MVP web app where **organizations** create challenges and **users** complete them to earn redeemable coupons.

- **Frontend:** React + TypeScript + Vite
- **Backend:** Spring Boot (Java) REST API
- **Database:** H2 (in-memory SQL)

## Quick start

You need **two terminals** — one for the backend, one for the frontend.

### 1. Backend (Spring Boot + H2) — port 8080

```bash
cd backend
mvn spring-boot:run
```

Requires a JDK (21+) and Maven. On macOS: `brew install maven` (installs both).
The H2 database is in-memory and is **seeded automatically** on first start.
You can inspect the tables at http://localhost:8080/h2-console
(JDBC URL `jdbc:h2:mem:challengerewards`, user `sa`, empty password).

### 2. Frontend — port 5173

```bash
npm install
npm run dev
```

Then open http://localhost:5173. Vite proxies `/api/*` to the backend on port 8080,
so no CORS setup is needed during development.

> If the UI shows "Backend unavailable", the Spring Boot app isn't running yet.

## Authentication

The app has **separate authentication for each role**: User, Organization, and Platform (Admin).
Pick a role on the login screen, then sign in (or, for User/Org, create a new account).
The role you log in as decides which workspace you see — there's no manual mode toggle.

Seeded demo credentials (the login screen has a one-click "use demo credentials" button):

| Role | Username | Password |
| --- | --- | --- |
| User | `alex` | `alex123` |
| Organization | `coffeelab` | `coffee123` |
| Platform (Admin) | `admin` | `admin123` |

- Users and Organizations can **self-register**; admin accounts cannot.
- Login returns a token (kept in `localStorage`) sent as `Authorization: Bearer <token>`.
- The backend **enforces roles**: e.g. only an Admin can approve/reject challenges, only the
  owning Organization can moderate its submissions and redeem its coupons, only a User can join/submit.

## Three workspaces

Each role lands in its own workspace after login.

### User (mock user: **Alex**)
- Browse the challenge list and open challenge details
- Participate in a challenge
- Submit proof of completion (Strava screenshot / event check-in / manual proof)
- View profile with stats and earned coupons (each coupon has a QR code + promo code)

### Organization (mock org: **CoffeeLab**)
- Dashboard with live statistics:
  - total participants
  - pending submissions
  - approved submissions
  - redeemed coupons
  - estimated store visits
- Create new challenges (each has a **capacity / max participants** and is **submitted for platform review**)
- Moderate submissions: approve (auto-issues a coupon) or reject with a note
- Redeem coupons by scanning the QR or entering the promo code

### Platform (moderator)
- Reviews every newly created challenge **before** it becomes visible to users
- Approve safe challenges (publishes them) or reject risky/dangerous ones with a reason
- Stats: awaiting review, approved, rejected, organizations

> Challenges are only shown to users once the platform **approves** them. Each challenge
> also has a limited number of spots — once full, users can no longer join.

## Demo flow

1. **Org → Moderation**: approve a pending submission → a coupon is generated.
2. **User → My Profile**: open the new coupon to see its QR code and promo code.
3. **Org → Redeem**: enter that promo code to redeem it → dashboard stats update.

Use the **↺ Reset** button in the header to restore the original demo data.

## Data model

- **Challenge statuses (platform review):** `PENDING_REVIEW`, `APPROVED`, `REJECTED`
- **Submission statuses:** `PENDING`, `APPROVED`, `REJECTED`
- **Coupon statuses:** `ACTIVE`, `REDEEMED`, `EXPIRED`
- **Moderation types:** Strava screenshot, event check-in, manual proof
- **Capacity:** each challenge has a max number of participants

## Architecture

```
Browser (React/Vite :5173)  ──/api/*──►  Spring Boot (:8080)  ──►  H2 in-memory DB
```

- The frontend keeps a single `db` snapshot fetched from `GET /api/state`.
- Every action (join, submit, approve, reject, redeem, create, review) is a `POST`
  that mutates H2 and returns the fresh state, which the UI re-renders from.

### REST API

All `/api/*` endpoints except `/api/auth/*` require a valid `Authorization: Bearer <token>`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/login` · `/register` · `/logout` · GET `/me` | Authentication |
| GET | `/api/state` | Full snapshot (users, orgs, challenges, participations, submissions, coupons) |
| POST | `/api/reset` | Reset and reseed the database |
| POST | `/api/challenges` | Create a challenge (starts `PENDING_REVIEW`) |
| POST | `/api/challenges/{id}/approve` · `/reject` | Platform review |
| POST | `/api/challenges/{id}/join` · `/leave` | Join (capacity-enforced) / leave |
| POST | `/api/submissions` | Submit proof |
| POST | `/api/submissions/{id}/approve` · `/reject` | Org moderation (approve issues a coupon) |
| POST | `/api/coupons/redeem` | Redeem by promo code |

## Tech

- React 18 + TypeScript + Vite, `qrcode.react` for coupon QR codes
- Spring Boot 3.4 (Web + Data JPA), H2 in-memory database
- Lightweight token auth (in-memory sessions, role-based access control)
- Java 21 bytecode target

> Auth note: passwords are stored in plain text and sessions live in memory — fine for a
> hackathon demo, but not production-grade. Swap in hashing (BCrypt) + JWT/Spring Security for real use.
