"use client";

import { useEffect, useRef, useState } from "react";
import { FEATURE_INFO, MAX_TEXT_LENGTH, type CoachSentence, type FeatureKind, type Lesson } from "@/lib/coach/contracts";
import { EXAMPLE_TEXTS, exampleLesson } from "@/lib/coach/examples";
import { markedIpa, naturalIpa, textLesson } from "@/lib/coach/display";
import { audioExtension, deleteTake, loadTakes, saveTake, type PracticeTake } from "@/lib/coach/recordings";
import { useLessonAudio } from "@/hooks/useLessonAudio";
import { useCapture, type Capture } from "@/hooks/useCapture";
import { Icon } from "./Icons";
import { ChatGPTConnection } from "./ChatGPTConnection";

const toneSymbol = { fall: "↘", rise: "↗", "fall-rise": "↘↗" };

function TakePlayer({ take, onDelete, onPlay }: { take: PracticeTake; onDelete: () => void; onPlay: (element: HTMLAudioElement) => void }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(take.audio);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [take.audio]);
  function downloadMetadata() {
    const metadata = { ...take, audio: undefined };
    const href = URL.createObjectURL(new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = href; anchor.download = `englist-${take.id}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  return <div className="take-row">
    <div className="take-top"><span>{take.purpose === "practice" ? "我的跟读" : "语音输入"} <small>{new Date(take.createdAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {(take.durationMs / 1000).toFixed(1)} 秒</small></span><button className="quiet-button" onClick={onDelete} aria-label="删除这条录音"><Icon name="close" size={16} /></button></div>
    <p>{take.reference?.text || take.transcript || "已保留原始录音"}</p>
    <div className="take-controls"><audio controls src={url || undefined} onPlay={(event) => onPlay(event.currentTarget)} aria-label="回听我的录音" />
      <a href={url || undefined} download={`englist-${take.id}.${audioExtension(take.mimeType)}`} aria-label="下载录音"><Icon name="download" size={17} /></a>
      <button className="text-button" onClick={downloadMetadata}>练习数据</button>
    </div>
  </div>;
}

export function Worksheet({ aiEnabled, chatgptPlan = false }: { aiEnabled: boolean; chatgptPlan?: boolean }) {
  const [input, setInput] = useState("");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [activeKind, setActiveKind] = useState<FeatureKind | null>(null);
  const [showIpa, setShowIpa] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [busy, setBusy] = useState<"analyzing" | "transcribing" | null>(null);
  const [error, setError] = useState("");
  const [storageNotice, setStorageNotice] = useState("");
  const [takes, setTakes] = useState<PracticeTake[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [recordMode, setRecordMode] = useState<"dictation" | "practice">("dictation");
  const [transcriptReview, setTranscriptReview] = useState(false);
  const sentence = lesson?.sentences[sentenceIndex];
  const annotated = !!lesson && lesson.source !== "text";
  const audio = useLessonAudio(aiEnabled);
  const operation = useRef<AbortController | null>(null);
  const operationVersion = useRef(0);
  const recordingContext = useRef<{ purpose: PracticeTake["purpose"]; reference: CoachSentence | null }>({ purpose: "dictation", reference: null });
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);
  const takeAudioRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    loadTakes().then((saved) => { if (alive) setTakes(saved); })
      .catch(() => { if (alive) setStorageNotice("浏览器未允许持久保存；本次录音仍可回听和下载。"); });
    return () => { alive = false; operationVersion.current++; operation.current?.abort(); };
  }, []);

  function stopTakeAudio() {
    takeAudioRef.current?.querySelectorAll("audio").forEach((element) => element.pause());
  }
  function cancelOperation() {
    operationVersion.current++;
    operation.current?.abort();
    setBusy(null);
    audio.stop();
  }
  async function persist(take: PracticeTake) {
    setTakes((current) => [take, ...current.filter((item) => item.id !== take.id)].slice(0, 10));
    try { await saveTake(take); }
    catch { setStorageNotice("这条录音未能保存到本机，请下载留存；当前仍可回听。"); }
  }
  async function completed(capture: Capture) {
    const context = recordingContext.current;
    const version = operationVersion.current;
    if (context.purpose === "dictation" && aiEnabled) setBusy("transcribing");
    const take: PracticeTake = {
      id: crypto.randomUUID(), version: 1, createdAt: capture.createdAt, durationMs: capture.durationMs,
      audio: capture.blob, mimeType: capture.blob.type, purpose: context.purpose, reference: context.reference,
      transcript: null, assessment: null,
    };
    await persist(take);
    if (version !== operationVersion.current) return;
    setShowHistory(true);
    if (context.purpose === "practice") return;
    if (!aiEnabled) {
      setError(chatgptPlan ? "录音已保留。当前套餐接入先验证文本分析；请在输入框填写要练习的英文。" : "录音已保留。语音转文字需要部署者启用 AI 服务；现在也可以直接输入英文。");
      return;
    }
    const controller = new AbortController();
    operation.current = controller;
    setBusy("transcribing"); setError("");
    try {
      const form = new FormData();
      form.set("audio", capture.blob, `input.${audioExtension(capture.blob.type)}`);
      const response = await fetch("/api/coach/transcribe", { method: "POST", body: form, signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "语音识别失败，请重试。");
      if (version !== operationVersion.current) return;
      setInput(data.text);
      setLesson(null);
      setTranscriptReview(true);
      await persist({ ...take, transcript: data.text });
      inputRef.current?.focus();
      setBusy(null);
    } catch (failure) {
      if (version !== operationVersion.current) return;
      setError(failure instanceof Error ? failure.message : "语音识别失败，录音已保留。"); setBusy(null);
    }
  }
  const capture = useCapture(completed);
  const recording = capture.state !== "idle";

  function changeLesson(next: Lesson) {
    setLesson(next); setSentenceIndex(0); setSelectedWord(null); setActiveKind(null);
    setTranscriptReview(false);
  }
  async function analyze(shouldPlay: boolean) {
    if (!input.trim()) { setError("先输入一句你想练习的英文，或点麦克风说出来。"); inputRef.current?.focus(); return; }
    stopTakeAudio();
    cancelOperation();
    const version = operationVersion.current;
    const controller = new AbortController();
    operation.current = controller;
    const text = input.trim();
    changeLesson(textLesson(text));
    setError(""); setBusy("analyzing");
    // Start device playback immediately when server-side AI audio is unavailable,
    // while still asking the analysis endpoint for IPA and connected-speech marks.
    if (shouldPlay && !aiEnabled && !chatgptPlan) void audio.play(text, 1, true);
    try {
      const response = await fetch("/api/coach/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }), signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "分析失败，请重试。");
      if (version !== operationVersion.current) return;
      changeLesson(data);
      setBusy(null);
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      if (shouldPlay && (aiEnabled || chatgptPlan)) void audio.play(data.sentences[0].text, 1, chatgptPlan);
    } catch (failure) {
      if (version !== operationVersion.current) return;
      setBusy(null);
      try {
        const example = exampleLesson(text);
        if (example) changeLesson(example);
      } catch {
        // Keep the submitted words and immediate device playback available.
      }
      if (aiEnabled || chatgptPlan) setError(failure instanceof Error ? failure.message : "分析失败，请重试。");
      if (shouldPlay && (aiEnabled || chatgptPlan)) void audio.play(text, 1, true);
    }
  }
  async function toggleRecording(purpose: PracticeTake["purpose"]) {
    if (purpose === "practice" && !sentence) return;
    if (capture.state === "recording") { capture.stop(); return; }
    if (capture.state === "requesting") { capture.cancel(); return; }
    cancelOperation(); stopTakeAudio(); setError("");
    setRecordMode(purpose);
    recordingContext.current = { purpose, reference: purpose === "practice" && sentence ? structuredClone(sentence) : null };
    await capture.start();
  }
  function moveSentence(delta: number) {
    audio.stop(); stopTakeAudio();
    setSentenceIndex((index) => index + delta); setSelectedWord(null);
  }
  function chooseExample(text: string) {
    cancelOperation(); stopTakeAudio();
    setInput(text); setError("");
    setLesson(null);
  }
  async function removeTake(id: string) {
    try { await deleteTake(id); setTakes((current) => current.filter((take) => take.id !== id)); }
    catch { setStorageNotice("暂时无法删除本机录音，请重试。"); }
  }
  const features = (sentence?.features ?? []).filter((feature) =>
    (selectedWord === null || selectedWord >= feature.from && selectedWord <= feature.to) &&
    (!activeKind || feature.kind === activeKind));
  const kinds = [...new Set((sentence?.features ?? []).map((feature) => feature.kind))];
  const isPlaying = audio.state === "playing";
  const latestTake = takes[0];
  function playTake(element: HTMLAudioElement) {
    if (recording) { element.pause(); return; }
    audio.stop();
    takeAudioRef.current?.querySelectorAll("audio").forEach((other) => { if (other !== element) other.pause(); });
  }

  return <div className="worksheet-app">
    <header className="app-header">
      <a href="/" className="wordmark" aria-label="Englist 首页"><span className="brand-mark"><Icon name="book" size={21} /></span>englist<span className="wordmark-dot">.</span></a>
      <div className="header-right"><span className="edition">一句一句，读得自然。</span><button className="text-button" onClick={() => setShowGuide(!showGuide)} aria-expanded={showGuide}>符号说明 <span aria-hidden="true">↗</span></button></div>
    </header>
    <main className="worksheet-main">
      <section className="intro">
        <div className="eyebrow"><span /> THE SPEAKING NOTEBOOK</div>
        <h1>让英语，<span>自然地连起来。</span></h1>
        <p>写下想说的话。看懂怎么读，听一遍，再自己说一遍。</p>
      </section>

      <section className="input-card" aria-label="输入练习内容">
        {chatgptPlan && <ChatGPTConnection />}
        <div className="input-label"><label htmlFor="practice-input">今天，你想说什么？</label><span>美式英语 <span className="small-dot">·</span> EN–US</span></div>
        <textarea ref={inputRef} id="practice-input" value={input} maxLength={MAX_TEXT_LENGTH} rows={2}
          placeholder="Type a sentence, or just say it…"
          disabled={busy === "transcribing" || recording}
          onChange={(event) => { cancelOperation(); setInput(event.target.value); setLesson(null); setSelectedWord(null); setError(""); setTranscriptReview(false); }}
          onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !busy && !recording) { event.preventDefault(); void analyze(true); } }}
        />
        {transcriptReview && <p className="review-hint">听写已填入上方。先确认文字，再点「标注并播放」。语音识别不代表发音评分。</p>}
        <div className="input-bottom">
          <div className="input-tools">
            <button className={`microphone-button ${recording && recordMode === "dictation" ? "recording" : ""}`} onClick={() => void toggleRecording("dictation")} disabled={!!busy || recording && recordMode !== "dictation"} aria-label={recording && recordMode === "dictation" ? "结束语音输入" : "麦克风语音输入"} title="说一句英文，转成文字">
              <Icon name={recording && recordMode === "dictation" ? "stop" : "mic"} />
            </button>
            <span>{recording && recordMode === "dictation" ? capture.state === "requesting" ? "等待麦克风… 点击取消" : `正在录音 ${Math.floor(capture.elapsed / 1000)}s · 点击结束` : "也可以直接说出来"}</span>
          </div>
          <div className="input-actions"><span className="character-count">{input.length}/{MAX_TEXT_LENGTH}</span>
            {busy ? <button className="primary-button" onClick={cancelOperation}><span className="spinner" />{busy === "analyzing" ? "正在标注 · 取消" : "正在听写 · 取消"}</button>
              : <button className="primary-button" onClick={() => void analyze(true)} disabled={recording}><Icon name="play" size={16} />播放并标注</button>}
          </div>
        </div>
        <p className="input-privacy">{chatgptPlan ? "文本发送至 ChatGPT 分析；当前录音仅保存在本机，每次最多 60 秒。" : "语音输入会发送至 AI 转写；下方的「录下我的发音」仅保存在本机。每次最多 60 秒。"}</p>
      </section>
      <div className="example-row"><span>试一句</span>{EXAMPLE_TEXTS.map((text, index) => <button key={text} disabled={recording || !!busy} onClick={() => chooseExample(text)}>{["日常表达", "点一瓶水", "出门计划"][index]}<Icon name="arrow" size={13} /></button>)}</div>
      {(error || capture.error) && <div className="error-notice" role="alert"><span>{error || capture.error}</span>{error && input.trim() && <button className="text-button" onClick={() => { stopTakeAudio(); void audio.play(input, 1, true); }} disabled={recording}>先试听原文</button>}</div>}

      <article className={`paper ${isPlaying ? "paper-playing" : ""}`} ref={resultRef} aria-label="发音作业纸" aria-busy={busy === "analyzing"}>
        <div className="paper-heading">
          <span className="paper-title">PRACTICE{sentence && <> <span>/</span> {String(sentenceIndex + 1).padStart(2, "0")}</>}</span>
          {sentence && <div className="paper-options"><span className="accent-label"><span />美式自然读法</span>
            <button className={`ipa-toggle ${showIpa ? "selected" : ""}`} onClick={() => setShowIpa(!showIpa)} aria-pressed={showIpa}>音标</button>
          </div>}
        </div>
        {sentence && lesson ? <>
        <div className="sentence-stage">
          {annotated && <p className="sentence-instruction">{sentence.readingNote || "点一个词，听懂它为什么这样读"}</p>}
          <div className="sentence-line" lang="en" aria-label={sentence.text}>
            {sentence.words.map((word, index) => {
              const marks = sentence.features.filter((feature) => index >= feature.from && index <= feature.to);
              const outgoing = sentence.features.filter((feature) => feature.from === index);
              const weak = marks.some((feature) => feature.kind === "reduction");
              const link = outgoing.some((feature) => feature.to === index + 1 && ["linking", "glide", "assimilation"].includes(feature.kind));
              const pause = outgoing.some((feature) => feature.kind === "pause");
              const focused = !activeKind || marks.some((feature) => feature.kind === activeKind);
              const activeWord = audio.wordPosition !== null && audio.wordPosition >= word.start && audio.wordPosition < word.end;
              const soundMarks = outgoing.filter((feature) => ["assimilation", "glide"].includes(feature.kind));
              return <span className={`word-cell ${weak ? "weak-word" : ""} ${selectedWord === index ? "word-selected" : ""} ${activeWord ? "word-playing" : ""} ${focused ? "" : "word-muted"}`} key={`${sentence.id}-${index}`}>
                <button className="word-button" onClick={() => setSelectedWord(selectedWord === index ? null : index)} aria-pressed={selectedWord === index} aria-label={`${word.text}${word.stress ? "，重读" : ""}${weak ? "，弱读" : ""}，查看发音细节`}>
                  <span className="word-text">{word.text}</span>
                  {showIpa && word.ipa && <span className={`word-ipa ${sentence.nucleus === index ? "ipa-nucleus" : ""}`}>
                    {word.stress && <span className="ipa-stress" aria-label={sentence.nucleus === index ? "主要重音" : "重读"}>•</span>}
                    {word.sounds ? <>
                      {index === 0 && "["}
                      {word.sounds.map((part, partIndex) => {
                        const annotations = part.featureIds.map((id) => sentence.features[id]);
                        const label = annotations.map((feature) => `${FEATURE_INFO[feature.kind].label}：${feature.explanation}`).join("\n");
                        return <span key={partIndex} title={label || undefined} className={`ipa-part ${annotations.length ? "ipa-annotated" : ""} ${annotations.some((feature) => feature.kind === "reduction") ? "ipa-reduced" : ""} ${activeKind && annotations.some((feature) => feature.kind === activeKind) ? "ipa-highlight" : ""}`}>
                          {part.omitted ? <del aria-label={`${part.ipa} 在这套读法中省略`}>{part.ipa}</del> : part.ipa}
                        </span>;
                      })}
                      {index === sentence.words.length - 1 && "]"}
                    </> : <>/{markedIpa(sentence, index)}/
                      {soundMarks.map((mark) => <sup key={mark.kind} className={`ipa-symbol kind-${mark.kind}`} title={mark.explanation}>{mark.kind === "assimilation" ? mark.notation : FEATURE_INFO[mark.kind].symbol}</sup>)}
                    </>}
                    {link && <span className="ipa-link" aria-label="与下一个音标衔接">‿</span>}
                    {pause && <span className="ipa-pause" aria-label="稍停"> |</span>}
                    {index === sentence.words.length - 1 && <span className="ipa-tone" title={sentence.toneTip}>{toneSymbol[sentence.tone]}</span>}
                  </span>}
                </button>
              </span>;
            })}
          </div>
          {sentence.translation && <p className="sentence-translation">{sentence.translation}</p>}
          {audio.notice && <p className="audio-notice" role="status">{audio.notice}</p>}
        </div>

        {annotated && <><div className="annotation-key">
          <span className="key-label">这一句的记号</span>
          <span className="stress-key"><b>•</b> 重读</span>
          {kinds.map((kind) => <button key={kind} className={`key-item kind-${kind} ${activeKind === kind ? "key-active" : ""}`} aria-pressed={activeKind === kind} onClick={() => { setActiveKind(activeKind === kind ? null : kind); setSelectedWord(null); }}>
            <b>{FEATURE_INFO[kind].symbol}</b>{FEATURE_INFO[kind].label}
          </button>)}
          <span className="tone-key"><b>{toneSymbol[sentence.tone]}</b> 语调</span>
        </div>
        <div className="coach-note">
          <span className="note-icon">✳</span><div><span className="note-label">只记住这一点</span><p>{sentence.focus}</p></div>
        </div>
        {selectedWord !== null && <section className="word-detail" aria-live="polite">
          <div className="detail-heading"><h2>{sentence.words[selectedWord].text} <span>基础音标 /{sentence.words[selectedWord].ipa}/</span></h2><button className="quiet-button" onClick={() => setSelectedWord(null)} aria-label="收起单词说明"><Icon name="close" size={17} /></button></div>
          {features.length ? features.map((feature, i) => <p key={i}><b>{FEATURE_INFO[feature.kind].label} <span>{feature.notation}</span></b>{feature.explanation}{feature.optional && <small>一种自然读法</small>}</p>) : <p>{sentence.words[selectedWord].stress ? "这个词承载句子的重点，元音稍长、声音更清楚。" : "顺着整句的节奏读，不需要刻意改变这个词的声音。"}</p>}
        </section>}
        <details className="all-details" open>
          <summary>查看{activeKind ? FEATURE_INFO[activeKind].label : selectedWord !== null ? "这个词的" : "全部发音"}细节 <span>{features.length} 处 <span aria-hidden="true">＋</span></span></summary>
          <div className="detail-list">{features.map((feature, index) => <div key={index}><span className={`detail-symbol kind-${feature.kind}`}>{FEATURE_INFO[feature.kind].symbol}</span><p><strong>{sentence.words.slice(feature.from, feature.to + 1).map((word) => word.text).join(" ")} <em>{feature.notation}</em></strong>{feature.explanation}{feature.optional && <small>自然语速下可选</small>}</p></div>)}
            <div><span className="detail-symbol">{toneSymbol[sentence.tone]}</span><p><strong>语调与重音</strong>{sentence.toneTip}</p></div>
          </div>
        </details></>}
        {annotated && sentence.alternatives && <>
          <p className="reading-legend" title={`实际发音：[${naturalIpa(sentence)}]`}>删除线：本次省略的音 · 下划线：有发音细节，悬停可查看 · 加粗：主要重音</p>
          {sentence.alternatives.length > 0 && <details className="all-details">
            <summary>其他自然读法 <span>{sentence.alternatives.length} 种 <span aria-hidden="true">＋</span></span></summary>
            <div className="detail-list">{sentence.alternatives.map((alternative, index) => <div key={index}>
              <p><strong>{sentence.words.slice(alternative.from, alternative.to + 1).map((word) => word.text).join(" ")} <em>[{alternative.ipa}]</em></strong>{alternative.explanation}</p>
            </div>)}</div>
          </details>}
        </>}
        <div className="paper-bottom"><span>{annotated && <>{lesson.source === "example" ? "教学示例" : "AI 语境分析"} <span>·</span> 标注是一种建议读法，会随语境和语速变化</>}</span>
          <div className="sentence-navigation"><button className="quiet-button" disabled={sentenceIndex === 0 || recording || !!busy} onClick={() => moveSentence(-1)} aria-label="上一句"><Icon name="chevron" size={16} style={{ transform: "rotate(180deg)" }} /></button><span>{sentenceIndex + 1} / {lesson.sentences.length}</span><button className="quiet-button" disabled={sentenceIndex === lesson.sentences.length - 1 || recording || !!busy} onClick={() => moveSentence(1)} aria-label="下一句"><Icon name="chevron" size={16} /></button></div>
        </div>
        </> : <div className="paper-empty" />}
      </article>

      <section className="your-turn" aria-label="录下自己的发音">
        <div><div className="eyebrow">NOW, YOUR TURN</div><h2>听过了，换你说。</h2><p>照着这句读一遍，回听自己的连读和节奏。</p></div>
        <button className={`record-button ${recording && recordMode === "practice" ? "recording" : ""}`} onClick={() => void toggleRecording("practice")} disabled={!sentence || !!busy || recording && recordMode !== "practice"}>
          <Icon name={recording && recordMode === "practice" ? "stop" : "mic"} size={18} />
          {recording && recordMode === "practice" ? capture.state === "requesting" ? "等待权限 · 取消" : `结束录音 · ${Math.floor(capture.elapsed / 1000)}s` : "录下我的发音"}
        </button>
      </section>
      <div ref={takeAudioRef} className="recordings-section">
        {latestTake && <TakePlayer key={latestTake.id} take={latestTake} onDelete={() => void removeTake(latestTake.id)} onPlay={playTake} />}
        {takes.length > 1 && <details open={showHistory} onToggle={(event) => setShowHistory(event.currentTarget.open)}><summary>本机录音 <span>{takes.length} 条</span></summary>{takes.slice(1).map((take) => <TakePlayer key={take.id} take={take} onDelete={() => void removeTake(take.id)} onPlay={playTake} />)}</details>}
        <p className="storage-notice">{storageNotice || "最近 10 条录音及参考标注保存在本浏览器，可回听、下载或删除。当前不做自动评分。"}</p>
      </div>
      {showGuide && <section className="symbol-guide" aria-label="发音符号说明">
        <div className="detail-heading"><h2>看懂记号，就知道怎么读。</h2><button className="quiet-button" onClick={() => setShowGuide(false)} aria-label="关闭符号说明"><Icon name="close" size={18} /></button></div>
        <div className="guide-grid"><div><b>•</b><p><strong>重读</strong>重点词稍长、更清楚；其余词轻轻带过。</p></div>{Object.entries(FEATURE_INFO).map(([kind, info]) => <div key={kind}><b className={`kind-${kind}`}>{info.symbol}</b><p><strong>{info.label}</strong>{info.hint}</p></div>)}<div><b>↘ ↗</b><p><strong>语调</strong>向下表示收束，向上常用于询问或未说完；要结合语境。</p></div></div>
        <p className="guide-footnote">“吞音”常混指省音和不完全爆破。这里分开标注，帮助你保留该有的口腔动作。</p>
      </section>}
      {!aiEnabled && !chatgptPlan && <p className="setup-notice">当前为示例模式。部署时设置 <code>OPENAI_API_KEY</code>，即可启用任意句子的分析、中文翻译、AI 范读与语音转写。</p>}
    </main>
    <footer className="app-footer"><span>englist. <span>少一点复杂，多一点开口。</span></span><span>GENERAL AMERICAN · 每天一句也很好</span></footer>
  </div>;
}
