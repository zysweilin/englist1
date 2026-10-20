# 美式发音作业纸的设计依据

## 现有逻辑与改造

原项目以课程为输入：HomePicker 选择级别和模式，curriculum 提供预先编写的句子、中文和音标。useTTS 使用系统朗读；useRecorder 产生 MediaRecorder 音频；`/api/pronounce` 调用 Mock provider 或仍返回 Mock 的 Azure stub。音素分数、听到的音和声调曲线并非实测，因此不能拿来评价用户新输入的语音。

这一版把任意文本、音频转写、文本发音教学、合成示范和本机跟读记录拆开。首页只展示教学读法，不使用旧的模拟分数。短段落按句练习，每句保留词索引与字符位置，以便以后接真实声学分析。

## 术语

- **连读**：相邻音平滑衔接，典型是辅音尾接元音首。依据实际发音判断，不能只看英语字母。
- **弱读**：不承载重点的功能词变轻、变短，常发生元音弱化。对比重音或句末强调会改变读法。
- **省音**：某个音在适当环境下实际不发出，常随语速和说话者变化。
- **不完全爆破**：保留闭塞动作，爆破释放不明显。不能当成简单删掉辅音。
- **闪音**：General American 中 /t,d/ 在适合的重音和语音环境下可实现为 [ɾ]；attack 不能机械套用 water 的规则。
- **同化、滑音和意群**：相邻音可以相互影响、在元音之间自然过渡；意义组之间保留停顿。

这些不是要求每句话都用满的“技巧”。先选择符合语境的一套读法，再帮助学习者看出重点。

参考的教学来源：

- [British Council：Connected speech](https://www.teachingenglish.org.uk/professional-development/teachers/teaching-knowledge-database/c/connected-speech) — 连读、弱读与省音等术语。
- [British Council：Connected speech – part 1](https://www.teachingenglish.org.uk/professional-development/teachers/knowing-subject/connected-speech-part-1) — 弱读需要结合语境，句末 can 等可保持强读。
- [Rachel’s English：T pronunciations](https://rachelsenglish.com/podcast/004-t-pronunciations-flap-t-stop-t-true-t/) — 美国英语的闪音、stop T、省 T 及例外。
- [Rachel’s English：How to reduce THAT](https://rachelsenglish.com/reduce/) — 功能词弱读与后续音环境。
- [Pronuncian：Assimilation and glottal /t/](https://pronuncian.com/assimilation-linking-t-as-glottal-stop) — 美式 /t/ 在连接环境中的变化。

## 数据与声音

任意输入都经过 `/api/coach/analyze` 调用 OpenAI Responses API，以严格 JSON Schema 返回整句自然读法。系统指令固定以下流程：理解语义和句法 → 确定基础发音 → 选择重音、意群和语调 → 生成一套连贯读法及音标位置 → 给出中文说明。无需为每个新句子写预设答案，也不把网页当作当前聊天会话。

`ipa` 保留每个词在当前含义下的基础发音；`sounds` 则是所选自然读法的音标片段。每个片段包含 `ipa`、指向具体说明的 `featureIds`、是否省去的 `omitted`。前端直接显示这些片段，并把省去的音画为删除线。所有未省去片段相接即为实际建议读法，不再用正则猜测应该修改哪个 /t/。连读和停顿由明确的相邻词边界呈现。旧教学示例和已保存的录音数据仍兼容旧格式。

`stress` 表示句子重音，`nucleus` 指定主要重音；`readingNote` 声明本次采用的语速与表达方式。`features` 只解释本次选定读法中的变化，其他读法放在 `alternatives`，默认折叠。`optional` 表示当前选择会随说话风格变化，不代表把互相矛盾的变化同时作用到一个音上。服务端检查位置、引用、遗漏、主要重音以及省音/闪音/不完全爆破冲突；这些检查无法证明语言学判断本身完全正确。

TTS 接收原句和统一教学风格指令。它不是被强制对齐到模型标注的真人参考录音，当前不能保证每一个可选音值都出现。全部标记在播放时保持可见，AI 范读不伪造时间轴。

音频输入先转写，用户确认后再分析；跟读录音保存原始 Blob 及参考标注，不把 ASR 文字当成音素证据。

官方接口文档：

- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
- [OpenAI Create speech](https://developers.openai.com/api/reference/resources/audio/subresources/speech/methods/create)
- [OpenAI File transcription](https://developers.openai.com/api/docs/guides/speech-to-text)

补充教学依据：[Pronuncian 的 best friends 省 /t/ 示例](https://pronuncian.com/deletion-linking-the-dropped-t)、[美式语音教材的介词弱读](https://opentextbooks.rug.nl/americanenglishphonetics2/chapter/7-8-gradation-of-prepositions/)、[t/d 省音](https://opentextbooks.rug.nl/americanenglishphonetics2/chapter/13-8-2-t-d-elision-in-coda/)。这些知识固定在分析要求中，不会在每次输入时重新搜索网页。

## 当前验证边界

自动化测试验证应用契约和异常处理，不证明模型的语音学判断完全正确。真实 API 质量、范读音值、手机硬件录音和后续纠音仍需带密钥与实际设备验收。人工评测样本保存在 `tests/linguistic-evals.json`，以后调整提示词或模型时应重复审核。
