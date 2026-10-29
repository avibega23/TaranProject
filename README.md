# FindIt — Smart Campus Lost & Found

FindIt helps a campus reunite lost belongings with their owners. A student reports a lost or found item, searches what has already been reported, and sees a short explanation when another report looks similar. Claims and moderation stay on the record.

This is a B.Tech CSE third-year minor project. The sample people and places in the seed data are fictional.

## Problem

Lost items on a campus are usually announced in scattered chats and notice boards. Those posts are hard to search, easy to miss, and awkward when someone has to share a private identifying detail in public.

## Objectives

- Give students one place to report lost and found items.
- Let anyone search the public listings.
- Suggest possible matches with an explainable score.
- Let a student claim a found item and let the reporter or an administrator decide.
- Keep administrator actions limited to administrator accounts.

## Features

- Student registration, sign-in, and sign-out with an HTTP-only session cookie.
- Lost and found reports, including an optional image.
- Search, filters, sorting by newest, and pagination backed by MongoDB.
- Rule-based match suggestions with a written explanation.
- Claim requests with pending, approved, rejected, and cancelled states.
- A student dashboard counted from that student's own records.
- An administrator area for moderation, claim review, and an activity history.

## Stack

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Aceternity UI background lines on the landing hero
- ReUI and shadcn components for filters, file upload, pagination, dialogs, tables, and form controls
- Express, Mongoose, and MongoDB
- Zod, React Hook Form, Vitest, and Supertest

## Architecture

The browser uses Next.js. Business operations go to Express. Express is split into controllers, services, and repositories. The repository is the only layer that queries MongoDB.

```
Browser -> Next.js -> /backend proxy -> Express route
        -> middleware -> controller -> service -> repository -> MongoDB
```

A longer explanation is in [docs/architecture.md](docs/architecture.md). Routes are listed in [docs/api-reference.md](docs/api-reference.md).

## Folder structure

```
apps/web          Next.js interface
apps/api          Express API, models, tests, and the seed script
docs              Architecture and API reference
```

Inside `apps/api/src`, `routes` and `controllers` handle HTTP, `services` hold rules, and `repositories` talk to MongoDB.

## Prerequisites

- Node.js 20 or newer
- npm
- A MongoDB connection string. Use MongoDB Atlas, or any MongoDB you already run. This project does not install or start a database.

## Installation

From the project folder:

```bash
npm install
```

Windows PowerShell:

```powershell
cd C:\path\to\TaranProject
npm install
Copy-Item apps\api\.env.example apps\api\.env
Copy-Item apps\web\.env.example apps\web\.env.local
```

Edit `apps/api/.env` and set `MONGODB_URI` to the URL you were given. Replace `ADMIN_PASSWORD` with a password of at least 8 characters. The placeholder `change-me-admin-password` is rejected by the seed script.

The web app already expects:

```
NEXT_PUBLIC_API_URL=/backend
API_PROXY_TARGET=http://localhost:4000
```

## MongoDB

Put the connection string in `MONGODB_URI`. A typical Atlas URI looks like the placeholder in `apps/api/.env.example`. The database name in that URI can be `findit`.

If the URI is missing or the server cannot connect, the API prints the reason and exits. `GET /api/health` returns `503` when the process is up but the database is not. The app does not switch to fake data.

Restarting the API does not delete saved users, reports, or claims.

## Seeding

```powershell
npm run seed
```

The command creates an administrator from `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` if that email does not exist. It also upserts fictional students and reports. Running it again updates those demo records instead of inserting duplicates.

Demo students, all using `DEMO_STUDENT_PASSWORD` (default `campus-demo-2026`):

- `asha.menon@campus.example`
- `rohan.iyer@campus.example`
- `meera.shah@campus.example`

The administrator signs in with the email and password from your `.env`. The seed script does not print that password and does not reset it if the account already exists.

Remove only the fictional records:

```powershell
npm run seed:clear
```

That command deletes documents marked as demo data. It does not drop the database and it does not delete the administrator.

## Development

```powershell
npm run dev
```

- Site: http://localhost:3000
- API: http://localhost:4000
- Health: http://localhost:4000/api/health

`npm run dev` starts both processes with `concurrently`, which is installed in the repository. You do not need a global process runner.

## Other commands

```powershell
npm run build
npm run lint
npm run typecheck
npm run test
npm run seed
```

Tests use an in-memory MongoDB and do not read or write `MONGODB_URI`.

## API overview

Public routes include health, registration, login, item search, item stats, and visible item details. Students can create reports and claims. Administrators can moderate reports and review claims. The full list is in [docs/api-reference.md](docs/api-reference.md).

## Roles

- **Student.** The only role created by the registration form. A student manages their own reports and claims, and can review claims on items they reported.
- **Administrator.** Created by the seed script. Can open `/admin` and the `/api/admin` routes. A student who changes a request body cannot become an administrator.

## Demonstration

1. Start the app and seed the database.
2. Open the home page. The counts are from the database. If you have not seeded, they are zero.
3. Sign in as `asha.menon@campus.example` with the demo student password.
4. Open the lost earbuds report and read the match explanation for the found earbuds.
5. Sign in as a new student, report a found item, and confirm it is missing from Browse until you approve it as the administrator.
6. As the administrator, approve that report and confirm it appears in Browse.
7. Submit a claim on an approved found item and approve it. The item becomes resolved.

## Troubleshooting

- **API exits immediately.** `MONGODB_URI` is missing or the host rejected the connection. Check the URI, the database user, and that your IP is allowed in Atlas.
- **The site loads but every action fails.** The API is not running, or `API_PROXY_TARGET` does not point at it.
- **Seed says the admin password is not set.** Replace `change-me-admin-password` in `apps/api/.env`.
- **Images do not appear.** The API must be running, because `/backend/uploads` is proxied to it. Files live in `apps/api/uploads`.

## Known limitations

- Images are stored on the API machine. Object storage is not wired up. To move them later, replace `saveItemImage` in `apps/api/src/services/upload.service.ts` and store the new URL on the item.
- Match suggestions are a capped, explainable heuristic. They are not a probability and they can miss a similar item outside the category and date window.
- The app does not send email.
- Claim approval uses a MongoDB transaction. Atlas supports that. A standalone server falls back to ordered updates.

## Future work

- Email or in-app notifications when a claim is reviewed.
- A map or building list for locations.
- Object storage for images.
- A richer audit view for administrators.
