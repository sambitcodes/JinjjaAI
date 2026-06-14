/**
 * Hangeul Composition Engine (한글 조합 엔진)
 * Dynamically assembles individual jamo keystrokes into fully conjugated Korean syllables.
 */

const CHOSEONG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ",
  "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"
];

const JUNGSEONG = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ",
  "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"
];

const JONGSEONG = [
  "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㅈ", "ㄶ", "ㄷ", "ㄹ", "ㄺ",
  "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"
];

// Complex Vowels mapping
const COMPLEX_VOWELS: Record<string, string> = {
  "ㅗㅏ": "ㅘ",
  "ㅗㅐ": "ㅙ",
  "ㅗㅣ": "ㅚ",
  "ㅜㅓ": "ㅝ",
  "ㅜㅔ": "ㅞ",
  "ㅜㅣ": "ㅟ",
  "ㅡㅣ": "ㅢ"
};

// Complex Consonants mapping (for batchim)
const COMPLEX_CONSONANTS: Record<string, string> = {
  "ㄱㅅ": "ㄳ",
  "ㄴㅈ": "ㄵ",
  "ㄴㅎ": "ㄶ",
  "ㄹㄱ": "ㄺ",
  "ㄹㅁ": "ㄻ",
  "ㄹㅂ": "ㄼ",
  "ㄹㅅ": "ㄽ",
  "ㄹㅌ": "ㄾ",
  "ㄹㅍ": "ㄿ",
  "ㄹㅎ": "ㅀ",
  "ㅂㅅ": "ㅄ"
};

export function assembleHangeul(jamos: string[]): string {
  if (jamos.length === 0) return "";

  let result = "";
  let i = 0;

  while (i < jamos.length) {
    const char = jamos[i];

    // If it's not a standard Jamo, append directly
    if (!CHOSEONG.includes(char) && !JUNGSEONG.includes(char)) {
      result += char;
      i++;
      continue;
    }

    // Standard Syllable Composition State Machine
    // 1. Check Initial Consonant (Choseong)
    let cIdx = CHOSEONG.indexOf(char);
    if (cIdx === -1) {
      // Vowel typed alone without choseong
      result += char;
      i++;
      continue;
    }

    // 2. Check Medial Vowel (Jungseong)
    if (i + 1 >= jamos.length || !JUNGSEONG.includes(jamos[i + 1])) {
      // Consonant typed alone
      result += char;
      i++;
      continue;
    }

    let vIdx = JUNGSEONG.indexOf(jamos[i + 1]);
    let nextIdx = i + 2;

    // Check for complex double vowel combination (e.g. ㅗ + ㅏ = ㅘ)
    if (nextIdx < jamos.length && JUNGSEONG.includes(jamos[nextIdx])) {
      const combinedVowel = COMPLEX_VOWELS[jamos[i + 1] + jamos[nextIdx]];
      if (combinedVowel) {
        vIdx = JUNGSEONG.indexOf(combinedVowel);
        nextIdx++;
      }
    }

    // Calculate base Syllable value (CV)
    let syllableVal = (cIdx * 21 + vIdx) * 28 + 0xAC00;

    // 3. Check for Final Consonant (Jongseong / Batchim)
    let batchimVal = 0;
    if (nextIdx < jamos.length && JONGSEONG.includes(jamos[nextIdx])) {
      // Look ahead: if the NEXT letter after this consonant is a vowel, then this consonant 
      // belongs to the NEXT syllable block as choseong, not here!
      const isNextVowel = nextIdx + 1 < jamos.length && JUNGSEONG.includes(jamos[nextIdx + 1]);
      const isNextComplexVowel = nextIdx + 2 < jamos.length && JUNGSEONG.includes(jamos[nextIdx + 2]) && COMPLEX_VOWELS[jamos[nextIdx + 1] + jamos[nextIdx + 2]];
      
      if (!isNextVowel && !isNextComplexVowel) {
        // This consonant is indeed the batchim
        let bChar = jamos[nextIdx];
        let complexNext = nextIdx + 1;
        
        // Check for complex double batchim (e.g. ㄹ + ㄱ = ㄺ)
        if (complexNext < jamos.length && JONGSEONG.includes(jamos[complexNext])) {
          const isDoubleVowelNext = complexNext + 1 < jamos.length && JUNGSEONG.includes(jamos[complexNext + 1]);
          if (!isDoubleVowelNext) {
            const combinedBatchim = COMPLEX_CONSONANTS[bChar + jamos[complexNext]];
            if (combinedBatchim) {
              bChar = combinedBatchim;
              nextIdx++;
            }
          }
        }
        
        batchimVal = JONGSEONG.indexOf(bChar);
        nextIdx++;
      }
    }

    // Assemble the complete syllable block (LVT)
    result += String.fromCharCode(syllableVal + batchimVal);
    i = nextIdx;
  }

  return result;
}
