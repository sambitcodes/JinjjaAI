from fastapi import APIRouter
from backend.app.api.v1 import auth, lessons, tutor, speech, progress, speaking, conversation, grammar_lab, pls_lab, notes, shadow_dj, context_detective, register_roulette

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(lessons.router, prefix="/lessons", tags=["lessons"])
api_router.include_router(tutor.router, prefix="/tutor", tags=["tutor"])
api_router.include_router(speech.router, prefix="/speech", tags=["speech"])
api_router.include_router(progress.router, prefix="/progress", tags=["progress"])
api_router.include_router(speaking.router, prefix="/speaking", tags=["speaking"])
api_router.include_router(conversation.router, prefix="/conversation", tags=["conversation"])
api_router.include_router(grammar_lab.router, prefix="/grammar-lab", tags=["grammar-lab"])
api_router.include_router(pls_lab.router, prefix="/pls-lab", tags=["pls-lab"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(shadow_dj.router, prefix="/shadow-dj", tags=["shadow-dj"])
api_router.include_router(context_detective.router, prefix="/context-detective", tags=["context-detective"])
api_router.include_router(register_roulette.router, prefix="/register-roulette", tags=["register-roulette"])




