import { h } from "vue";
import UniverseMessageBar from "../universe/UniverseMessageBar.vue";
import type { UbbTagRenderer } from "./types";

interface MessageSetting {
  message: string;
  tone: "info" | "warning";
}

const messages: Record<string, readonly MessageSetting[]> = {
  needreply: [{ message: "该内容需要回复后才能浏览", tone: "warning" }],
  posteronly: [
    {
      message: "该主题启用了“仅主题帖作者可见”功能。只有主题帖作者可以看到其他人的发言。",
      tone: "warning",
    },
    {
      message: "该主题启用了“仅主题帖作者可见”功能，您是主题帖作者，因此可以看到其他人的发言。",
      tone: "info",
    },
    {
      message: "该主题启用了“仅主题帖作者可见”功能，您可以看到主题帖作者的发言。",
      tone: "info",
    },
    {
      message: "该主题启用了“仅主题帖作者可见”功能，但您可以看到自己的发言。",
      tone: "info",
    },
  ],
  allowviewer: [
    {
      message: "该主题启用了“仅特定用户可见”功能。您不在该内容的可见用户列表中。",
      tone: "warning",
    },
    {
      message: "该主题启用了“仅特定用户可见”功能，您在该内容的可见用户列表中。",
      tone: "info",
    },
    {
      message: "该主题启用了“仅特定用户可见”功能，但您始终可以看到自己的发言。",
      tone: "info",
    },
  ],
};

export function resolvePermissionMessage(tag: string, value?: string): MessageSetting | null {
  const settings = messages[tag];
  if (!settings) return null;
  const parsed = Number.parseInt(value ?? "0", 10);
  const index = Number.isInteger(parsed) && parsed >= 0 && parsed < settings.length ? parsed : 0;
  return settings[index];
}

export const renderPermissionTag: UbbTagRenderer = (node) => {
  const setting = resolvePermissionMessage(node.tag, node.attrs.positionals[0]);
  return setting ? h(UniverseMessageBar, setting) : `[${node.tag}]`;
};
