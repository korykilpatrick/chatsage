# Frontend Plan (v8 - Jest, React Testing Library, and MSW; **No Storybook**)

This **frontend plan** outlines how we'll build and integrate a React + TypeScript frontend for **ChatSage**, a Slack-like clone, within a **monorepo** that also houses the backend services. The plan follows a series of checkpoints, each of which must have *all tests passing* before moving on. Below are refinements and clarifications that incorporate best practices and feedback for iterating with Replit Agent in **small, context-rich prompts**.

> **Tip:** When pasting each checkpoint to Replit Agent, prepend a brief **Context** (e.g., “We’re at Checkpoint 2 of ChatSage; we have X code structure already…”) and an **Objective** (e.g., “We want a BaseOverlay component. See tasks below.”). Encourage Replit Agent to ask clarifying questions if anything is ambiguous.

---

## Core Principles

1. **Monorepo Setup**  
   - Frontend in the `client` folder (React + Vite + TS).  
   - Backend in the `server` folder with routes, controllers, and OpenAPI-generated code (`server/generated`).

2. **Shared Enums and Types**  
   - Keep naming (`userId`, `channelId`, `workspaceId`) consistent across front and back.  
   - Reference enumerations from the backend in a `types.ts` or `consts.ts`.

3. **State Management (Redux or Hooks)**  
   - We use `@reduxjs/toolkit` (optionally with RTK Query) for global state, or specialized React hooks (like `use-socket.ts`) to handle real-time updates.  
   - Consider bridging socket data to Redux if multiple components need it.

4. **Testing**  
   - We will use **Jest** for our unit and integration tests.  
   - **React Testing Library** will be used for component-level testing and assertions.  
   - **MSW (Mock Service Worker)** will be used to mock API calls so we can test without hitting real endpoints.  
   - Each checkpoint references tests. We aim for **100% pass rate** of relevant tests before moving on.

5. **Soft Deletion Awareness**  
   - The database uses `archived=true`, `deleted=true`, `deactivated=true` for workspace/channel/message/user.  
   - UI must optionally show or hide archived/deleted entities.

6. **User Reactivation**  
   - The backend can reactivate deactivated users (`POST /v1/users/{userId}/reactivate`).  
   - The UI might need a flow or overlay for that if needed.

7. **Encourage Clarifications**  
   - If Replit Agent (or developers) see ambiguity in tasks or domain, they should ask clarifying questions before implementing.

---

## Checkpoint 1: **Project Bootstrap & Environment**
1. **Context & Objective**  
   - We want a fully operational React + TS environment with Vite, plus a basic test harness (Jest, React Testing Library, MSW).  
   - We already have `client/main.tsx`, `vite.config.ts`, etc.

2. **Tasks**  
   - **Confirm Vite + React + TS Setup**: Ensure the dev server runs, hot reloading works.  
   - **Install & Configure Redux** (or confirm it’s installed): Decide if we use classic slices or RTK Query.  
   - **Install & Configure React Router**: For multi-page routes (e.g., login, chat, 404).  
   - **Create/Refine `types.ts`**: Move shared enums (ONLINE, AWAY, etc.) and channel types (PUBLIC, PRIVATE, DM) here to mirror the backend.  
   - **Testing**: 
     - Use **Jest** as our test runner.  
     - Use **React Testing Library** for component rendering and assertions.  
     - Use **MSW** to mock API calls in test environments.  
     - Possibly run `npm test` (or `pnpm test`) with a sample test to ensure everything is wired up.

3. **Testing Criteria**  
   - Run `npm run test` to ensure no errors.  
   - Confirm at least minimal coverage for the bootstrap code (e.g., a “smoke test” for `App.tsx`).

**Before moving to Checkpoint 2**  
- All existing and new tests must pass.  
- Replit Agent can provide help with any configuration issues or scripts.

---

## Checkpoint 2: **BaseOverlay & Common UI Pattern**
1. **Context & Objective**  
   - We have multiple overlay components (`dialog.tsx`, `drawer.tsx`, etc.). Create or refine a **BaseOverlay** component that standardizes modal-like behavior.

2. **Tasks**  
   - **Create `BaseOverlay`** (in `client/src/components/ui` or similar) with props:
     ```ts
     export interface BaseOverlayProps {
       visible: boolean;
       onClose: () => void;
       // Extend as needed
     }
     ```
   - **Implementation**: Possibly wrap your `dialog` or `drawer` for consistency.  

3. **Testing Criteria**  
   - Provide new or updated Jest tests using React Testing Library: `BaseOverlay.test.tsx`.  
   - Use MSW if any API call is needed (though an overlay might not need it yet).  
   - Run the test suite to confirm passing results.

**Before moving to Checkpoint 3**  
- Replit Agent can help generate a code snippet if needed.  
- All tests (overlay usage, interactions) must be green.

---

## Checkpoint 3: **WorkspaceNavigation**
1. **Context & Objective**  
   - Display and manage workspaces. Typically calls `WorkspacesApi` (`server/generated/api/workspacesApi.ts`).

2. **Tasks**  
   - **Create `WorkspaceNavigation`**: Show a list of workspaces (name, `archived` status, etc.).  
   - **Handle `onCreateWorkspace`**: Default to `archived=false`.  

3. **Testing Criteria**  
   - Write or update `WorkspaceNavigation.test.tsx` using React Testing Library + Jest + MSW to mock any backend calls.  
   - Ensure 100% pass rate.

**Before moving to Checkpoint 4**  
- All relevant tests must pass.

---

## Checkpoint 4: **ChannelList**
1. **Context & Objective**  
   - We already have `channel-list.tsx`. We’ll ensure it filters archived channels by default, possibly showing a toggle to “Show Archived.”

2. **Tasks**  
   - **Refine `channel-list.tsx`** to accept props like `showArchived?: boolean`.  
   - **Connect** to actual data, e.g., `channelsApi` or a socket-based approach if channels can update in real-time.  

3. **Testing Criteria**  
   - `channel-list.test.tsx` updated.  
   - Use MSW to mock channel data.  
   - Ensure passing coverage.

**Before moving to Checkpoint 5**  
- Tests must pass.

---

## Checkpoint 5: **DirectMessagesList**
1. **Context & Objective**  
   - DMs are channels with `channelType='DM'`. We can either extend `channel-list.tsx` or create a new `direct-messages-list.tsx`.

2. **Tasks**  
   - **Implement `DirectMessagesList`** (or unify with `channel-list` if it makes sense).  
   - **Props**: 
     ```ts
     interface DirectMessagesListProps {
       onNewDm: () => void;
       // ...
     }
     ```

3. **Testing Criteria**  
   - Possibly `direct-messages-list.test.tsx`.  
   - Use MSW for mocking DM endpoints.  
   - Confirm creation flow works if “New DM” is triggered.

**Before moving to Checkpoint 6**  
- All relevant tests must pass.

---

## Checkpoint 6: **ChatArea / MessageList**
1. **Context & Objective**  
   - We have `message-list.tsx` to display messages, including pinned, threaded, or deleted.  
   - Real-time updates from `use-socket.ts` might feed new messages in.

2. **Tasks**  
   - **Enhance `message-list.tsx`**:  
     - Show `deleted=true` messages as “This message was removed.”  
     - Possibly display pinned/reaction icons.  
     - Threading if you want nested replies (optional).  

3. **Testing Criteria**  
   - Update or create `message-list.test.tsx` using Jest + React Testing Library.  
   - Mock data with MSW or a local fixture.  
   - Confirm coverage for pinned/deleted messages.

**Before moving to Checkpoint 7**  
- All tests must pass.

---

## Checkpoint 7: **MessageInputBox**
1. **Context & Objective**  
   - We have `message-input.tsx` to handle sending messages, uploading files, etc.

2. **Tasks**  
   - **Refine `message-input.tsx`** to handle props like:
     ```ts
     onSendMessage(content: string): void;
     onUploadFile(file: File): void;
     onEmojiInsert(emoji: string): void;
     ```
   - Integrate with your real-time or Redux logic. Possibly show a preview of file attachments.

3. **Testing Criteria**  
   - `message-input.test.tsx`: ensure text/emoji/file uploads are tested with Jest + React Testing Library.  
   - Use MSW to mock the file upload endpoint if needed.  
   - All pass before next checkpoint.

---

## Checkpoint 8: **FileSharingOverlay**
1. **Context & Objective**  
   - Extend `BaseOverlayProps` to allow multiple file uploads. Could unify with `message-input` logic or be a separate overlay.

2. **Tasks**  
   - **Create or refine a `FileSharingOverlay`** component:
     ```ts
     interface FileSharingOverlayProps extends BaseOverlayProps {
       onUploadFiles: (files: File[]) => void;
     }
     ```
   - Possibly incorporate a drag-and-drop area.

3. **Testing Criteria**  
   - `FileSharingOverlay.test.tsx` with Jest + React Testing Library.  
   - MSW to mock upload endpoints.  
   - Ensure no regressions in message input’s file logic.

---

## Checkpoint 9: **SearchBar**
1. **Context & Objective**  
   - We have `searchApi.ts` on the backend. Provide a UI for searching messages, channels, or users.

2. **Tasks**  
   - **Implement `<SearchBar />`** in `ui/` or `components/chat/`.  
   - Add a filter option for archived/deleted if desired.

3. **Testing Criteria**  
   - `SearchBar.test.tsx` with React Testing Library + Jest.  
   - MSW to mock search endpoints.  
   - Confirm coverage.

**Before moving to Checkpoint 10**  
- Tests must pass.

---

## Checkpoint 10: **UserPresenceIndicator**
1. **Context & Objective**  
   - Expand `user-status.tsx` or rename to `UserPresenceIndicator`. Show `'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE'`.

2. **Tasks**  
   - **Integrate** real-time updates from `use-socket.ts` if possible.  
   - Display presence in the UI (avatar, status icon, etc.).

3. **Testing Criteria**  
   - `UserPresenceIndicator.test.tsx` updated.  
   - Confirm real-time updates are tested if feasible (using a socket mock or MSW fallback).

---

## Checkpoint 11: **UserStatusUpdateOverlay**
1. **Context & Objective**  
   - Let the user set a status message/emoji in an overlay.

2. **Tasks**  
   - **Create/Refine** an overlay extending `BaseOverlayProps`.  
   - Input for status text, optional emoji.

3. **Testing Criteria**  
   - `UserStatusUpdateOverlay.test.tsx`: test setting the status/emoji with React Testing Library.  
   - Use MSW if a backend call is required to save the status.  
   - All pass.

---

## Checkpoint 12: **EmojiReactionPicker**
1. **Context & Objective**  
   - We have `emojisApi.ts`; we want a component to browse or insert emojis (excluding `deleted=true` if that’s the desired logic).

2. **Tasks**  
   - **Implement `<EmojiReactionPicker />`**:
     ```ts
     interface EmojiReactionPickerProps {
       onSelectEmoji: (emojiId: number) => void;
       // ...
     }
     ```

3. **Testing Criteria**  
   - `EmojiReactionPicker.test.tsx`: test listing, filtering, selection with Jest + React Testing Library.  
   - Use MSW to mock the emoji list if necessary.  
   - Ensure coverage.

---

## Checkpoint 13: **PreferencesOverlay**
1. **Context & Objective**  
   - Let users switch theme, notification settings, etc. We have `theme.json` for theming. Possibly unify user reactivation if an admin.

2. **Tasks**  
   - **Implement** an overlay with theme toggles, notification toggles, etc.  
   - **Connect** to `use-user.ts` or Redux for saving preferences.

3. **Testing Criteria**  
   - `PreferencesOverlay.test.tsx` using Jest + React Testing Library.  
   - Use MSW to mock any preference-save endpoints.  
   - 100% pass rate.

---

## Checkpoint 14: **NewChannelGroupCreationOverlay**
1. **Context & Objective**  
   - Create new channels or multi-party DMs with `channelType=PRIVATE` or `DM`.

2. **Tasks**  
   - **Implement** a form to gather channel/DM details, default `archived=false`.  
   - Use `channelsApi.ts` for creation.

3. **Testing Criteria**  
   - `NewChannelGroupCreationOverlay.test.tsx` with Jest + React Testing Library.  
   - MSW for mocking creation.  
   - Confirm the creation flow works.

---

## Checkpoint 15: **Final Integration & Monorepo Polishing**
1. **Context & Objective**  
   - Tie all components together, finalize user reactivation flow (if needed), and do a cleanup pass.

2. **Tasks**  
   - **Wire Everything** with Redux or Hooks: Real-time from `use-socket.ts`, or direct calls to `server/generated/api`.  
   - **Styling & Responsiveness**: Confirm dark/light theme toggles, mobile breakpoints, etc.  
   - **User Reactivation**: If relevant, add a UI for `POST /v1/users/{userId}/reactivate`.  
   - **Refactor & Lint**: Remove dead code, fix code smells, ensure accessibility checks.  
   - **Deployment**: Combine build steps, confirm `npm run build` for both client & server, or Docker if used.

3. **Testing Criteria**  
   - Full suite of tests (unit, integration, possibly e2e) passes, including smoke tests under `server/__tests__`.  
   - Achieve final readiness for launch.

---

## Additional Guidance for Replit Agent Prompts

1. **Provide Context**  
   - Start each prompt with: “We’re at Checkpoint X, we have/do not have X or Y configured. Here’s what we want to achieve.”

2. **Break Down Large Checkpoints**  
   - If a checkpoint has multiple sub-tasks, feed them individually to Replit Agent for more focused assistance.

3. **Ask for Clarifications**  
   - If Replit Agent’s output seems ambiguous, ask it to clarify or refine.

4. **Explicit Testing Guidance**  
   - In each prompt, specify which test file(s) you expect to run (e.g., `BaseOverlay.test.tsx`) and what coverage you want.
   - Emphasize using **Jest**, **React Testing Library**, and **MSW** for mocking API calls.

5. **Show Example Before/After**  
   - For code changes (e.g., filtering archived channels), show a snippet of the current approach and the desired outcome.

6. **Reference Generated APIs**  
   - Mention calls to `channelsApi`, `searchApi`, `workspacesApi`, etc., so Replit Agent knows how your data flows.

By following this updated plan (v8) and leveraging Jest, React Testing Library, and MSW, you’ll maintain a stable, well-documented, and well-tested frontend codebase that aligns with your Slack-like ChatSage application. Remember: *At each checkpoint, ensure all tests pass before moving on.* If you have any questions, prompt Replit Agent for clarifications. Good luck building ChatSage!
