export type NewTopicViewMode = "classic" | "card" | "media";

export function resolveNewTopicViewMode(value: unknown, preference = 0): NewTopicViewMode {
  if (value === "classic" || value === "card" || value === "media") return value;
  if (preference === 1) return "card";
  if (preference === 2) return "media";
  return "classic";
}

export function newTopicViewPreference(mode: NewTopicViewMode) {
  if (mode === "card") return 1;
  if (mode === "media") return 2;
  return 0;
}

export function newTopicsPath(mode: NewTopicViewMode) {
  return mode === "classic" ? "/newtopics" : `/newtopics?view=${mode}`;
}
