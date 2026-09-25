export type NewTopicViewMode = "classic" | "card";

export function resolveNewTopicViewMode(preference = 0): NewTopicViewMode {
  if (preference === 1) return "card";
  return "classic";
}

export function newTopicViewPreference(mode: NewTopicViewMode) {
  if (mode === "card") return 1;
  return 0;
}
