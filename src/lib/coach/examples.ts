import { prepareText, validateAnalysis, type Feature, type Lesson } from "./contracts";

type Example = {
  text: string; translation: string; ipa: string[]; stressed: number[];
  features: Feature[]; tone: "fall" | "rise"; toneTip: string; focus: string;
};
const feature = (kind: Feature["kind"], from: number, to: number, notation: string, explanation: string, optional = false): Feature =>
  ({ kind, from, to, notation, explanation, optional });

const EXAMPLES: Example[] = [
  {
    text: "I want to pick it up.", translation: "我想把它拿起来。",
    ipa: ["aɪ", "wɑnt", "tə", "pɪk", "ɪt", "ʌp"], stressed: [1, 3, 5],
    features: [
      feature("reduction", 2, 2, "tə", "to 不强调时读成 /tə/，轻轻带过。"),
      feature("unreleased", 1, 2, "t̚", "want 的 /t/ 接 to 的 /t/，闭住后合成一次释放，不需要爆破两次。", true),
      feature("linking", 3, 4, "k‿ɪ", "pick 的 /k/ 直接接 it 的 /ɪ/，中间不插入停顿。"),
      feature("linking", 4, 5, "t‿ʌ", "it 的尾音直接连到 up；把 it up 当成一小组。"),
    ],
    tone: "fall", toneTip: "重心落在 up，句尾自然向下 ↘。", focus: "让 to 轻一点，把 pick‿it‿up 一口气连起来。",
  },
  {
    text: "Could you get a bottle of water?", translation: "你能拿一瓶水吗？",
    ipa: ["kəd", "ju", "ɡɛt", "ə", "ˈbɑtəl", "əv", "ˈwɑtɚ"], stressed: [4, 6],
    features: [
      feature("reduction", 0, 0, "kəd", "请求里的 could 通常很轻，元音可以读成 /ə/。", true),
      feature("assimilation", 0, 1, "d + j → dʒ", "could you 连在一起时，/d/ 和 /j/ 可以合成 /dʒ/。", true),
      feature("reduction", 3, 3, "ə", "a 读成短而轻的 /ə/。"),
      feature("reduction", 5, 5, "əv", "of 不强调，读 /əv/，别把它拉长。"),
      feature("linking", 2, 3, "t‿ə", "get 的尾音顺着接到 a。"),
      feature("flap", 2, 3, "[ɾ]", "get a 中，/t/ 可以轻弹成 [ɾ]，舌尖一碰就离开。", true),
      feature("flap", 4, 4, "[ˈbɑɾəl]", "bottle 的 /t/ 可轻弹成 [ɾ]，不是用力读一个 d。", true),
      feature("linking", 4, 5, "l‿ə", "bottle 的 /l/ 连到 of 的 /ə/。"),
      feature("flap", 6, 6, "[ˈwɑɾɚ]", "water 的 /t/ 在美式英语里常读成轻弹音 [ɾ]。", true),
    ],
    tone: "rise", toneTip: "这是一个中性的请求，water 尾部可以轻轻上扬 ↗。", focus: "bottle 和 water 稍重，其余词轻轻连起来。",
  },
  {
    text: "Next day, we can go out.", translation: "第二天，我们可以出去。",
    ipa: ["nɛkst", "deɪ", "wi", "kən", "ɡoʊ", "aʊt"], stressed: [1, 5],
    features: [
      feature("elision", 0, 1, "nex(t) day", "next day 的 /t/ 夹在辅音之间，快读时可以省去；慢读保留也正确。", true),
      feature("pause", 1, 1, "|", "说完 Next day 稍停一下，再说后面的安排。"),
      feature("reduction", 3, 3, "kən", "这里 can 不强调，读短一点的 /kən/。"),
      feature("glide", 4, 5, "oʊ‿ʷaʊ", "go out 的两个元音之间自然滑过很轻的 /w/，不要另加一个重音节。", true),
      feature("unreleased", 5, 5, "t̚", "out 句尾的 /t/ 可以收住气流而不明显爆破，仍保留收尾动作。", true),
    ],
    tone: "fall", toneTip: "out 是主要重音，句尾下落 ↘。", focus: "Next day 后稍停，can 读轻，go‿out 连起来。",
  },
];

export const EXAMPLE_TEXTS = EXAMPLES.map((item) => item.text);
export function exampleLesson(text = EXAMPLE_TEXTS[0]): Lesson | null {
  const source = prepareText(text);
  const selected = source.sentences.map((sentence) =>
    EXAMPLES.find((example) => example.text.toLowerCase() === sentence.text.toLowerCase()));
  if (selected.some((item) => !item)) return null;
  const lesson = validateAnalysis({
    sentences: selected.map((item, id) => ({
      id, translation: item!.translation, tone: item!.tone, toneTip: item!.toneTip, focus: item!.focus,
      words: item!.ipa.map((ipa, index) => ({ index, ipa, stress: item!.stressed.includes(index) })),
      features: item!.features,
    })),
  }, source);
  return { ...lesson, source: "example" };
}
