# Englist · 英语口语练习 / English Oral Practice

Grok-like dark UI for **shadowing (跟读)** and **dialogue (对话)** practice with phoneme-level visual feedback.

默认使用 **Mock PronunciationProvider**，无需任何 API Key。可选 Azure stub（无密钥时自动回退 mock）。

---

## Quick start / 快速开始

```bash
cd /workspace/englist1
npm install
npm run build    # must succeed
npm run dev      # http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000).

---

## Features / 功能

| 中文 | English |
|------|---------|
| 级别 L1 / L2 / L3 | Levels L1–L3 |
| 跟读模式 | Shadowing |
| 对话模式（多轮，未完成不可跳） | Dialogue (locked future turns) |
| TTS 示范（浏览器 speechSynthesis） | Browser TTS |
| MediaRecorder 录音 + 电平表 | Record + level meter |
| 音素级反馈（expected → heard） | Phoneme pills |
| 片段色条回放 | Segment bar replay |
| 中文教练提示 | Chinese coaching tips |

---

## Routes / 路由

| Path | Description |
|------|-------------|
| `/` | Home: pick level + mode |
| `/shadowing/[id]` | Shadowing practice (e.g. `/shadowing/l1-s01`) |
| `/dialogue/[id]` | Dialogue practice (e.g. `/dialogue/l2-d01`) |
| `POST /api/pronounce` | Pronunciation analysis |

---

## Mock vs Azure

### Mock（默认）

- 零配置，零密钥
- 返回逼真的音素反馈：IPA、expected/heard、score、timing
- 模拟常见中文母语者错误：θ→s/f、ð→d/z、v→w 等
- 中文 tips 1–3 条

环境变量：

```bash
PRONUNCIATION_PROVIDER=mock   # default
```

### Azure（stub）

设置：

```bash
PRONUNCIATION_PROVIDER=azure
AZURE_SPEECH_KEY=your_key
AZURE_SPEECH_REGION=eastus
```

- 若 **未配置** key/region → 自动回退 mock（`provider: "azure→mock"`）
- 若已配置 → 当前仍为 stub（接口已预留，便于接入 Speech SDK）

客户端也可在 `FormData` 里传 `provider=mock|azure`。

---

## Curriculum / 课程种子

- **L1**：约 10 条跟读短句 + 1 段入门对话
- **L2**：2–3 段情景对话 + 少量跟读
- **L3**：约 6–8 条难音密集句 + 1 段进阶对话

数据：`src/lib/curriculum.ts`

---

## Architecture / 架构要点

```
src/lib/pronunciation/
  types.ts          PronunciationProvider interface
  mock.ts           Mock engine (default)
  azure.ts          Azure stub → fallback mock
  index.ts          getPronunciationProvider()
```

UI chrome（按钮/模式）用中文；练习句子为英文。

---

## Screenshots / 截图

Demo screenshots:

- `/workspace/englist1/screenshots/01-home.png`
- `/workspace/englist1/screenshots/02-shadowing-l1-s05.png`
- `/workspace/englist1/screenshots/03-dialogue-l2-d01.png`
- `/workspace/englist1/screenshots/04-feedback-demo.png`

Also copied to `/workspace/screenshots/`. Demo feedback UI: `/demo/feedback`。

---

## License

MVP for local demo. Built with Next.js App Router + TypeScript + Tailwind.
