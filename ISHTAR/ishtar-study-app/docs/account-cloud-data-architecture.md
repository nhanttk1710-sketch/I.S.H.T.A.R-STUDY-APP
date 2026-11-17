# I.S.H.T.A.R Account + Cloud Data Architecture

Status: proposed implementation contract (Phase 0)
Branch: `feat/account-cloud-data-architecture`
Scope: architecture only. No production data, authentication provider, database, or Vercel environment variables are changed by this document.

## 1. Current-state findings

The current app is a Next.js 14 App Router frontend. The README identifies it as a frontend demo. The login form in `components/Login.tsx` explicitly says authentication is simulated and data remains on the current device. The app entry point `app/page.tsx` renders `IshtarApp` directly; `components/ishtar-app.tsx` does not currently mount the Login component or check an authenticated session.

There is no authentication or PostgreSQL driver/ORM dependency in the current `package.json`. No Neon connection module, auth route handler, or database schema was found in the inspected application paths.

Data is fragmented across browser storage:
- Main study document: `ishtar-study-data-v2` (profile fields, subjects, tasks, grades, timetable, resources, words, goals, events).
- Guest vocabulary vault: `ishtar-vocabulary-vault-v1` (words + mastered IDs).
- Learning archive: `ishtar-learning-archive-v1`.
- Flashcard session: date-scoped `ishtar-vault-YYYY-MM-DD` keys.
- Other independent keys include profile/preferences, streak, assistant setting, wallpaper, playlist and related UI state.

The Guest Vault improves local organization and backup/migration behavior; it is still browser-local storage and does not create cross-device sync.

## 2. Target architecture

Use **Better Auth + Neon PostgreSQL** for application accounts and persistence.

- Better Auth owns registration, password hashing, sessions, secure cookies, and the auth user/session/account tables.
- Neon PostgreSQL is the source of truth for signed-in user data.
- The application must never connect to Neon from the browser. All database reads/writes go through authenticated Next.js server route handlers.
- Each data request derives the user ID from the verified Better Auth session. Never accept a user ID supplied by the client as the authorization boundary.
- Cloud is the only durable source of truth for signed-in study data. LocalStorage is not a second study-data database and must not silently override cloud data. It may hold device-only UI preferences or short-lived interaction state.
- Keep the existing Login UI as a visual starting point, but replace its simulated submit handler with Better Auth client methods only after auth routes, environment variables, and database migrations are configured.

## 3. Persistence model (MVP)

Use one versioned JSONB document per authenticated user for the first cloud-sync release. This avoids prematurely splitting every feature into separate relational tables while the app's data model is still evolving.

Table: `user_app_data`
- `user_id`: primary key and foreign key to Better Auth's `user.id`.
- `schema_version`: application data schema version.
- `data`: JSONB document containing the account-owned study data.
- `revision`: monotonically increasing integer used for optimistic concurrency.
- `created_at`, `updated_at`: server timestamps.

The API returns a revision with every successful read/write. A write includes the revision the client last read. If the server revision has changed, return HTTP 409 with the latest revision/data metadata; do not last-write-wins overwrite silently. The client can then offer reload/compare/retry. A transaction increments revision atomically.

The initial JSON document should include:
- profile display name (not credentials), subjects, daily study goal;
- tasks/deadlines/events, grades, timetable sessions;
- resources, vocabulary words, mastered-word IDs;
- exam goals and score history;
- learning archive events;
- account-level playlist metadata only if the user expects it to follow them across devices.

Do not store passwords, auth tokens, session cookies, or secrets inside the JSON document.

## 4. Data ownership

| Data | Owner | Cloud sync |
|---|---|---|
| Name / profile metadata | Account | Yes |
| Subjects, tasks, grades, timetable, resources | Account | Yes |
| Vocabulary + mastered status | Account | Yes |
| Learning Archive | Account | Yes |
| Exam goals and score history | Account | Yes |
| Playlist lists / track IDs | Account (if retained as personal content) | Yes |
| Active flashcard round / current card | Device/session state | No initially |
| Pomodoro running timer | Device/session state | No initially |
| Wallpaper, wallpaper position, assistant visibility | Device preference | No |
| Visit streak | Derived/account activity | Revisit; do not trust client-only count |
| Avatar image bytes | Object storage or external image URL | Not as a base64 data URL in JSONB |

This is the initial ownership contract. If the user explicitly wants a device preference to follow them, promote it to account data later.

## 5. Initial account setup (cloud-first)

The user has intentionally avoided adding meaningful study data to the current browser store because it was not durable across deploys/devices. Therefore the first cloud release should start with a clean account-owned document rather than assuming there is a large guest dataset to migrate.

1. After successful sign-up/sign-in, fetch the account's cloud document and revision.
2. If no document exists, initialize a validated empty study document for that account.
3. If legacy browser data is detected, do not automatically import or overwrite anything. Offer an explicit export/import path only after showing a preview and validating the payload.
4. Cloud writes are transactional and revision-checked. Keep a downloadable backup/export path for recovery.

No automatic deletion of legacy browser keys. No merge based only on array position. Cloud data must never be replaced by an empty client state during initial loading.

## 6. Sync API contract

Suggested authenticated routes:
- `GET /api/data`: return the current user's document and revision, or an empty initial document.
- `PUT /api/data`: validate payload, require `expectedRevision`, atomically save and increment revision; return 409 on revision mismatch.
- `POST /api/data/migrate-guest`: validate and merge a guest snapshot using an idempotency/migration ID.
- `GET /api/auth/[...all]`, `POST /api/auth/[...all]`: Better Auth route handler.

All route handlers must:
- verify the Better Auth session server-side;
- validate request bodies and enforce reasonable size limits;
- scope every database query to the session user ID;
- avoid logging passwords, tokens, or full private study documents;
- return safe error messages and appropriate status codes.

## 7. Environment and setup prerequisites

Required before real authentication/cloud sync can run:
- A Neon PostgreSQL database and its server-side connection string.
- `BETTER_AUTH_SECRET` generated securely (never committed).
- `BETTER_AUTH_URL` for the stable production origin; preview should infer its request origin unless explicitly configured.
- Database/auth migrations applied to the intended Neon database.
- Environment variables configured separately for Development, Preview, and Production in Vercel.

Do not create a paid database/integration, retrieve secret values, or change Vercel environment variables without the account owner's explicit confirmation. No credentials belong in GitHub.

## 8. Rollout and safety

1. Architecture + schema review.
2. Add dependencies and Better Auth server/client configuration; apply Better Auth migrations.
3. Add `user_app_data` migration and authenticated data API.
4. Wire login/register/logout and a real session-aware app gate.
5. Implement guest migration and revision-based sync.
6. Test sign-up, sign-in, sign-out, wrong password, refresh, two accounts isolation, guest migration, duplicate migration, concurrent edits from two devices, and offline/retry behavior.
7. Only then enable the cloud path in Preview. Production remains unchanged until explicit approval.

During rollout, keep existing LocalStorage code isolated on TEST only as legacy compatibility until cloud reads/writes are verified. Do not let an empty LocalStorage state overwrite cloud data. Do not remove old keys or change the production branch until restore tests pass.

## 9. Explicit non-goals for this phase

- No production deployment or merge.
- No deletion/renaming of existing LocalStorage keys during the first cloud rollout.
- No claim that sync is working before two-device tests pass.
- No client-side database connection.
- No password handling implemented in a custom API.
- No last-write-wins synchronization.
