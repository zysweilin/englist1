import { CoachError } from "./contracts";

export function usesChatGPTPlan() { return process.env.CHATGPT_PLAN_ENABLED === "1"; }

/** The personal-plan runtime must only be accessible from this computer. */
export function requireLocalChatGPT(request: Request) {
  if (!usesChatGPTPlan()) throw new CoachError("此部署未启用本地 ChatGPT 套餐登录。", 404);
  const host = request.headers.get("host") || new URL(request.url).host;
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host) ||
    request.headers.get("sec-fetch-site") === "cross-site") {
    throw new CoachError("ChatGPT 套餐连接仅供本机使用。", 403);
  }
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== host) throw new CoachError("请从本站页面连接 ChatGPT。", 403);
}

export function chatGPTMessage(code: string): string {
  const messages: Record<string, string> = {
    sign_in_required: "请先使用 ChatGPT 登录。",
    sharing_not_enabled: "已登录，但尚未授权使用 ChatGPT 套餐。请重新连接并开启套餐使用权限。",
    sign_in_failed: "ChatGPT 登录未完成，请重试。",
    cancelled: "已取消 ChatGPT 登录或请求。",
    connection_busy: "ChatGPT 正在连接，请完成当前登录。",
    network_error: "无法连接 ChatGPT，请检查网络后重试。",
    discovery_failed: "暂时无法读取官方登录配置，请重试。",
    identity_verification_unavailable: "暂时无法验证官方登录身份，请稍后重试；已有连接会保留。",
    invalid_grant: "登录授权已过期，请重新连接。",
    usage_limit_reached: "ChatGPT 套餐额度已达限制，请在 ChatGPT 中管理用量。",
    rate_limit_exceeded: "ChatGPT 请求达到限制，请稍后重试或查看套餐用量。",
    sharing_limit_reached: "ChatGPT 套餐共享额度已达限制，请查看套餐用量。",
  };
  return messages[code] || `ChatGPT 暂时无法完成请求（${code.replace(/[^a-z0-9_]/gi, "").slice(0, 70)}），请重试或查看套餐用量。`;
}
