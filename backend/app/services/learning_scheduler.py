from datetime import datetime, timedelta, timezone

class LearningScheduler:
    @staticmethod
    def calculate_sm2(q: int, repetitions: int, ease_factor: float, interval: int) -> tuple[int, float, int]:
        """
        Standard SuperMemo-2 Spaced Repetition Algorithm.
        
        Parameters:
        - q: User rating of performance (0 to 5)
             5: perfect response
             4: correct response after a hesitation
             3: correct response recalled with serious difficulty
             2: incorrect response; where the correct one seemed easy to recall
             1: incorrect response; the correct one remembered
             0: complete blackout.
        - repetitions: Number of consecutive successful repetitions
        - ease_factor: Easiness factor (starting default: 2.5)
        - interval: Inter-repetition interval in days
        
        Returns:
        - (new_repetitions, new_ease_factor, new_interval)
        """
        # Under 3 represents incorrect recall, resetting repetition queue
        if q < 3:
            new_repetitions = 0
            new_interval = 1
        else:
            if repetitions == 0:
                new_interval = 1
            elif repetitions == 1:
                new_interval = 6
            else:
                new_interval = int(round(interval * ease_factor))
            
            new_repetitions = repetitions + 1

        # Adjust ease factor
        new_ease_factor = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        if new_ease_factor < 1.3:
            new_ease_factor = 1.3

        return new_repetitions, new_ease_factor, new_interval

    def schedule_next_review(self, current_repetitions: int, current_ease_factor: float, current_interval: int, quality_score: int) -> dict:
        """
        Calculate SM2 stats and generate next review timestamp.
        """
        new_reps, new_ef, new_interval = self.calculate_sm2(
            quality_score, current_repetitions, current_ease_factor, current_interval
        )
        
        next_review = datetime.now(timezone.utc) + timedelta(days=new_interval)
        
        return {
            "repetitions": new_reps,
            "ease_factor": round(new_ef, 3),
            "interval": new_interval,
            "next_review_at": next_review
        }

learning_scheduler = LearningScheduler()
