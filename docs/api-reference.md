# API reference

Base URL in development: `http://localhost:4000/api`

The browser calls the same routes through `http://localhost:3000/backend`, which Next.js forwards to the API. Send cookies with `credentials: include`.

Successful JSON:

```json
{ "success": true, "data": {} }
```

Lists also include:

```json
{ "pagination": { "page": 1, "limit": 12, "total": 0, "totalPages": 1 } }
```

Errors:

```json
{ "success": false, "message": "A safe, useful error message", "code": "VALIDATION_ERROR" }
```

Validation errors may include `details: [{ "path": "email", "message": "..." }]`. Responses do not include stack traces, password hashes, or database credentials.

## Health

`GET /api/health`

`200` when MongoDB is connected. `503` with code `DATABASE_UNAVAILABLE` when it is not.

## Authentication

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Create a student and set the session cookie |
| POST | `/api/auth/login` | Public | Sign in |
| POST | `/api/auth/logout` | Cookie optional | Delete the session and clear the cookie |
| GET | `/api/auth/me` | Required | Current user |

Register body: `name`, `email`, `studentId`, `password`, `confirmPassword`. A `role` field is ignored. Login and register are rate limited to 10 requests per 15 minutes outside tests.

## Items and stats

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/items/stats` | Public | Counts of approved lost, approved found, and resolved reports |
| GET | `/api/items` | Public | Approved reports. Query: `q`, `type`, `category`, `location`, `from`, `to`, `page`, `limit` |
| POST | `/api/items` | Required | Create a pending report. JSON or multipart with an `image` file |
| GET | `/api/items/:id` | Public when visible | One report. Pending and rejected reports are visible to the reporter and administrators |
| PATCH | `/api/items/:id` | Owner or admin | Edit an open report |
| DELETE | `/api/items/:id` | Owner or admin | Soft-archive the report |
| GET | `/api/items/:id/matches` | Public when the report is visible | Ranked similarity estimates |
| POST | `/api/items/:id/claims` | Required | Claim an approved found item |

Item body: `title`, `description`, `type` (`lost` or `found`), `category`, `location`, `eventDate`, optional `identifyingDetails`, `contactPreference` (`in_app` or `email`), optional `notes`.

Public item JSON omits identifying details, private notes, and the reporter id. `limit` cannot exceed 50.

## Claims

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/claims/mine` | Required | Claims filed by the current user |
| GET | `/api/claims/:id` | Claimant, reporter, or admin | One claim. Proof text is included only for the reporter and administrators |
| PATCH | `/api/claims/:id/cancel` | Claimant | Cancel a pending claim |
| PATCH | `/api/claims/:id/review` | Reporter or admin | Body `{ "decision": "approve" \| "reject", "note": "optional" }` |

## Account and dashboard

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/dashboard/summary` | Required | Counts, recent reports, and recent activity |
| GET | `/api/users/me/items` | Required | The current user's reports. Same filters as the public list, plus `status` |
| GET | `/api/users/me/incoming-claims` | Required | Pending claims on found items the user reported |
| GET | `/api/users/me/activity` | Required | The current user's activity |
| PATCH | `/api/users/me` | Required | Body `{ "name": "..." }`. Role cannot be changed |

## Administration

All routes require an administrator session.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/admin/overview` | Report and claim counts |
| GET | `/api/admin/items` | Search every status. Query includes `status` |
| PATCH | `/api/admin/items/:id/moderation` | Body `{ "action": "approve" \| "reject" \| "archive" \| "resolve", "note": "optional" }` |
| GET | `/api/admin/claims` | Optional `status`, `page`, `limit` |
| PATCH | `/api/admin/claims/:id/review` | Same review body as the reporter route |
| GET | `/api/admin/history/:resourceType/:id` | Activity for a `user`, `item`, or `claim` |

## Uploads

`GET /api/uploads/:filename`

Approved and resolved images can be read without signing in. Images for pending reports are limited to the reporter and administrators. The filename must be the generated 32-character hex name.
