type MessageSettingChoice = "是" | "否";

export interface MessageSettings {
  response: MessageSettingChoice;
  attme: MessageSettingChoice;
  system: MessageSettingChoice;
  message: MessageSettingChoice;
  post: MessageSettingChoice;
}

const STORAGE_KEY = "noticeSetting";
const DEFAULT_SETTINGS: MessageSettings = {
  response: "是",
  attme: "是",
  system: "是",
  message: "是",
  post: "否",
};

function isChoice(value: unknown): value is MessageSettingChoice {
  return value === "是" || value === "否";
}

export function loadMessageSettings(): MessageSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<MessageSettings>;
    return {
      response: isChoice(parsed.response) ? parsed.response : DEFAULT_SETTINGS.response,
      attme: isChoice(parsed.attme) ? parsed.attme : DEFAULT_SETTINGS.attme,
      system: isChoice(parsed.system) ? parsed.system : DEFAULT_SETTINGS.system,
      message: isChoice(parsed.message) ? parsed.message : DEFAULT_SETTINGS.message,
      post: isChoice(parsed.post) ? parsed.post : DEFAULT_SETTINGS.post,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveMessageSettings(settings: MessageSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 本地存储不可用时保留当前页面选择，不阻断消息页使用。
  }
}

export function shouldJumpToLatestReply(): boolean {
  return loadMessageSettings().post === "是";
}
