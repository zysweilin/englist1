import type { CoachSentence, Lesson } from "./contracts";

/** Display the submitted text immediately, even without an analysis service. */
export function textLesson(text: string): Lesson {
  return {
    version: 1, sourceText: text, accent: "en-US", source: "text",
    sentences: [...new Intl.Segmenter("en", { granularity: "sentence" }).segment(text)].map(({ segment }, id) => {
      const sentence = segment.trim();
      return {
        id, text: sentence, translation: "", features: [], tone: "fall", toneTip: "", focus: "",
        words: [...sentence.matchAll(/\S+/g)].map((match) => ({
          text: match[0], start: match.index!, end: match.index! + match[0].length, ipa: "", stress: false,
        })),
      };
    }),
  };
}

/** Put sound changes in the transcription instead of badges under the English word. */
export function markedIpa(sentence: CoachSentence, index: number): string {
  const sounds = sentence.words[index].sounds;
  if (sounds) return sounds.map((part) => part.omitted ? `(${part.ipa})` : part.ipa).join("");
  let ipa = sentence.words[index].ipa;
  for (const feature of sentence.features.filter((item) => item.from === index)) {
    if (feature.kind === "flap") {
      const full = feature.notation.match(/^\[([^\]]*ɾ[^\]]*)\]$/)?.[1];
      ipa = full && full.length > 1 ? full : ipa.replace(/[td](?=[^td]*$)/, "ɾ");
    } else if (feature.kind === "elision") {
      const omitted = feature.notation.match(/\(([tdh])\)/)?.[1];
      if (omitted) {
        const at = ipa.lastIndexOf(omitted);
        if (at >= 0 && ipa[at - 1] !== "(") ipa = `${ipa.slice(0, at)}(${omitted})${ipa.slice(at + 1)}`;
      }
    } else if (feature.kind === "unreleased") {
      const held = feature.notation.match(/([pbtdkɡg])̚/)?.[1];
      if (held && !ipa.includes(`${held}̚`)) {
        const at = ipa.lastIndexOf(held);
        if (at >= 0) ipa = `${ipa.slice(0, at + 1)}̚${ipa.slice(at + 1)}`;
      }
    }
  }
  return ipa;
}

/** The selected realization is supplied by the model, never reconstructed with sound-replacement rules. */
export function naturalIpa(sentence: CoachSentence): string {
  return sentence.words.map((word, index) => {
    const ipa = word.sounds ? word.sounds.filter((part) => !part.omitted).map((part) => part.ipa).join("") : markedIpa(sentence, index);
    const outgoing = sentence.features.filter((feature) => feature.from === index);
    const boundary = outgoing.some((feature) => feature.kind === "pause") ? " | " :
      index === sentence.words.length - 1 ? "" :
        outgoing.some((feature) => feature.kind === "linking" || feature.kind === "glide") ? "‿" : " ";
    return `${ipa}${boundary}`;
  }).join("");
}
