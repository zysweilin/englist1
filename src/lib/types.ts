export type Level = "L1" | "L2" | "L3";
export type Mode = "shadowing" | "dialogue";
export type Speaker = "partner" | "you";

export type WordUnit = {
  word: string;
  ipa: string;
  phonemes: string[];
};

export type ShadowingItem = {
  id: string;
  level: Level;
  text: string;
  gloss: string;
  words: WordUnit[];
};

export type DialogueTurn = {
  id: string;
  speaker: Speaker;
  text: string;
  gloss: string;
  words: WordUnit[];
};

export type DialogueItem = {
  id: string;
  level: Level;
  title: string;
  titleZh: string;
  scenario: string;
  turns: DialogueTurn[];
};

export type PhonemeFeedback = {
  expectedIpa: string;
  heardIpa: string;
  score: number;
  startMs: number;
  endMs: number;
};

export type WordFeedback = {
  word: string;
  ipa: string;
  score: number;
  phonemes: PhonemeFeedback[];
  startMs: number;
  endMs: number;
};

export type PronunciationResult = {
  overallScore: number;
  words: WordFeedback[];
  tips: string[];
  durationMs: number;
  provider: string;
};

export type ReferenceInput = {
  text: string;
  words: WordUnit[];
};
