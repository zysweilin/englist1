export const MAX_TEXT_LENGTH = 1200;
export const MAX_SENTENCES = 12;
export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
export const MAX_RECORDING_MS = 60_000;

export const FEATURE_INFO = {
  linking: { label: "连读", symbol: "‿", hint: "前一个词的尾音，顺着接到下一个词。" },
  reduction: { label: "弱读", symbol: "ə", hint: "不强调的小词轻一点、短一点，元音常变成 /ə/。" },
  elision: { label: "省音", symbol: "(t)", hint: "括号里的音在自然语速下可以省去，不必强行省略。" },
  unreleased: { label: "不完全爆破", symbol: "t̚", hint: "保留收住气流的动作，不把爆破声送出来；不是删掉这个音。" },
  flap: { label: "闪音", symbol: "ɾ", hint: "舌尖轻弹一下上齿龈，比完整的 /d/ 更轻更短。" },
  assimilation: { label: "同化", symbol: "→", hint: "相邻的音互相影响，读起来更顺。" },
  glide: { label: "滑音衔接", symbol: "ʷ/ʲ", hint: "两个元音之间自然滑过一个很轻的 /w/ 或 /j/。" },
  pause: { label: "意群停顿", symbol: "|", hint: "在意思完整的小组之间稍停一下。" },
  nasalization: { label: "鼻化", symbol: "◌̃", hint: "元音受到相邻鼻音影响，带一点鼻腔共鸣。" },
  glottalization: { label: "喉塞", symbol: "ʔ", hint: "气流在喉部短暂收住；具体动作看这一处说明。" },
  aspiration: { label: "送气", symbol: "ʰ", hint: "辅音释放时带一小股气流，强弱取决于位置和重音。" },
  dark_l: { label: "暗 l", symbol: "ɫ", hint: "舌后部抬起，保留 l 的动作，不额外加一个元音。" },
  voicing: { label: "清浊变化", symbol: "◌̥", hint: "相邻声音会影响声带振动，不等于直接换成另一个音。" },
  sound: { label: "发音要点", symbol: "·", hint: "缩写、词尾或具体音的发音提示。" },
} as const;
export type FeatureKind = keyof typeof FEATURE_INFO;
export type Feature = {
  kind: FeatureKind;
  from: number;
  to: number;
  notation: string;
  explanation: string;
  optional: boolean;
};
export type SourceWord = { text: string; start: number; end: number };
export type SourceSentence = { id: number; text: string; words: SourceWord[] };
export type SoundPart = { ipa: string; featureIds: number[]; omitted: boolean };
export type ReadingAlternative = { from: number; to: number; ipa: string; explanation: string };
export type CoachWord = SourceWord & { ipa: string; stress: boolean; sounds?: SoundPart[] };
export type CoachSentence = {
  id: number;
  text: string;
  translation: string;
  words: CoachWord[];
  features: Feature[];
  tone: "fall" | "rise" | "fall-rise";
  toneTip: string;
  focus: string;
  readingNote?: string;
  nucleus?: number;
  alternatives?: ReadingAlternative[];
};
export type Lesson = {
  version: 1;
  sourceText: string;
  accent: "en-US";
  source: "ai" | "example" | "text";
  sentences: CoachSentence[];
};

export class CoachError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function prepareText(value: unknown): { text: string; sentences: SourceSentence[] } {
  if (typeof value !== "string" || !value.trim()) throw new CoachError("先输入一句你想练习的英文。");
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length > MAX_TEXT_LENGTH) throw new CoachError(`一次最多输入 ${MAX_TEXT_LENGTH} 个字符，分成短段练习更有效。`);
  if (!/[a-z]/i.test(text)) throw new CoachError("请输入英文句子；中文翻译会自动显示在下方。");
  const segments = [...new Intl.Segmenter("en", { granularity: "sentence" }).segment(text)];
  if (segments.length > MAX_SENTENCES) throw new CoachError(`一次最多练习 ${MAX_SENTENCES} 句。`);
  const sentences = segments.map(({ segment }, id) => {
    const sentence = segment.trim();
    const words = [...sentence.matchAll(/\S+/g)].map((match) => ({
      text: match[0], start: match.index!, end: match.index! + match[0].length,
    }));
    return { id, text: sentence, words };
  });
  if (sentences.some((sentence) => sentence.words.length > 100)) throw new CoachError("这句话太长了，加上标点再试试。");
  return { text, sentences };
}

type RawWord = { index: number; ipa: string; stress: boolean; sounds?: SoundPart[] };
type RawSentence = Omit<CoachSentence, "text" | "words"> & { words: RawWord[] };
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const shortString = (value: unknown, max: number) => typeof value === "string" && value.trim().length > 0 && value.length <= max;

/** Never let a model change source words, drop a sentence or point outside it. */
export function validateAnalysis(raw: unknown, source: ReturnType<typeof prepareText>, requireNaturalReading = false): Lesson {
  const invalid = () => new CoachError("发音分析返回了不完整的结果，请再试一次。", 502);
  if (!object(raw) || !Array.isArray(raw.sentences) || raw.sentences.length !== source.sentences.length) throw invalid();
  const sentences = raw.sentences.map((value: unknown, index: number): CoachSentence => {
    const original = source.sentences[index];
    if (!object(value) || value.id !== original.id || !Array.isArray(value.words) || value.words.length !== original.words.length ||
      !shortString(value.translation, 2000) || !shortString(value.toneTip, 400) || !shortString(value.focus, 500) ||
      !["fall", "rise", "fall-rise"].includes(String(value.tone)) || !Array.isArray(value.features) || value.features.length > original.words.length * 5) throw invalid();
    const natural = requireNaturalReading || value.readingNote !== undefined || value.nucleus !== undefined ||
      value.alternatives !== undefined || value.words.some((word: RawWord) => word?.sounds !== undefined);
    for (const [wordIndex, word] of value.words.entries()) {
      if (!object(word) || word.index !== wordIndex || !shortString(word.ipa, 160) || typeof word.stress !== "boolean") throw invalid();
    }
    const seen = new Set<string>();
    for (const feature of value.features) {
      if (!object(feature) || !Object.hasOwn(FEATURE_INFO, String(feature.kind)) ||
        !Number.isInteger(feature.from) || !Number.isInteger(feature.to) ||
        Number(feature.from) < 0 || Number(feature.to) >= original.words.length || Number(feature.to) < Number(feature.from) ||
        !shortString(feature.notation, 120) || !shortString(feature.explanation, 500) || typeof feature.optional !== "boolean") throw invalid();
      const f = feature as Feature;
      if (["linking", "glide"].includes(f.kind) && f.to !== f.from + 1) throw invalid();
      if (f.kind === "assimilation" && f.to > f.from + 1) throw invalid();
      if (f.kind === "pause" && f.to !== f.from) throw invalid();
      if (f.kind === "reduction" && value.words.slice(f.from, f.to + 1).some((word: RawWord) => word.stress)) throw invalid();
      if (f.to > f.from && /[.!?;:][”"')]*$/.test(original.words[f.from].text) && f.kind !== "pause") throw invalid();
      if (["linking", "glide", "assimilation"].includes(f.kind) && value.features.some((other: Feature) => other.kind === "pause" && other.from === f.from)) throw invalid();
      const key = `${f.kind}:${f.from}:${f.to}${natural ? `:${f.notation}` : ""}`;
      if (seen.has(key)) throw invalid();
      seen.add(key);
    }
    if (natural) {
      if (!shortString(value.readingNote, 400) || !Number.isInteger(value.nucleus) ||
        Number(value.nucleus) < 0 || Number(value.nucleus) >= original.words.length ||
        !value.words[Number(value.nucleus)].stress ||
        !Array.isArray(value.alternatives) || value.alternatives.length > 12) throw invalid();
      const attached = new Set<number>();
      for (const [wordIndex, word] of value.words.entries()) {
        if (!Array.isArray(word.sounds) || !word.sounds.length || word.sounds.length > 80) throw invalid();
        let spoken = "";
        for (const part of word.sounds) {
          if (!object(part) || !shortString(part.ipa, 80) || /[\[\]()/\\|↘↗‿<>]/u.test(String(part.ipa)) ||
            typeof part.omitted !== "boolean" || !Array.isArray(part.featureIds) ||
            new Set(part.featureIds).size !== part.featureIds.length) throw invalid();
          const kinds: FeatureKind[] = [];
          for (const id of part.featureIds) {
            if (!Number.isInteger(id) || id < 0 || id >= value.features.length) throw invalid();
            const feature = value.features[id] as Feature;
            if (wordIndex < feature.from || wordIndex > feature.to) throw invalid();
            attached.add(id);
            kinds.push(feature.kind);
          }
          if (part.omitted !== kinds.includes("elision")) throw invalid();
          if (part.omitted && kinds.some((kind) => ["unreleased", "flap", "glottalization"].includes(kind))) throw invalid();
          if (kinds.includes("flap") && (kinds.includes("unreleased") || kinds.includes("glottalization") || !String(part.ipa).includes("ɾ"))) throw invalid();
          if (kinds.includes("unreleased") && !String(part.ipa).includes("̚")) throw invalid();
          if (!part.omitted) spoken += part.ipa;
        }
        if (!spoken.trim()) throw invalid();
      }
      for (const [id, feature] of value.features.entries()) {
        if (!["linking", "glide", "pause"].includes(feature.kind) && !attached.has(id)) throw invalid();
      }
      for (const alternative of value.alternatives) {
        if (!object(alternative) || !Number.isInteger(alternative.from) || !Number.isInteger(alternative.to) ||
          Number(alternative.from) < 0 || Number(alternative.to) < Number(alternative.from) ||
          Number(alternative.to) >= original.words.length || !shortString(alternative.ipa, 300) ||
          !shortString(alternative.explanation, 500)) throw invalid();
      }
    }
    const valid = value as unknown as RawSentence;
    return {
      id: original.id, text: original.text, translation: valid.translation,
      words: original.words.map((word, i) => ({
        ...word, ipa: valid.words[i].ipa, stress: valid.words[i].stress,
        ...(natural ? { sounds: valid.words[i].sounds!.map(({ ipa, featureIds, omitted }) => ({ ipa, featureIds, omitted })) } : {}),
      })),
      features: valid.features.map(({ kind, from, to, notation, explanation, optional }) => ({ kind, from, to, notation, explanation, optional })),
      tone: valid.tone, toneTip: valid.toneTip, focus: valid.focus,
      ...(natural ? {
        readingNote: valid.readingNote, nucleus: valid.nucleus,
        alternatives: valid.alternatives!.map(({ from, to, ipa, explanation }) => ({ from, to, ipa, explanation })),
      } : {}),
    };
  });
  return { version: 1, sourceText: source.text, accent: "en-US", source: "ai", sentences };
}

const string = { type: "string" };
const integer = { type: "integer" };
const boolean = { type: "boolean" };
function strictObject(properties: Record<string, unknown>) {
  return { type: "object", properties, required: Object.keys(properties), additionalProperties: false };
}
export const ANALYSIS_SCHEMA = strictObject({
  sentences: { type: "array", items: strictObject({
    id: integer, translation: string, tone: { type: "string", enum: ["fall", "rise", "fall-rise"] },
    toneTip: string, focus: string, readingNote: string, nucleus: integer,
    words: { type: "array", items: strictObject({
      index: integer, ipa: string, stress: boolean,
      sounds: { type: "array", items: strictObject({
        ipa: string, featureIds: { type: "array", items: integer }, omitted: boolean,
      }) },
    }) },
    features: { type: "array", items: strictObject({
      kind: { type: "string", enum: Object.keys(FEATURE_INFO) },
      from: integer, to: integer, notation: string, explanation: string, optional: boolean,
    }) },
    alternatives: { type: "array", items: strictObject({ from: integer, to: integer, ipa: string, explanation: string }) },
  }) },
});
