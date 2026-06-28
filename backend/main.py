import os
import firebase_admin
from firebase_admin import credentials
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import translate, proofread, chat, files, library, auth

load_dotenv()

# ── Firebase Admin init ────────────────────────────────────────────────────────
_sa_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
if _sa_path:
    cred = credentials.Certificate(_sa_path)
else:
    # Allow base64-encoded JSON via env var (for container deployments)
    import base64, json, tempfile
    sa_json = base64.b64decode(os.environ["FIREBASE_SERVICE_ACCOUNT"]).decode()
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".json")
    tmp.write(sa_json.encode())
    tmp.flush()
    cred = credentials.Certificate(tmp.name)

firebase_admin.initialize_app(cred)

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="DiyaLikha AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"),
        "https://diyalikha-ai.web.app",
        "https://diyalikha-ai.firebaseapp.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router,      prefix="/auth",    tags=["auth"])
app.include_router(translate.router, prefix="/translate", tags=["translate"])
app.include_router(proofread.router, prefix="/proofread", tags=["proofread"])
app.include_router(chat.router,      prefix="/chat",    tags=["chat"])
app.include_router(files.router,     prefix="/files",   tags=["files"])
app.include_router(library.router,   prefix="/library", tags=["library"])


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
