from pydantic import BaseModel

class PronunciationScoreResponse(BaseModel):
    accuracy_score: float
    target_text: str
    transcription: str
    phoneme_details: dict

class STTResponse(BaseModel):
    transcription: str
    language: str = "ko"
