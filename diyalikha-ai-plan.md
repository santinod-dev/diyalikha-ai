# DiyaLikha AI — Implementation Plan

## Top-Level Overview

**Goal:** Transform the existing React/TypeScript UI prototype into a fully functional web application backed by a Python/FastAPI server, Firebase (Auth + Firestore + Storage), and IBM watsonx Orchestrate for multi-agent AI orchestration.

**Scope:**
- Python FastAPI backend as the API layer between the frontend and watsonx Orchestrate
- Firebase Authentication (email/password)
- Firestore for user library persistence
- Firebase Storage for uploaded lesson files
- IBM Cloud + watsonx Orchestrate provisioning with three specialist agents:
  - **A1 — Context & Linguist Agent** (dialect-aware translation AND pedagogical adaptation, merged)
  - **A2 — Bao Agent** (dedicated teaching assistant chatbot with teacher-assistant persona)
  - **A3 — Quality Checker Agent** (grammar, clarity, dialect accuracy + proofreading suggestions)
- Frontend integration: replace all mock/hardcoded data with live API calls

**Non-goals:**
- Mobile app
- Third-party LMS integrations
- Advanced analytics dashboard
- PPTX export (PDF and DOCX only for now)

**Recommended Stack:**
| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite (existing) | Already built |
| Backend API | Python 3.11 + FastAPI | Best watsonx SDK support, async-friendly |
| Auth | Firebase Authentication | User's choice |
| Database | Firebase Firestore | User's choice |
| File Storage | Firebase Storage | User's choice |
| AI Orchestration | IBM watsonx Orchestrate | Core requirement |
| LLM | IBM watsonx.ai (granite / llama models) | Hosted within IBM Cloud |
| RAG Knowledge Base | watsonx.ai Vector Index (seeded via IBM Console) | Philippine language dictionaries, DepEd curriculum |
| Deployment | IBM Code Engine (backend) + Firebase Hosting (frontend) | IBM ecosystem alignment |

---

## Architecture Flow

```
User Browser (React SPA)
    │
    ├── Firebase Auth SDK  ──►  Firebase Authentication
    │
    ▼
Python FastAPI Backend  (IBM Code Engine)
    │   ├── /translate       → watsonx Orchestrate (A1 → A3 pipeline)
    │   ├── /proofread       → watsonx Orchestrate (A3 Quality Checker)
    │   ├── /chat            → watsonx Orchestrate (A2 Bao Agent)
    │   ├── /files           → Firebase Storage upload/download URLs
    │   └── /library         → Firestore CRUD
    │
    ▼
watsonx Orchestrate (Planner/Orchestrator)
    ├── A1 Context & Linguist Agent  →  watsonx.ai LLM + RAG knowledge base (translation + grade adaptation)
    ├── A2 Bao Agent                 →  watsonx.ai LLM (dedicated teacher chatbot persona)
    └── A3 Quality Checker Agent     →  watsonx.ai LLM (grammar, dialect accuracy, proofreading)
```

---

## Sub-Tasks

---

### Sub-Task 1 — IBM Cloud + watsonx Orchestrate Provisioning

**Status:** `[x] done`

**Intent:**
Set up the IBM Cloud environment and provision watsonx Orchestrate so the rest of the AI integration has a live target to connect to.

**Expected Outcomes:**
- IBM Cloud account active with a resource group named `diyalikha-ai`
- watsonx Orchestrate instance provisioned (Plus or Enterprise plan)
- watsonx.ai instance provisioned in the same region
- API key and service credentials stored securely for use by the backend
- Three agents created in watsonx Orchestrate (A1, A2, A3) with initial system prompts
- RAG knowledge base documents manually seeded via IBM Console
- An Orchestrator (Planner) flow created that routes translation tasks through A1 → A3
- A separate Bao chat flow that routes directly to A2

**Todo List:**
1. Create an IBM Cloud account at cloud.ibm.com
2. Create a resource group named `diyalikha-ai`
3. Provision **watsonx Orchestrate** (Dallas or Frankfurt region) under the resource group
4. Provision **watsonx.ai** in the same region; select `ibm/granite-13b-chat-v2` or `meta-llama/llama-3-70b-instruct` as the base LLM
5. Generate an IBM Cloud API key and note the watsonx Orchestrate service URL
6. In the IBM Console under watsonx.ai, manually seed the RAG knowledge base with the following document categories:
   - Philippine Language Dictionaries & Termbases (Waray, Ilocano, Cebuano, Bicolano, Kapampangan, Hiligaynon)
   - DepEd Curriculum Standards documents
   - Regional & Local Educational Terms
   - Cultural & Community Knowledge documents
   - Lesson Templates & Teaching Resources
   - Pedagogical Guides & Best Practices
7. In watsonx Orchestrate, create **Agent A1 — Context & Linguist Agent** (merged translator + educator)
   - System prompt: instructs the agent to (1) analyze the source text and the target Philippine dialect, (2) produce a culturally localized translation using correct dialect terminology from the knowledge base, and (3) adapt the content to the selected grade level and subject area, aligning with DepEd learning objectives — all in a single pass
   - Tools: RAG search over the seeded knowledge base
8. Create **Agent A2 — Bao Agent** (dedicated teacher chatbot)
   - System prompt: instructs the agent to act as "Bao", a friendly Filipino AI teaching assistant. Bao helps teachers create lesson plans, activities, worksheets, and quizzes. Bao responds in the teacher's chosen output language and adapts to the specified grade level and learning style. When file context is provided, Bao references the content of that localized material.
   - Tools: none (conversational only)
9. Create **Agent A3 — Quality Checker Agent**
   - System prompt: instructs the agent to review the translated and adapted text, check grammar, fluency, dialect accuracy, and cultural relevance for the target grade level, and return a structured JSON response with a `quality_score` (0–100) and a `suggestions` array where each item has `severity` (critical/major/suggestion), `original`, `corrected`, and `reason` fields
10. Create the **Translation Orchestrator flow**: A1 → A3 in sequence; the Planner passes the full user context (text, dialect, grade level, subject area) to A1, then forwards A1's output to A3, and returns both the translated material and the quality report
11. Create a separate **Bao chat flow** that routes directly to A2 with the user's message, output language, grade level, learning style, and optional file context
12. Note the flow IDs for both flows; store the following in a `.env` file template: `IBM_API_KEY`, `WATSONX_ORCHESTRATE_URL`, `WATSONX_PROJECT_ID`, `TRANSLATION_FLOW_ID`, `BAO_CHAT_FLOW_ID`

**Relevant Context:**
- IBM watsonx Orchestrate docs: https://www.ibm.com/docs/en/watsonx-orchestrate
- RAG knowledge base is seeded manually — no ingestion pipeline code is needed
- A1 is now a single merged agent that does both translation and grade-level adaptation
- A2 (Bao) is a standalone conversational agent, completely separate from the translation pipeline

---

### Sub-Task 2 — Firebase Project Setup

**Status:** `[x] done`

**Intent:**
Create and configure the Firebase project so Authentication, Firestore, and Storage are ready for the frontend and backend to use.

**Expected Outcomes:**
- Firebase project `diyalikha-ai` created in Firebase Console
- Email/password Authentication provider enabled
- Firestore database created with security rules requiring authenticated users
- Firebase Storage bucket created with security rules requiring authenticated users
- Firebase web SDK config values available for the frontend `.env`
- Firebase Admin SDK service account key available for the backend `.env`

**Todo List:**
1. Go to console.firebase.google.com and create project `diyalikha-ai`
2. Enable **Authentication → Email/Password** provider
3. Create **Firestore** database in production mode (region: us-central1 or nearest)
4. Define Firestore security rules: authenticated users can read/write only their own documents under `users/{userId}/library/{docId}`
5. Create **Firebase Storage** bucket; set security rules to allow authenticated users to read/write `users/{userId}/**`
6. Register a **web app** in Firebase project settings; copy the SDK config object
7. Generate a **Firebase Admin SDK service account** key (JSON) for the backend
8. Create `frontend/.env.example` with Firebase web config keys prefixed `VITE_FIREBASE_*`
9. Create `backend/.env.example` with `FIREBASE_SERVICE_ACCOUNT_PATH` and IBM Cloud keys

**Relevant Context:**
- Frontend Firebase SDK initialization will go in `frontend/src/lib/firebase.ts` (new file)
- Backend will use `firebase-admin` Python package

---

### Sub-Task 3 — Python FastAPI Backend Scaffold

**Status:** `[x] done`

**Intent:**
Create the backend project structure, install dependencies, and implement the foundational API layer including health check, Firebase Admin initialization, and authentication middleware.

**Expected Outcomes:**
- `backend/` directory created with FastAPI app, Pydantic models, and router structure
- Firebase Admin SDK initialized; JWT token from Firebase Auth is verified on protected routes
- `/health` endpoint returns 200
- `/auth/me` endpoint returns the current authenticated user's UID
- `backend/requirements.txt` lists all dependencies
- Backend runs locally with `uvicorn main:app --reload`

**Todo List:**
1. Create `backend/` directory with the following structure:
   ```
   backend/
   ├── main.py               # FastAPI app entry, CORS, routers
   ├── requirements.txt
   ├── .env.example
   ├── routers/
   │   ├── translate.py      # POST /translate
   │   ├── proofread.py      # POST /proofread
   │   ├── chat.py           # POST /chat
   │   ├── files.py          # POST /files/upload, GET /files/{file_id}
   │   └── library.py        # CRUD /library
   ├── services/
   │   ├── watsonx.py        # watsonx Orchestrate API calls
   │   ├── firebase_storage.py  # Firebase Storage signed URLs
   │   └── firestore.py      # Firestore read/write helpers
   ├── models/
   │   └── schemas.py        # Pydantic request/response models
   └── middleware/
       └── auth.py           # Firebase JWT verification dependency
   ```
2. Add to `requirements.txt`: `fastapi`, `uvicorn[standard]`, `python-dotenv`, `httpx`, `firebase-admin`, `python-multipart`, `pydantic`, `ibm-watsonx-ai`
3. Implement Firebase Admin initialization in `main.py` using service account from env
4. Implement `middleware/auth.py`: extract Bearer token from Authorization header, verify with `firebase_admin.auth.verify_id_token()`, return decoded UID
5. Implement `/health` and `/auth/me` endpoints
6. Add CORS middleware allowing requests from the frontend dev origin

**Relevant Context:**
- Frontend currently has no API calls; all pages use local state
- The `ibm-watsonx-ai` Python SDK supports watsonx Orchestrate agent invocation

---

### Sub-Task 4 — watsonx Orchestrate API Integration (Backend Services)

**Status:** `[x] done`

**Intent:**
Implement the backend service layer that calls watsonx Orchestrate agents and returns structured responses for translation, proofreading, and chat.

**Expected Outcomes:**
- `POST /translate` accepts file text + context params, calls the A1→A3 pipeline, returns translated material and quality report
- `POST /proofread` accepts translated text, calls A3 directly, returns structured proofreading suggestions
- `POST /chat` accepts a message + context, calls the dedicated Bao (A2) chat flow, returns AI response
- All endpoints require a valid Firebase JWT

**Todo List:**
1. In `services/watsonx.py`, implement `invoke_orchestrate_flow(flow_id, payload)` using `httpx` to call the watsonx Orchestrate REST API with IBM Cloud IAM bearer token
2. Implement IBM Cloud IAM token exchange: POST to `iam.cloud.ibm.com/identity/token` with API key to get short-lived access token; cache it until expiry; use `TRANSLATION_FLOW_ID` and `BAO_CHAT_FLOW_ID` from env
3. In `routers/translate.py`:
   - Accept `TranslateRequest` (Pydantic): `text: str`, `grade_level: str`, `subject_area: str`, `target_dialect: str`, `source_language: str`
   - Call the translation orchestrator flow (A1 → A3) using `TRANSLATION_FLOW_ID`
   - Return `TranslateResponse`: `translated_text: str`, `bilingual_script: str`, `key_terms: list`, `quality_score: float`
4. In `routers/proofread.py`:
   - Accept `ProofreadRequest`: `text: str`, `dialect: str`, `grade_level: str`
   - Call the A3 Quality Checker agent directly (can reuse the same flow or invoke A3 agent independently)
   - Return `ProofreadResponse`: `suggestions: list[Suggestion]` where each Suggestion has `severity`, `original`, `corrected`, `reason`, `position`
5. In `routers/chat.py`:
   - Accept `ChatRequest`: `message: str`, `output_language: str`, `grade_level: str`, `learning_style: str`, `file_context: str | None`
   - Call the Bao chat flow using `BAO_CHAT_FLOW_ID` — this routes to A2 (Bao Agent) only, completely separate from the translation pipeline
   - Return `ChatResponse`: `content: str`
6. Write error handling: if watsonx returns non-200, return HTTP 502 with message

**Relevant Context:**
- `services/watsonx.py` is consumed by all three routers
- A3 proofreading response must be parseable JSON (instruct the A3 agent to respond in JSON format via system prompt)

---

### Sub-Task 5 — File Upload and Library API (Backend)

**Status:** `[x] done`

**Intent:**
Implement file upload to Firebase Storage (with text extraction) and Firestore-backed library CRUD so users can persist their materials.

**Expected Outcomes:**
- `POST /files/upload` accepts multipart file upload, extracts text, stores file in Firebase Storage, saves metadata to Firestore, returns extracted text + document ID
- `GET /library` returns the authenticated user's saved library items
- `POST /library` creates a new library item (after translation completes)
- `PATCH /library/{doc_id}` updates status or content
- `DELETE /library/{doc_id}` removes an item

**Todo List:**
1. Add `pypdf2`, `python-docx` to `requirements.txt` for text extraction
2. In `routers/files.py`:
   - Accept multipart upload (PDF, DOCX, TXT)
   - Extract text: use `pypdf2` for PDF, `python-docx` for DOCX, direct read for TXT
   - Upload original file to Firebase Storage at `users/{uid}/uploads/{filename}`
   - Return `{doc_id, extracted_text, storage_url}`
3. In `services/firestore.py`, implement helpers: `create_library_item`, `get_library_items`, `update_library_item`, `delete_library_item`
4. Firestore document schema for a library item:
   - `uid`, `title`, `category`, `grade`, `subtitle` (dialect pairing), `status` (processing/complete/review/error), `storage_url`, `translated_text`, `created_at`, `updated_at`
5. In `routers/library.py`, implement all CRUD endpoints using Firestore helpers
6. Ensure all library endpoints check that the requesting user's UID matches the document's `uid` field

**Relevant Context:**
- `LibraryPage` in `frontend/src/app/App.tsx` (lines 1211–1276) currently uses hardcoded `BASE_CARDS`
- The `DraftFile` interface in App.tsx needs to be extended to match the Firestore schema

---

### Sub-Task 6 — Frontend Firebase Auth Integration

**Status:** `[x] done`

**Intent:**
Replace the current mock login in the frontend with real Firebase Authentication so users can register, log in, and receive a JWT for API calls.

**Expected Outcomes:**
- Firebase SDK initialized in `frontend/src/lib/firebase.ts`
- `LoginPage` component calls `createUserWithEmailAndPassword` / `signInWithEmailAndPassword`
- Auth state is managed via `onAuthStateChanged`; current user and ID token are available globally
- On logout, user is redirected back to the login view
- All API calls include `Authorization: Bearer <idToken>` header

**Todo List:**
1. Create `frontend/src/lib/firebase.ts`: initialize Firebase app using `VITE_FIREBASE_*` env vars; export `auth` and `storage` instances
2. Create `frontend/src/lib/api.ts`: export an `apiClient` (using `fetch` or `axios`) that automatically injects the Firebase ID token into every request header; points to the FastAPI backend URL from env var `VITE_API_URL`
3. Update `App.tsx`:
   - Import `onAuthStateChanged` from Firebase Auth
   - Replace `useState("login")` view init with an auth observer that sets view to `"home"` when a user is logged in and `"login"` when signed out
   - Store `firebaseUser` in state; expose `idToken` refresh via `user.getIdToken()`
4. Update `LoginPage` (`App.tsx` lines 400–619):
   - Replace `handleLogin` mock with `signInWithEmailAndPassword(auth, email, password)`
   - Replace register handler with `createUserWithEmailAndPassword(auth, email, password)`
   - Show error messages on invalid credentials
5. Add a logout button in the sidebar that calls `signOut(auth)`
6. Add loading spinner while auth state is being determined on initial load

**Relevant Context:**
- `LoginPage` is at `frontend/src/app/App.tsx` lines 400–619
- The `handleLogin` function (App.tsx ~line 1290) currently just sets `userName` and `view`
- `apiClient` in `frontend/src/lib/api.ts` will be shared by all subsequent frontend integration sub-tasks

---

### Sub-Task 7 — Frontend Translator Page Integration

**Status:** `[x] done`

**Intent:**
Connect the Translator page to the backend `/files/upload` and `/translate` endpoints so real AI-powered translation is performed and the result is displayed in the output panel.

**Expected Outcomes:**
- Uploading a file (PDF/DOCX/TXT) calls `POST /files/upload` and receives extracted text
- Clicking translate sends extracted text + context parameters to `POST /translate`
- The translated material is rendered in the output panel (right side of Translator page)
- A loading/spinner state is shown while the API call is in progress
- On success, the "Ready to Print" and "Proofread" buttons become active
- Translated content can be exported as PDF (client-side using browser print) or DOCX

**Todo List:**
1. In `TranslatorPage` (App.tsx lines 702–931), replace the file drop handler with a call to `apiClient.post("/files/upload", formData)`; store returned `{doc_id, extracted_text}` in component state
2. Add a "Translate" button handler that calls `apiClient.post("/translate", {...contextParams, text: extractedText})`
3. Add `isTranslating: boolean` state; show a spinner overlay on the output panel while the request is in progress
4. On response, populate the output panel with `translated_text` from the API response
5. Store `{doc_id, translated_text, quality_score}` in component state for use by Proofread mode
6. Implement PDF export: call `window.print()` with the output panel content styled for print
7. Implement DOCX export: use the `docx` npm package to generate a DOCX blob from the translated text and trigger a download
8. After a successful translation, call `apiClient.post("/library", {...metadata, translated_text})` to persist the result

**Relevant Context:**
- `TranslatorPage` in App.tsx lines 702–931
- Context parameters (grade level, subject area, target dialect) are already in state: `gradeLevel`, `subjectArea`, `targetDialect`
- The output panel already has a placeholder "Waiting for your ideas…" state to replace

---

### Sub-Task 8 — Frontend Proofread Mode Integration

**Status:** `[x] done`

**Intent:**
Connect the Proofreading Mode panel to the backend `/proofread` endpoint so AI-generated grammar, dialect accuracy, and clarity suggestions are displayed with the ability to accept, edit, or keep corrections.

**Expected Outcomes:**
- When the user clicks "Proofread" from the Translator page, the Proofread Mode panel opens with the translated text
- The text is sent to `POST /proofread`; returned suggestions are rendered in the right panel as Critical/Major/Suggestion items
- Words/phrases in the text editor are highlighted corresponding to each suggestion
- Clicking "Accept Correction" replaces the original text span with the corrected text
- Clicking "Apply All Corrections" applies all suggestions at once
- "Save as Draft" calls `PATCH /library/{doc_id}` with the updated text and status `review`

**Todo List:**
1. In `TranslatorPage`, when `transMode === "proofread"`, automatically call `apiClient.post("/proofread", {text, dialect, grade_level})` if proofreading data is not yet loaded
2. Store `suggestions: Suggestion[]` in component state; each suggestion has `severity`, `original`, `corrected`, `reason`, `position`
3. Render suggestions in the right panel grouped by severity (Critical → Major → Suggestion), matching the prototype design
4. Implement text highlighting: scan the translated text for each `original` substring and wrap it in a `<span>` with the appropriate severity color class
5. Implement "Accept Correction": replace the specific span with `corrected` text; remove the suggestion from the list
6. Implement "Apply All Corrections": iterate all suggestions and apply replacements
7. Track progress: show "X of Y addressed" counter matching the prototype
8. Connect "Save as Draft" to `apiClient.patch("/library/{doc_id}", {translated_text: currentText, status: "review"})`

**Relevant Context:**
- Proofread mode UI is in `TranslatorPage` (App.tsx lines 702–931) behind `transMode === "proofread"`
- A3 agent response schema must match the `Suggestion` type defined in `backend/models/schemas.py`

---

### Sub-Task 9 — Frontend Bao AI Assistant Integration

**Status:** `[x] done`

**Intent:**
Connect the Bao AI Assistant chatbot to the backend `/chat` endpoint, replacing hardcoded responses with live watsonx Orchestrate educator agent responses.

**Expected Outcomes:**
- Sending a message calls `POST /chat` with the message and output preferences
- The AI response streams into the chat bubble (or appears after loading indicator)
- Quick Actions (Lesson Plan, Activity, Summarize) pre-fill a prompt and submit
- The selected file from the library is passed as `file_context` to give the AI relevant material
- Chat history is maintained in component state for the session

**Todo List:**
1. In `AssistantPage` (App.tsx lines 950–1210), replace `quickActionResponses` mock with a call to `apiClient.post("/chat", {message, output_language, grade_level, learning_style, file_context})`
2. Add `isChatLoading: boolean` state; show a typing indicator (three dots) in a bot bubble while waiting
3. On response, append `{id, type: "bot", content: response.content}` to `chatHistory`
4. For Quick Actions, compose a pre-formed prompt string (e.g., "Create a 45-minute lesson plan for Grade 3 Science…") and call the same chat endpoint
5. Update the file selector in the left panel to fetch the user's library from `GET /library` (replacing hardcoded demo files)
6. When a file is selected, fetch its `translated_text` from the library item and pass it as `file_context`
7. Keep session chat history in component state (no persistence required for now)

**Relevant Context:**
- `AssistantPage` in App.tsx lines 950–1210
- `quickActionResponses` mock is at lines 994–1007
- Demo chat messages are at lines 1009–1035

---

### Sub-Task 10 — Frontend Library Page Integration

**Status:** `[x] done`

**Intent:**
Connect the My Library page to Firestore via the backend so users see their real saved materials, with correct statuses, and can delete or open files.

**Expected Outcomes:**
- Library page loads user's items from `GET /library` on mount
- Items show real status badges (Complete, Processing, Needs Review, Error)
- Clicking "View" on a complete item navigates to Translator page pre-loaded with that item's translated text
- Clicking "Retry" on an error item re-triggers translation
- Clicking "Review" opens Proofread mode for that item
- Items can be deleted

**Todo List:**
1. In `LibraryPage` (App.tsx lines 1211–1276), add a `useEffect` that calls `apiClient.get("/library")` on mount and stores results in `libraryItems` state
2. Replace `BASE_CARDS` with the API-fetched items; show a loading skeleton while fetching
3. Map the Firestore `status` field to the correct badge color/label
4. Implement "View" action: call `setView("translator")` and pass the library item's `translated_text` and `doc_id` as context so the Translator page pre-populates the output panel
5. Implement "Retry" action: call `POST /translate` with the item's original parameters; update status to processing
6. Implement "Review" action: call `setView("translator")`, set `transMode` to `"proofread"`, pass the item's translated text
7. Implement delete: call `DELETE /library/{doc_id}`, remove item from local state on success

**Relevant Context:**
- `LibraryPage` in App.tsx lines 1211–1276
- The `DraftFile` interface (App.tsx lines 22–30) will need updating to include `storage_url`, `translated_text`, and `doc_id`
- `BASE_CARDS` (App.tsx lines 88–95) can be removed once API is live

---

### Sub-Task 11 — Deployment

**Status:** `[ ] pending`

**Intent:**
Deploy the backend to IBM Code Engine and the frontend to Firebase Hosting so the full application is accessible publicly.

**Expected Outcomes:**
- Backend FastAPI app is containerized (Docker) and deployed to IBM Code Engine
- Frontend is built and deployed to Firebase Hosting
- Environment variables are set via IBM Code Engine secrets and Firebase `.env` build config
- Frontend `VITE_API_URL` points to the deployed Code Engine URL
- HTTPS is enabled on both services

**Todo List:**
1. Create `backend/Dockerfile`: use `python:3.11-slim`, install requirements, expose port 8080, run `uvicorn main:app --host 0.0.0.0 --port 8080`
2. Create `backend/.dockerignore` excluding `.env`, `__pycache__`, etc.
3. Push the Docker image to IBM Container Registry: `ibmcloud cr push`
4. Deploy to IBM Code Engine:
   - Create a Code Engine project `diyalikha-ai`
   - Create a Code Engine application pointing to the container image
   - Set environment variable secrets: `IBM_API_KEY`, `WATSONX_ORCHESTRATE_URL`, `WATSONX_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT` (base64-encoded JSON)
5. Note the deployed Code Engine URL
6. In the frontend project, set `VITE_API_URL` to the Code Engine URL in the build environment
7. Build the frontend: `cd frontend && pnpm build`
8. Deploy to Firebase Hosting: `firebase deploy --only hosting`
9. Update Firebase Auth authorized domains to include the Firebase Hosting URL
10. Smoke-test: register a new user, upload a file, run a translation end-to-end

**Relevant Context:**
- IBM Code Engine handles auto-scaling and HTTPS by default
- Firebase Hosting serves the Vite build output from `frontend/dist/`
