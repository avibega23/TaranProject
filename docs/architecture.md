# Architecture

FindIt is two applications that share one repository.

- `apps/web` is the Next.js interface people use in the browser.
- `apps/api` is the Express API that owns accounts, reports, claims, and moderation.
- MongoDB stores the records. The API connects with `MONGODB_URI`. It does not start a database for you, and it does not invent records when the database is down.

## Request path

```
Browser
  -> Next.js page
  -> /backend/... on the same origin
  -> Next.js rewrite
  -> Express /api/...
  -> validation and auth middleware
  -> controller
  -> service
  -> repository
  -> MongoDB
```

The browser never talks to MongoDB, and it never sees the connection string.

## Why three layers

The API is split so each file has one job.

1. **Routes and controllers** translate HTTP into a function call and a JSON response. They check who is signed in, validate the body, and choose the status code. They do not contain the rules for claims or matching.
2. **Services** hold the rules. A service decides whether a claim is allowed, how a match is scored, and what happens when an administrator approves a report. Services do not read `req` or `res`.
3. **Repositories** are the only place that runs Mongoose queries. If a screen needs a new filter, the query is added here instead of being assembled in a controller.

A request walks down that chain and the response walks back up. A controller asks a service for a result. The service asks a repository for documents. The repository returns plain records. The service applies the rule. The controller sends JSON.

## Authentication

Signing in creates a random session id. The API stores only a SHA-256 hash of that id in the `sessions` collection. The browser receives the raw id in an HTTP-only cookie named `findit_session`. JavaScript on the page cannot read it, and it is not placed in `localStorage`.

Next.js proxies `/backend` to the API, so the cookie belongs to `localhost:3000` during development. Protected pages look for the cookie. The API still checks the session and the role on every protected request. Hiding a button is not the security control.

Registration always creates a student. The first administrator is created by `npm run seed` from `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.

## Matching

Matching is a rules function, not a model. For a lost report it looks at a limited set of approved found reports, and the other way around. The score adds four signals:

| Signal | Default weight |
| --- | --- |
| Same category | 0.35 |
| Overlap of meaningful words in the title and description | 0.35 |
| Overlap of location words | 0.15 |
| Dates inside the configured window | 0.15 |

The date window defaults to 14 days. A candidate below 0.35 is dropped. The interface calls the result a similarity estimate.

The candidate query is limited to the opposite report type, status `approved`, and either the same category or a date near the original report. It does not scan the whole collection on every request.

## Claims and moderation

A student can claim an approved found item they did not report. One pending claim is allowed per person per item. The reporter or an administrator can approve or reject a pending claim. The claimant can cancel their own pending claim. Nobody can approve their own claim.

Approval updates the claim and marks the item resolved. On MongoDB Atlas this happens in a transaction. If the server rejects transactions, the API applies the same updates in order and rolls the claim back if the item update does not succeed.

Moderation and claim decisions are written to the activity log with the actor, action, resource, and time. Passwords, session tokens, and claim proof text are not stored in that log.

## Images

Uploads are checked for JPEG, PNG, or WebP signatures and a size limit, then written to `UPLOAD_DIR`. MongoDB stores the filename. Replacing that directory with object storage later means changing `saveItemImage` and the upload URL. That replacement is not implemented.
