// Contract fixture, never served as an answer to a learner's input.
const text = "She's one of my best friends.";
function rawNaturalLesson() {
  const feature = (kind, from, to, notation, explanation, optional = false) =>
    ({ kind, from, to, notation, explanation, optional });
  const sound = (ipa, featureIds = [], omitted = false) => ({ ipa, featureIds, omitted });
  return { sentences: [{
    id: 0, translation: "她是我最好的朋友之一。",
    readingNote: "普通语速、自然陈述；本次选择省略 best 的 /t/。",
    nucleus: 5, tone: "fall", toneTip: "friends 是主要重音，句尾自然下降。",
    focus: "one of 连起来，of 轻读，best 的 /s/ 直接接 friends。",
    words: [
      { index: 0, ipa: "ʃiz", stress: false, sounds: [sound("ʃi"), sound("z", [3])] },
      { index: 1, ipa: "wʌn", stress: false, sounds: [sound("w"), sound("ʌ̃", [4]), sound("n")] },
      { index: 2, ipa: "ʌv", stress: false, sounds: [sound("əv", [0])] },
      { index: 3, ipa: "maɪ", stress: false, sounds: [sound("maɪ")] },
      { index: 4, ipa: "bɛst", stress: true, sounds: [sound("bɛs"), sound("t", [2], true)] },
      { index: 5, ipa: "fɹɛndz", stress: true, sounds: [sound("fɹ"), sound("ɛ̃", [5]), sound("nd"), sound("z", [6])] },
    ],
    features: [
      feature("reduction", 2, 2, "ʌv → əv", "of 不强调，读短而轻的 /əv/。"),
      feature("linking", 1, 2, "n‿ə", "one 的 /n/ 直接接 of 的 /ə/。"),
      feature("elision", 4, 5, "t → ∅", "本次省略辅音之间的 /t/，/s/ 接 /f/。", true),
      feature("sound", 0, 0, "z", "she's 是 she is 的缩写，末尾读 /z/，只有一个音节。"),
      feature("nasalization", 1, 1, "ʌ̃", "元音受到后面 /n/ 的影响，带鼻化。"),
      feature("nasalization", 5, 5, "ɛ̃", "元音受到后面 /n/ 的影响，带鼻化。"),
      feature("sound", 5, 5, "z", "复数词尾是 /z/，不要另加一个元音。"),
    ],
    alternatives: [
      { from: 4, to: 5, ipa: "bɛst̚ fɹɛndz", explanation: "也可以保留 /t/ 的闭塞而不明显爆破，区别于本次的省音。" },
      { from: 5, to: 5, ipa: "fɹɛnz", explanation: "较随意时 /d/ 可以省去；本次示范保留 /d/。" },
    ],
  }] };
}
module.exports = { text, rawNaturalLesson };
