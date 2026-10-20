# 本机 ChatGPT 套餐验证

此模式使用官方 Sign in with ChatGPT DevKit，适用于本机个人验证。
当前 Windows 实现使用 DPAPI CurrentUser 加密，OAuth 状态、PKCE、身份验证、
令牌刷新和撤销由官方 SDK 处理。凭据保存在忽略的 `.local/chatgpt` 中，
不进入浏览器、日志、环境变量或 Git。

在 `.env.local` 设置 `CHATGPT_PLAN_ENABLED=1`，重启并仅绑定回环地址：

```sh
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000
```

打开 `http://127.0.0.1:3000`，点击 **Continue with ChatGPT**，在官方页面
登录并授权套餐使用。连接成功后输入英文，点击「播放并标注」。
输入区提供断开连接和 ChatGPT 用量管理入口。若浏览器拦截弹窗，
点击显示的「打开官方登录页面」链接。

首次分析从账户实际返回的模型目录选择第一个可用模型。
可用 `CHATGPT_ANALYSIS_MODEL` 指定该目录中的 slug；不能用普通 API
账户的模型列表推断套餐权限。界面显示实际使用的模型名。

此模式通过 SDK 的流式 Responses 返回文本，再校验结构化音标数据，
不假定套餐路由支持普通 API 的所有参数。不存在到付费 API 的隐式回退。
当前范读采用设备美式语音；录音保留在本机，暂不使用套餐进行音频转写。
生成音标是建议读法，设备范读并非逐音强制对齐。

Windows 加密器的测试仅使用虚构凭据。账户能否完成推理、套餐限额和
标注质量必须在用户实际授权后验证，构建和模拟测试不能代替这一步。

不要把此模式作为公开服务部署，不能将个人套餐连接共享给远程访客。
未来商业用途需重新检查官方访问资格与 DevKit 的非商业许可。

官方资料：
- https://developers.openai.com/siwc/quickstart
- https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt
- https://github.com/openai/sign-in-with-chatgpt-devkit
