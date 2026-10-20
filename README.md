# Englist · 让英语自然地连起来

一张简单的美式发音作业纸：**输入 → 看标注、听范读 → 录下自己 → 回听**。

## 启动

需要 Node.js 22+。

```bash
npm ci
cp .env.example .env.local
# 在 .env.local 中填写 OPENAI_API_KEY
npm run dev
```

打开 [localhost:3000](http://localhost:3000)。PowerShell 可使用 `Copy-Item .env.example .env.local`。

```bash
npm test
npm run build
npm start
```

沿用 Next.js App Router；部署为 Node.js / Vercel 服务，不能仅作静态 HTML 导出。服务器需要访问 `api.openai.com`。Vercel 的生产环境设置 `OPENAI_API_KEY` 后重新部署即可。不要把密钥写在网页、Git 仓库或 `NEXT_PUBLIC_` 环境变量中。

可选环境变量见 [.env.example](.env.example)：分析默认 `gpt-4.1-mini`，范读默认 `gpt-4o-mini-tts` / `coral`，转写默认 `gpt-4o-mini-transcribe`。运行时从服务端读取配置。没有密钥时只提供明确标识的教学示例、设备朗读和本机录音；任意新句子不会返回伪造的分析或翻译。

## 第一版功能

- 输入一句或一段英文，最多 1200 字符 / 12 句；一键分析并播放第一句，长段落逐句练习。
- 每句中文翻译、上下文 IPA、句子重音和语调；每词可点击查看简短中文说明。
- 连读弧线、弱读、省音、不完全爆破、闪音、同化、滑音衔接和意群停顿；可按类别聚焦或展开全部细节。
- 自然 / 0.75 倍速度范读；AI 失败时尝试设备 en-US 语音并显示实际来源。所有标记在播放前和播放中保持可见。
- 输入框旁的麦克风：点击开始、再点击停止，录音转写后先确认文字，再分析播放。
- “录下我的发音”：参考当前句子录音，只在本浏览器保存；可以回听、下载音频及 JSON 练习数据、删除。
- 最多录 60 秒、最多 8 MiB 上传。本机 IndexedDB 保留最近 10 条，包含参考句、词位置、标注、音频 MIME、时长、时间和 `assessment: null`，为后续真实纠音准备。
- 响应式作业纸、键盘操作、输入快捷键 Ctrl/Cmd+Enter、音标切换、符号说明。

语音输入会经本服务传给 OpenAI 做转写；本机跟读录音不会上传。当前不自动录音，只有点击麦克风才申请权限。麦克风需 HTTPS 或 localhost。清理网站数据或更换浏览器会丢失本机历史，需要长期留存时请下载。

## “母语者大脑”如何工作

1. 服务端规范化文本并固定句子、词序及字符位置。
2. 语言模型结合语义、句法、语境，产生一套中性、自然的 General American 建议读法和中文翻译。
3. Structured Outputs 约束返回结构；服务端再验证句数、词索引、标注范围、弱读/重读冲突、重复标记及跨意群连接。
4. UI 只使用原始词文本，避免模型改写用户输入。语音合成读取原文，并以自然连读、轻弱功能词和美式节奏为指导。

自然口语有多种正确读法。模型没有“掌握所有英语”的保证，当前标注是**文本推断的建议**，不是对范读音频或用户音频的声学测量。可选省音会标明；不把省音、不完全爆破和闪音混为一谈。范读的具体音值可能与建议略有不同。

AI 音频目前没有可靠的逐词时间戳，因此不显示伪造的逐词追踪。设备朗读只有收到真实 `onboundary` 事件时才高亮当前词。语音识别仅生成文字，**不等于发音评分**。

## 代码结构

| 路径 | 作用 |
| --- | --- |
| `src/components/worksheet/` | 首页作业纸、符号、录音回听 |
| `src/lib/coach/contracts.ts` | 类型、分句分词、JSON Schema、服务端结果校验 |
| `src/lib/coach/prompt.ts` | 美式读法政策及范读指令 |
| `src/lib/coach/examples.ts` | 3 条完整教学示例，无密钥可体验 |
| `src/lib/coach/server.ts` | 服务端密钥、超时、请求大小及同源限制、基础限流 |
| `src/lib/coach/recordings.ts` | IndexedDB 原始音频与参考标注存储 |
| `src/hooks/useCapture.ts` | 权限、取消、录音上限和麦克风资源释放 |
| `src/hooks/useLessonAudio.ts` | 音频缓存、取消、设备朗读回退 |
| `POST /api/coach/analyze` | `{ text }` → `Lesson` |
| `POST /api/coach/speech` | `{ text }` → MP3 |
| `POST /api/coach/transcribe` | `FormData(audio)` → `{ text, kind: "transcript", assessment: null }` |

原版本的 `/shadowing/*`、`/dialogue/*`、`/demo/feedback` 和 `/api/pronounce` 保留用于兼容；其中原有 Mock/Azure stub 的分数是演示数据。新首页不使用它们，也不显示这些模拟分数。原版课程选择器、预置音标、模拟声调曲线不能承担任意输入的真实纠音。

## 验证与下一步

`npm test` 覆盖输入规范化、结构错误、越界及冲突标注、缺少密钥、拒绝/截断响应、音频格式与大小、同源检查、音频流及服务错误。Provider 测试使用测试替身，不代表已完成真实模型验证。

[tests/linguistic-evals.json](tests/linguistic-evals.json) 提供上线前语音学人工验收样本，覆盖强弱读、hour/university、want to、going to、同形异音词、闪音限制、WH 语调和提示注入。配置密钥后，应对照范读逐项审核，尤其核实可选省音；文件本身不是已运行的模型评测结果。

服务端自带每路由每分钟 30 次的进程内限流（Vercel 使用其入口提供的 IP，其他环境共享额度）。公开多实例部署应在网关配置持久限流和调用预算；当前不包含登录系统或跨设备录音同步。

下一阶段可以为 `PracticeTake` 增加真实声学对齐、音素观察和人工可复核的纠音结果。不要仅凭转写是否匹配来评分。

发音设计依据及外部 API 文档见 [docs/pronunciation-design.md](docs/pronunciation-design.md)。
