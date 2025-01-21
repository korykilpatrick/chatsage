# Implementation Guide (Updated with Feedback)

This guide provides extremely granular instructions that you can copy and paste, step by step, to build out the entire Slack Clone project with **test-driven development (TDD)** in mind. Each prompt tells **o1-pro** exactly which files to include in the context window, and exactly which files to create or modify. Please follow in numerical order.

Throughout the guide, we will emphasize:
- **Environment variables** for DB credentials, JWT secrets, email SMTP config, etc.
- **Recommended Node.js version** (e.g., **v18.x** or **v20.x**).
- **Docker usage** for local development and for spinning up test instances of Postgres, Redis, etc.
- **Linting & coverage** best practices to ensure consistent, high-quality code.
- **Role-based checks** (OWNER, ADMIN, MEMBER, GUEST) where relevant (especially for membership endpoints or user reactivation).
- **Security notes** (SQL injection, rate-limiting, safe password storage, etc.).

By integrating all feedback, we ensure the project can be tackled confidently by any developer, even if they're new to monorepos or TDD.

---

## Table of Contents

1. [Monorepo Initialization (TDD Setup)](#1-monorepo-initialization-tdd-setup)
2. [Database Schema & Migrations (Including TDD Setup for DB)](#2-database-schema--migrations-including-tdd-setup-for-db)
3. [Basic Backend Scaffolding (Express + TDD)](#3-basic-backend-scaffolding-express--tdd)
4. [Authentication & User Management (TDD for Auth)](#4-authentication--user-management-tdd-for-auth)
5. [Soft-Delete Endpoints (Users, Channels, Workspaces) with TDD](#5-soft-delete-endpoints-users-channels-workspaces-with-tdd)
5.5. [Workspace & Channel Membership (TDD) — NEW](#55-workspace--channel-membership-tdd--new)
6. [Real-Time Presence & Redis Integration (TDD Skeleton)](#6-real-time-presence--redis-integration-tdd-skeleton)
7. [Messages, Threads, Reactions, Pins (Core Messaging API + TDD)](#7-messages-threads-reactions-pins-core-messaging-api--tdd)
7.5. [Emoji Endpoints & TDD — NEW](#75-emoji-endpoints--tdd--new)
8. [File Upload/Download (TDD for Files)](#8-file-uploaddownload-tdd-for-files)
9. [Search Implementation (TDD for /search)](#9-search-implementation-tdd-for-search)
10. [Reactivation Endpoints & TDD](#10-reactivation-endpoints--tdd)
11. [Observability & Deployment (Docker + TDD for Infra)](#11-observability--deployment-docker--tdd-for-infra)
12. [Frontend Setup & Shared Types (TDD with Jest & React Testing Library)](#12-frontend-setup--shared-types-tdd-with-jest--react-testing-library)
13. [Basic UI Components & Layout (WorkspaceNavigation, ChannelList) + TDD](#13-basic-ui-components--layout-workspacenavigation-channellist--tdd)
14. [Direct Messages, ChatArea, and MessageInputBox + TDD](#14-direct-messages-chatarea-and-messageinputbox--tdd)
15. [Overlays & Additional Features (FileSharingOverlay, SearchBar, BaseOverlay) + TDD](#15-overlays--additional-features-filesharingoverlay-searchbar-baseoverlay--tdd)
16. [EmojiReactionPicker & Preferences (TDD)](#16-emojireactionpicker--preferences-tdd)
17. [NewChannelGroupCreationOverlay & Admin Reactivation UI + TDD](#17-newchannelgroupcreationoverlay--admin-reactivation-ui--tdd)
18. [Final Integration, E2E Testing (Cypress or Playwright)](#18-final-integration-e2e-testing-cypress-or-playwright)
19. [Real-Time Enhancements (WebSockets) + TDD](#19-real-time-enhancements-websockets--tdd)
20. [Final Review & Future Enhancements](#20-final-review--future-enhancements)

---

## 1. Monorepo Initialization (TDD Setup)

**Context files to include:**  
- *None*

**Prompt:**
Create a new repository named "chatsage".

In the root, create:
- backend/
- frontend/
- shared/

A root package.json with a "workspaces" field (if using npm or Yarn Berry). Example:
```json
{
  "private": true,
  "name": "chatsage",
  "workspaces": ["backend", "frontend", "shared"]
}
```

In each directory (backend, frontend, shared), create its own package.json.

The "shared" package.json can hold common enums or consts.

Create a file "README.md" at the monorepo root:
- Brief description: "This is a Slack Clone project built from scratch with TDD."
- Mention recommended Node.js version (e.g., 18.x or 20.x).

Install a test runner (Jest or Vitest, etc.) globally for the entire monorepo:
- E.g., npm install --save-dev jest @types/jest
- Configure a "test" script in the root package.json that runs an empty test suite.
- Confirm "npm test" (or "yarn test"/"pnpm test") runs an empty test suite successfully.

Summarize how to use Docker for future containerization:
- E.g., mention that we'll spin up Postgres/Redis containers later via docker-compose.

**Additional Notes:**  
- Mention your Node.js version explicitly (e.g., `engine` field in package.json).
- If you plan to use ESLint + Prettier, you can add them here or in a future step.

---

## 2. Database Schema & Migrations (Including TDD Setup for DB)

**Context files to include:**  
- `db.sql`
- `backend_plan.md`

**Prompt:**
In the "backend" folder:

Create a "database" folder with a "migrations" subfolder and a file "db-init.sql":
- Copy the contents of db.sql into "db-init.sql".
- This file contains all CREATE TABLE statements, enums, triggers, etc.

Create a "tests/db" folder for DB-specific tests.

Set up a migration tool (Knex, Drizzle, Prisma, etc.) in "backend". Provide a config file (e.g., "knexfile.js" or "drizzle.config.ts").
- Make sure to read DB credentials from environment variables (e.g., process.env.DB_HOST).
- Example of referencing a .env.test file for test DB credentials.

Generate migration files inside "database/migrations" that replicate the logic of "db-init.sql":
- Include triggers for updatedAt and partial indexes for soft-delete queries (WHERE archived=false, WHERE deleted=false, etc.).

Create "db_migration.test.js" (or .ts) in "tests/db":
- Spin up a test DB (via Docker or local).
- Run migrations.
- Verify the tables, enums, and triggers are created (you can query pg_catalog tables).

Add a script "test:db" in backend/package.json that runs these DB tests:
- "npm run test:db" => ensures migrations work.
- Reference the triggers from backend_plan.md. Confirm they're created in the test.

**Additional Notes:**
- Emphasize that environment variables (e.g., `.env.test`) are critical to switching between dev, test, and prod DBs.
- If using Postgres, consider a small snippet demonstrating how you might check a table's existence in your test.

---

## 3. Basic Backend Scaffolding (Express + TDD)

**Context files to include:**  
- `backend_plan.md`
- `openapi.json`

**Prompt:**
In "src/app.ts":
- Initialize Express (or Nest/Fastify) application.
- Use a logger (Morgan or Winston).
- Add JSON body parsing.
- Add a simple error-handling middleware that returns JSON errors with status code + message.

Create "server.ts" to start the server on a specified port (from ENV or 3000).

Create "routes" folder for versioned routes (e.g., "routes/v1"):
- For now, just add "health.route.ts" with GET /v1/health => { status: "ok" }.

Under "tests/app", create "app.test.js" (or .ts):
- Use supertest or a similar library to test "/v1/health".
- Expect 200 with { status: "ok" }.

Add "test:app" script in backend/package.json to run integration tests.

(Optional) Serve "openapi.json" at "/v1/openapi.json" to help with API visibility.

If you plan real-time (Socket.io), create a placeholder setup in "app.ts" or "socket.ts" that doesn't do much yet. We'll fill it later.

Run "npm run test:app" => confirm passing health check test.

(Optional) Set up ESLint/Prettier to maintain code style.

**Additional Notes:**  
- You can keep your real-time placeholders in a separate file so it won't disrupt your Express structure.
- Consider adding a "lint" script at this stage.

---

## 4. Authentication & User Management (TDD for Auth)

**Context files to include:**  
- `backend_plan.md`
- `openapi.json` (Auth and Users endpoints)

**Prompt:**
In "src/routes/auth":
- Create "auth.controller.ts" and "auth.service.ts".
- Create "auth.test.ts" for TDD.

Implement the following endpoints from openapi.json:
- POST /v1/auth/register
- POST /v1/auth/verify-email
- POST /v1/auth/login
- POST /v1/auth/refresh
- POST /v1/auth/logout

"auth.service.ts":
- Hash passwords using bcrypt or argon2.
- Save user to DB, ensuring email uniqueness.
- Generate JWT tokens (access + refresh).
- For verify-email, use a mock token approach (in real code, store a token in DB or sign a JWT with an "email_verification" claim).
- (Optional) demonstrate rate-limiting or brute-force protection with e.g. "express-rate-limit".

"auth.test.ts":
- TDD for each endpoint:
  a) Register => success, conflict (email in use), invalid data
  b) Verify-email => valid token vs invalid/expired
  c) Login => correct vs incorrect password
  d) Refresh => valid vs invalid token
  e) Logout => session invalidation or blacklist

In "src/routes/users":
- Create "users.controller.ts" and "users.service.ts" plus "users.test.ts".
- Implement GET /v1/users (authorized only) that lists users (possibly with a query param to filter deactivated ones).

Add scripts "test:auth" and "test:users" in package.json.
Return enumerated error codes (INVALID_CREDENTIALS, etc.) per openapi.json.

Confirm tests pass with "npm run test:auth" and "npm run test:users".

**Additional Notes:**  
- Emphasize using environment variables for JWT secrets. 
- Mention at least a minimal approach to storing tokens (in memory, in DB, or a token blacklist).

---

## 5. Soft-Delete Endpoints (Users, Channels, Workspaces) with TDD

**Context files to include:**  
- `backend_plan.md`
- `openapi.json` (Users, Workspaces, Channels)

**Prompt:**
In "src/routes/users/users.controller.ts" and "users.service.ts":
- Implement DELETE /v1/users/{userId} => sets "deactivated = true".
- Write TDD in "users.test.ts":
  - Deactivate user test (returns 204).
  - 404 if user doesn't exist.

In "src/routes/workspaces":
- Create "workspaces.controller.ts", "workspaces.service.ts", "workspaces.test.ts".
- POST /v1/workspaces => create workspace (archived=false).
- DELETE /v1/workspaces/{workspaceId} => set "archived = true".
- TDD for success vs invalid ID.
- Show that "archived" workspaces are excluded from normal queries unless "includeArchived=true".

In "src/routes/channels":
- Create "channels.controller.ts", "channels.service.ts", "channels.test.ts".
- POST /v1/channels => create channel (archived=false).
- DELETE /v1/channels/{channelId} => set "archived = true".
- TDD verifying normal queries exclude archived channels unless "includeArchived" is set.

Add coverage for "includeArchived" or "includeDeleted" in queries. Explain or show partial indexes for "WHERE archived=false" or "WHERE deleted=false".

Run "npm run test" or "npm run test:channels" etc. to confirm.

**Additional Notes:**  
- Mention returning `204 No Content` after a soft-delete.
- Confirm role-based checks if only ADMIN can delete. If not, keep it simple.

---

## 5.5. Workspace & Channel Membership (TDD) — NEW

**Context files to include:**  
- `backend_plan.md`
- `openapi.json` (Workspace/Channel membership endpoints)

**Prompt:**
In "src/routes/workspaces/workspaces.controller.ts" / "workspaces.service.ts":
- POST /v1/workspaces/{workspaceId}/members => adds user to workspace (UserWorkspaces table).
- DELETE /v1/workspaces/{workspaceId}/members (with userId=? query param) => removes user from workspace.

In "src/routes/channels/channels.controller.ts" / "channels.service.ts":
- POST /v1/channels/{channelId}/members => adds user to channel (UserChannels table).
- DELETE /v1/channels/{channelId}/members (with userId=? param) => removes user.

In "workspaces.test.ts" and "channels.test.ts":
- TDD the membership flows:
  - Adding user who isn't already a member => success.
  - Removing user => success if user is present, 404 if not found.
  - Optionally, only ADMIN or OWNER can remove a user => return FORBIDDEN if unauthorized.
  - Check duplicates (try to add a user twice).

Ensure membership references correct DB tables. Confirm these endpoints align with openapi.json.
Run "npm run test:workspaces" / "npm run test:channels" to verify.

**Additional Notes:**  
- If you want self-removal from a workspace, decide if it's allowed or not. 
- If you want to store a "role" in `UserWorkspaces`, handle that as well (OWNER, ADMIN, etc.).

---

## 6. Real-Time Presence & Redis Integration (TDD Skeleton)

**Context files to include:**  
- `backend_plan.md`

**Prompt:**
Install a Redis client (ioredis or redis).

In "src/config/redis.ts":
- Initialize Redis connection reading from .env (REDIS_HOST, REDIS_PORT, etc.).

Create "src/services/presence.service.ts":
- setUserOnline(userId: number): store a key in Redis, e.g. "online_users:{userId}".
- setUserOffline(userId: number): remove that key.
- isUserOnline(userId: number): returns boolean by checking if key exists.
- updateLastKnownPresence(userId: number): sets "lastKnownPresence" in DB (e.g., "ONLINE", "AWAY", etc.).

In "tests/presence/presence.test.ts":
- TDD for each method (online, offline, isUserOnline).
- Optionally mock Redis or spin up a real container via Docker.

Show a Cron-like or setInterval approach that after X minutes sets AWAY or OFFLINE for inactive users.

Run "npm run test:presence" to confirm.

(If scaling horizontally with Socket.io, mention a pub/sub adapter for Redis in a later step.)

**Additional Notes:**  
- For a graceful offline approach, highlight that a user might not explicitly "log out," so you'd rely on TTL or a heartbeat.

---

## 7. Messages, Threads, Reactions, Pins (Core Messaging API + TDD)

**Context files to include:**  
- `backend_plan.md`
- `openapi.json` (Messages, Reactions, Pinning)

**Prompt:**
In "src/routes/messages":
- Create "messages.controller.ts", "messages.service.ts", "messages.test.ts".
- Implement:
  - POST /v1/messages => create new message (deleted=false by default).
  - GET /v1/channels/{channelId}/messages => list messages in channel, exclude deleted unless ?includeDeleted=true.
  - GET /v1/messages/{messageId} => fetch single message (show if deleted).
  - PUT /v1/messages/{messageId} => update content.
  - DELETE /v1/messages/{messageId} => soft-delete => set deleted=true.
  - For threads, use parentMessageId if referencing the same table.

In "src/routes/reactions":
- "reactions.controller.ts", "reactions.service.ts", "reactions.test.ts".
- POST /v1/messages/{messageId}/reactions => add reaction (check unique constraint).
- DELETE /v1/messages/{messageId}/reactions/{reactionId} => remove.

In "src/routes/pins":
- "pins.controller.ts", "pins.service.ts", "pins.test.ts".
- POST /v1/messages/{messageId}/pin => pin a message.
- DELETE /v1/messages/{messageId}/pin => unpin.

In tests (messages.test.ts, reactions.test.ts, pins.test.ts):
- Verify normal usage, check 404 if message not found, enforce uniqueness for reactions, etc.
- Reference any partial index approach excluding deleted messages for performance.
Ensure "npm run test:messages", "npm run test:reactions", "npm run test:pins" pass.

**Additional Notes:**  
- If you have advanced thread logic, you might store threads in a separate table or continue with self-reference. 
- Confirm you handle role-based or membership checks (only channel members can post messages, etc.).

---

## 7.5. Emoji Endpoints & TDD — NEW

**Context files to include:**  
- `backend_plan.md`
- `openapi.json` (Emojis)

**Prompt:**
In "src/routes/emojis":
- Create "emojis.controller.ts", "emojis.service.ts", "emojis.test.ts".
- Implement:
  - GET /v1/emojis => list emojis (where deleted=false unless ?includeDeleted=true).
  - POST /v1/emojis => create new emoji (deleted=false). Must have unique code.
  - GET /v1/emojis/{emojiId} => get by ID, even if deleted.
  - DELETE /v1/emojis/{emojiId} => soft-delete => set deleted=true.

In "emojis.test.ts":
- TDD that ensures:
  - Creating an emoji with unique code
  - Fetching by ID
  - Soft-deleting => verify "deleted=true" and it's excluded from normal GET queries
  - 404 if invalid ID

Add "test:emojis" script in package.json. Run "npm run test:emojis" => confirm pass.

(Optional) If you store an emoji image, decide if it's S3 or local. For now, text-based code is enough.

**Additional Notes:**  
- Could mention admin-only creation if you want. 
- If you'd like to support image uploads, add a sub-step referencing the Files logic.

---

## 8. File Upload/Download (TDD for Files)

**Context files to include:**  
- `backend_plan.md`
- `openapi.json` (Files)

**Prompt:**
In "src/routes/files":
- "files.controller.ts", "files.service.ts", "files.test.ts".
- Endpoints:
  - POST /v1/files => upload a file (store metadata in DB, e.g., fileUrl, size).
  - GET /v1/files/{fileId} => serve or redirect to file.
  - DELETE /v1/files/{fileId} => either soft-delete or permanent remove (your choice).

In "files.service.ts":
- Demonstrate local storage mock or a pointer to S3.
- Save file info in DB (fileSize, fileHash, etc.).

In "files.test.ts":
- TDD:
  - Upload a file => confirm DB entry.
  - Retrieve the file by ID => 200 or a redirect.
  - Delete => confirm it's removed or marked as deleted.

"npm run test:files" => ensure all passes.

Note: Large file handling or chunking is out of scope here, but mention it if needed.

**Additional Notes:**  
- Emphasize sanitizing file names or using a random UUID. 
- Mention environment variables for S3 credentials if relevant.

---

## 9. Search Implementation (TDD for /search)

**Context files to include:**  
- `backend_plan.md`
- `openapi.json` (/search endpoint)

**Prompt:**
In "src/routes/search":
- "search.controller.ts", "search.service.ts", "search.test.ts".
- GET /v1/search => params: keyword, workspaceId, includeArchived, includeDeleted.

In "search.service.ts":
- Basic SQL queries using ILIKE '%keyword%' for:
  - Channels (name)
  - Messages (content) => exclude deleted unless asked
  - Users (displayName) => exclude deactivated unless asked
- Possibly filter by workspaceId if provided.

In "search.test.ts":
- TDD:
  - Searching for known keyword => expect correct matches.
  - Confirm archived/deleted items are excluded unless the relevant flag is true.
  - 200 OK with JSON array of results.

"npm run test:search" => confirm pass.

(Optional) If you plan to scale, mention Postgres full-text search or external index.

**Additional Notes:**  
- Remind devs to use parameterized queries to avoid SQL injection. 
- Could do a multi-tenant approach if needed.

---

## 10. Reactivation Endpoints & TDD

**Context files to include:**  
- `backend_plan.md`
- `openapi.json` (/users/{userId}/reactivate)

**Prompt:**
In "src/routes/users/users.controller.ts" (or "reactivation.controller.ts"):
- POST /v1/users/{userId}/reactivate => set deactivated=false.

In "users.test.ts":
- TDD:
  - Reactivating a user => returns updated user with deactivated=false.
  - 404 if user not found.
  - (Optional) If only admins can do this, return FORBIDDEN if caller lacks role.

Ensure "npm run test:users" covers reactivation.

**Additional Notes:**  
- If you want an auditing approach to see who reactivated them, store that in a separate field. 
- Ties into your role-based approach (OWNER, ADMIN, etc.).

---

## 11. Observability & Deployment (Docker + TDD for Infra)

**Context files to include:**  
- `backend_plan.md`

**Prompt:**
In backend, create "Dockerfile" to containerize the Node.js app:
```dockerfile
FROM node:18-alpine (or your chosen Node version)
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

At the monorepo root, create "docker-compose.yml" that spins up:
- Postgres container
- Redis container
- The backend container
- Optionally the frontend if you like

Create "tests/infra/infra.test.js" that:
- Launches containers or assumes they're running
- Checks "/v1/health" from inside Docker or a local request
- Verifies logs (Winston/Pino) if needed

Provide "npm run test:infra" script.
Document how to run "docker-compose up --build" to bring everything up.

Summarize how to push to staging/production:
- E.g., Docker image pushed to a registry.
- Mention environment variable handling (like .env or docker-compose.override.yml for secrets).

**Additional Notes:**  
- Emphasize reading secrets from environment variables in Docker environment, not hardcoded in code.

---

## 12. Frontend Setup & Shared Types (TDD with Jest & React Testing Library)

**Context files to include:**  
- `frontend_plan.md`
- `components.json`

**Prompt:**
In "frontend":
- Create a React + TypeScript app (Next.js, CRA, or Vite).

In "frontend/package.json", install:
- react, react-dom, @reduxjs/toolkit, react-router, jest, react-testing-library, etc.

In "shared":
- Create "enums.ts" or "consts.ts" with presence states, channel types, workspace roles, etc.
- Example: export enum PresenceState { ONLINE = 'ONLINE', AWAY = 'AWAY', DND = 'DND', OFFLINE = 'OFFLINE' }

In "frontend/src/App.tsx":
- Set up Redux store.
- Optionally set up React Router or Next.js pages.
- Render "Hello Slack Clone" to confirm the setup.

In "frontend/tests/App.test.tsx":
- Use React Testing Library to render <App /> and check it displays "Hello Slack Clone".

Run "npm run test" in the frontend folder => confirm pass.

(Optional) Add ESLint & Prettier for the frontend code style.

Show an example import from shared: import { PresenceState } from '@shared/enums';

**Additional Notes:**  
- Ensure your monorepo is configured so the frontend can import from "shared" easily (using relative paths or workspace alias).
- If using Next.js, you can adapt these steps accordingly.

---

## 13. Basic UI Components & Layout (WorkspaceNavigation, ChannelList) + TDD

**Context files to include:**  
- `frontend_plan.md`
- `components.json` (WorkspaceNavigation, ChannelList)

**Prompt:**
Create "src/components/WorkspaceNavigation":
- WorkspaceNavigation.tsx
- WorkspaceNavigation.test.tsx
- Use typed props from components.json
- TDD: ensures it renders a list of workspaces (excluding archived by default)
- Tests onSelectWorkspace callback, onCreateWorkspace.

Create "ChannelList":
- ChannelList.tsx
- ChannelList.test.tsx
- Lists channels (archived=false unless requested).
- TDD for adding a new channel, etc.

Add each to Storybook:
- "WorkspaceNavigation.stories.mdx"
- "ChannelList.stories.mdx"
- Show usage examples with mock data.

Run "npm run test" => confirm passing.
Run "npm run storybook" => confirm components appear.

(Optionally) Connect these components to Redux or RTK Query to fetch real data from the backend placeholders.

**Additional Notes:**  
- If you handle membership or role-based UI in these components, mention it in tests (e.g., only admins see "Create Channel").

---

## 14. Direct Messages, ChatArea, and MessageInputBox + TDD

**Context files to include:**  
- `frontend_plan.md`
- `components.json` (DirectMessagesList, ChatArea, MessageInputBox)

**Prompt:**
Create "DirectMessagesList":
- DirectMessagesList.tsx
- DirectMessagesList.test.tsx
- TDD for listing DM threads, onNewDm callback.

Create "ChatArea":
- ChatArea.tsx
- ChatArea.test.tsx
- TDD ensures "deleted=true" messages appear as "This message was removed."

Create "MessageInputBox":
- MessageInputBox.tsx
- MessageInputBox.test.tsx
- TDD for onSendMessage, onEmojiInsert, file uploads.

Optionally create "pages/ChatPage.tsx" or a route where these components integrate:
- Verify they connect properly.

Add Storybook stories for each.
Confirm "npm run test" passes for them.

**Additional Notes:**  
- If you have theming in place, you can show how the ChatArea changes in dark mode. 
- For file uploads, consider a small "mocked" function in the test.

---

## 15. Overlays & Additional Features (FileSharingOverlay, SearchBar, BaseOverlay) + TDD

**Context files to include:**  
- `frontend_plan.md`
- `components.json` (FileSharingOverlay, SearchBar, BaseOverlay)

**Prompt:**
Create "BaseOverlay":
- BaseOverlay.tsx
- BaseOverlay.test.tsx
- TDD: visible prop => toggles overlay. onClose => calls the callback.

Create "FileSharingOverlay":
- FileSharingOverlay.tsx
- FileSharingOverlay.test.tsx
- TDD: picking files, selecting recipients, clicking upload => calls onUploadFiles.

Create "SearchBar":
- SearchBar.tsx
- SearchBar.test.tsx
- TDD: calls onSearch with keyword, respects filters (includeArchived, etc.).

Add stories in Storybook:
- "BaseOverlay.stories.mdx"
- "FileSharingOverlay.stories.mdx"
- "SearchBar.stories.mdx"

Run "npm run test". Then "npm run storybook" to confirm.

**Additional Notes:**  
- If you have a global theming approach, mention how Overlays are styled accordingly. 
- Could also test smaller sub-components like the file drag/drop zone.

---

## 16. EmojiReactionPicker & Preferences (TDD)

**Context files to include:**  
- `frontend_plan.md`
- `components.json` (EmojiReactionPicker, PreferencesOverlay)

**Prompt:**
Create "EmojiReactionPicker":
- EmojiReactionPicker.tsx
- EmojiReactionPicker.test.tsx
- TDD: load emojis from backend (mock?), exclude deleted.
- Searching filters results, onSelectEmoji => callback invoked.

Create "PreferencesOverlay":
- PreferencesOverlay.tsx
- PreferencesOverlay.test.tsx
- TDD: user can change theme (light/dark).
- Possibly update notification settings.

Add .mdx stories for each:
- "EmojiReactionPicker.stories.mdx"
- "PreferencesOverlay.stories.mdx"

Confirm "npm run test" => pass. Quick manual test in Storybook.

**Additional Notes:**  
- If your Slack Clone has advanced preference settings, mention them here. 
- Show how you tie theme changes into a global Redux store or context.

---

## 17. NewChannelGroupCreationOverlay & Admin Reactivation UI + TDD

**Context files to include:**  
- `frontend_plan.md`
- `components.json` (NewChannelGroupCreationOverlay)

**Prompt:**
Create "NewChannelGroupCreationOverlay":
- NewChannelGroupCreationOverlay.tsx
- NewChannelGroupCreationOverlay.test.tsx
- TDD: onCreate => create channel or multi-user DM.

Implement an "AdminUserManagement" overlay/page:
- AdminUserManagement.tsx
- AdminUserManagement.test.tsx
- Lists deactivated users, calls POST /v1/users/{userId}/reactivate on click.
- If not an admin, hide or disable.

Add stories for "NewChannelGroupCreationOverlay" in Storybook.
Run "npm run test" => confirm pass.

**Additional Notes:**  
- If role-based checks matter, ensure you only show "AdminUserManagement" to admins. 
- Some Slack Clones might let an OWNER see more than an ADMIN.

---

## 18. Final Integration, E2E Testing (Cypress or Playwright)

**Context files to include:**  
- `backend_plan.md`
- `frontend_plan.md`
- `openapi.json`

**Prompt:**
Install Cypress or Playwright in the monorepo root.
Create "cypress" or "playwright" folder in root or "frontend/tests/e2e".

Write a full E2E test that does:
- Register a user
- Login
- Create a workspace
- Create a channel
- Send a message
- Soft-delete the message
- Reactivate a deactivated user

Provide "npm run e2e" that:
- Spins up backend + frontend containers or processes (docker-compose or separate terminals).
- Runs Cypress/Playwright.

Ensure screenshots or videos are optional.
Show how membership checks + presence updates appear in a real environment.

At the end, confirm the Slack Clone flow is fully operational.

**Additional Notes:**  
- You might do separate scripts: "npm run e2e:open" for interactive mode, "npm run e2e:run" for headless.
- For a real test environment, you can specify an ephemeral DB in Docker.

---

## 19. Real-Time Enhancements (WebSockets) + TDD

**Context files to include:**  
- `backend_plan.md` (real-time presence)

**Prompt:**
Integrate Socket.io or a similar library:
- "src/socket.ts" => initializes Socket.io with the Express server.
- Use Redis as a pub/sub adapter if you want horizontal scaling.

"tests/socket/socket.test.ts":
- Spin up a test Socket.io server.
- Connect a client (via socket.io-client).
- Emit "user joined channel", "user is typing".
- Expect server to broadcast presence updates or new message events.

In the frontend, add a small integration:
- useEffect(() => { socket.on('message', handleNewMessage) }) in ChatArea or so.

"npm run test:socket" => confirm pass.

Ensure membership checks are respected in socket events (only broadcast to members).

**Additional Notes:**  
- If you store presence in Redis, also mention the approach for ephemeral data or advanced use cases (like custom events).

---

## 20. Final Review & Future Enhancements

**Context files to include:**  
- *All documentation as needed*

**Prompt:**
Conduct a final review of:
- TDD coverage across all endpoints, services, and components.
- Soft-deletion correctness.
- Real-time presence checks.
- Role-based access (ADMIN vs MEMBER).

Propose next steps:
- Advanced search (Elasticsearch or Postgres full-text)
- Video calls integration
- Performance scaling
- CI/CD pipeline (e.g. GitHub Actions) to run tests on each commit

Create "PROJECT_SUMMARY.md" explaining:
- The architecture (monorepo, Node/React, DB schema)
- How TDD was applied
- Final results and known limitations
- Steps for environment variable handling (.env), Docker usage, logs (docker-compose logs -f)

That concludes the full build. Now you have a Slack Clone with TDD and real-time features.

**Additional Notes:**  
- Encourage a "npm run coverage" or "yarn coverage" to see code coverage.
- Show how environment variables are used in production vs. staging.
- Summarize how to enforce membership, presence, and role checks thoroughly.

---

## Conclusion

By following these **20 steps** in order—copying each **Prompt** and providing the **Context files** to o1-pro exactly as stated—you can systematically build a Slack Clone application from scratch using TDD principles. The **guide integrates all feedback** about environment variable usage, Node version recommendations, Docker strategies, role-based checks, real-time presence, and additional security (rate-limiting, injection prevention, etc.).

Enjoy your fully tested Slack Clone project!
