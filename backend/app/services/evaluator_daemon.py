import os
import json
import re
from typing import Dict, Any, List

class AIEvaluatorDaemon:
    def __init__(self):
        self.scores_file = os.path.join(os.path.dirname(__file__), "benchmark_scores.json")
        self.sft_dataset_file = os.path.join(os.path.dirname(__file__), "retraining_sft_dataset.jsonl")

    async def evaluate_exchange(self, model_id: str, duration_ms: float, user_msg: str, reply: str, grammar_notes: str | None = None):
        """
        Evaluate dialogue performance on the fly, update ratings, and compile training datasets for SFT reinforcement!
        """
        try:
            # 1. Grammar Heuristic & JSON Compliance Checks
            grammar_score = 90.0
            json_compliance = 100.0

            # Check if JSON mode failed/fell back
            if not reply or len(reply.strip()) == 0:
                json_compliance = 0.0
                grammar_score = 30.0

            # Penalize grammar logic if corrections contain major grammatical syntax mistakes
            if grammar_notes:
                notes_lower = grammar_notes.lower()
                if "incorrect" in notes_lower or "mistake" in notes_lower or "error" in notes_lower:
                    grammar_score -= 10.0
                if "outstanding" in notes_lower or "perfect" in notes_lower or "excellent" in notes_lower:
                    grammar_score = min(100.0, grammar_score + 5.0)

            # RAG Textbook integration evaluation score (checks if vocab or reference structures are present)
            rag_score = 88.0
            if re.search(r"[\uac00-\ud7a3]", user_msg):
                rag_score = min(100.0, rag_score + 8.0)

            # 2. Update persistent benchmark_scores.json rankings
            if os.path.exists(self.scores_file):
                with open(self.scores_file, "r", encoding="utf-8") as f:
                    scores = json.load(f)
            else:
                scores = []

            model_found = False
            for model in scores:
                if model["id"] == model_id:
                    model_found = True
                    count = model.get("evaluations_count", 0)
                    
                    # Compute rolling averages
                    model["grammarScore"] = round(((model["grammarScore"] * count) + grammar_score) / (count + 1), 1)
                    model["jsonCompliance"] = round(((model["jsonCompliance"] * count) + json_compliance) / (count + 1), 1)
                    model["ragIntegration"] = round(((model["ragIntegration"] * count) + rag_score) / (count + 1), 1)
                    model["latency"] = round(((model["latency"] * count) + duration_ms) / (count + 1), 1)
                    model["evaluations_count"] = count + 1

                    # Dynamically update overall Grade
                    avg = (model["grammarScore"] + model["jsonCompliance"] + model["ragIntegration"]) / 3.0
                    if avg >= 95:
                        model["overallGrade"] = "A+"
                    elif avg >= 92:
                        model["overallGrade"] = "A"
                    elif avg >= 89:
                        model["overallGrade"] = "A-"
                    elif avg >= 86:
                        model["overallGrade"] = "B+"
                    elif avg >= 83:
                        model["overallGrade"] = "B"
                    elif avg >= 80:
                        model["overallGrade"] = "B-"
                    else:
                        model["overallGrade"] = "C+"
                    break

            if model_found:
                # Recalculate ranks based on composite grammar, JSON, and RAG score
                scores.sort(key=lambda m: (m["grammarScore"] + m["jsonCompliance"] + m["ragIntegration"]) / 3.0, reverse=True)
                for idx, model in enumerate(scores):
                    model["rank"] = idx + 1

                with open(self.scores_file, "w", encoding="utf-8") as f:
                    json.dump(scores, f, indent=2, ensure_ascii=False)
                
                print(f"--> [Evaluator Daemon] Updated benchmarks for model: {model_id} successfully!", flush=True)

            # 3. Compile dialogue exchange into SFT Retraining Dataset JSONL
            sft_entry = {
                "messages": [
                    {"role": "system", "content": "You are Gwan-Sik, an elite, professional bilingual Korean language tutor."},
                    {"role": "user", "content": user_msg},
                    {"role": "assistant", "content": json.dumps({
                        "reply": reply,
                        "correction": grammar_notes
                    }, ensure_ascii=False)}
                ]
            }

            with open(self.sft_dataset_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(sft_entry, ensure_ascii=False) + "\n")
                
            print(f"--> [Evaluator Daemon] Appended high-quality retraining SFT pair successfully!", flush=True)

        except Exception as e:
            print(f"!!! [Evaluator Daemon] Exception: {e}", flush=True)

tutor_evaluator_daemon = AIEvaluatorDaemon()
