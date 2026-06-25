import { describe, expect, it } from "vitest";
import { englishVocabularyReal } from "@/lib/data/vocabulary-english";

describe("englishVocabularyReal", () => {
  it("has 615 entries (41 categories x 15 words)", () => {
    expect(englishVocabularyReal).toHaveLength(615);
  });

  it("has exactly 15 entries per category", () => {
    const counts = new Map<string, number>();
    for (const item of englishVocabularyReal) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    expect(counts.size).toBe(41);
    for (const [, count] of counts) {
      expect(count).toBe(15);
    }
  });

  it("has unique ids", () => {
    const ids = new Set(englishVocabularyReal.map((item) => item.id));
    expect(ids.size).toBe(englishVocabularyReal.length);
  });

  it("never contains the old fake placeholder pattern (word duplicated with a trailing round number)", () => {
    const fakePattern = /\s[23]$/; // e.g. "address 2", "address 3"
    const offenders = englishVocabularyReal.filter((item) => fakePattern.test(item.word));
    expect(offenders).toEqual([]);
  });

  it("never repeats the English word as its own 'Thai pronunciation' (the old bug)", () => {
    const offenders = englishVocabularyReal.filter(
      (item) => item.thaiPronunciation.toLowerCase() === item.word.toLowerCase()
    );
    expect(offenders).toEqual([]);
  });

  it("gives every entry a non-empty word, meaning, example sentence and IPA", () => {
    for (const item of englishVocabularyReal) {
      expect(item.word.length).toBeGreaterThan(0);
      expect(item.thaiMeaning.length).toBeGreaterThan(0);
      expect(item.exampleSentence.length).toBeGreaterThan(0);
      expect(item.ipa?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("gives every multiple-choice quiz exactly 4 distinct choices that include the correct answer", () => {
    for (const item of englishVocabularyReal) {
      expect(item.miniQuizChoices).toHaveLength(4);
      expect(new Set(item.miniQuizChoices)).toContain(item.miniQuizAnswer);
      expect(new Set(item.miniQuizChoices).size).toBe(4);
    }
  });
});
