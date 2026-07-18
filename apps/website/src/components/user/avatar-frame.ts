export type AvatarFrameVariant = "post" | "profile";

interface AvatarFrameStyle {
  width: string;
  top: string;
  left?: string;
}

export interface AvatarFrameDefinition {
  imageUrl: string;
  post: Required<AvatarFrameStyle>;
  profile: AvatarFrameStyle;
  keepPostShadow?: boolean;
}

const frameDefinitions = {
  mascot: {
    imageUrl: "/static/images/相框/守护天使.png",
    post: { width: "6.66rem", left: "-3.33rem", top: "-3.2rem" },
    profile: { width: "13.32rem", top: "-1.45rem" },
  },
  moderator: {
    imageUrl: "/static/images/相框/版主.png",
    post: { width: "7.64rem", left: "-3.5rem", top: "-3.5rem" },
    profile: { width: "15rem", left: "-1.75rem", top: "-2rem" },
  },
  editorial: {
    imageUrl: "/static/images/相框/编辑部.png",
    post: { width: "7.5rem", left: "-3.5rem", top: "-3.5rem" },
    profile: { width: "15rem", left: "-1.75rem", top: "-2rem" },
  },
  technical: {
    imageUrl: "/static/images/相框/技术组.png",
    post: { width: "6.6rem", left: "-3.3rem", top: "-3.3rem" },
    profile: { width: "13rem", left: "-1.2rem", top: "-1.4rem" },
  },
  vip: {
    imageUrl: "/static/images/相框/贵宾.png",
    post: { width: "7.5rem", left: "-3.55rem", top: "-3.5rem" },
    profile: { width: "15rem", left: "-1.75rem", top: "-2rem" },
  },
  planning: {
    imageUrl: "/static/images/相框/策划部.png",
    post: { width: "7.5rem", left: "-3.55rem", top: "-3.5rem" },
    profile: { width: "15rem", left: "-1.75rem", top: "-2rem" },
  },
  media: {
    imageUrl: "/static/images/相框/影音部.png",
    post: { width: "7.5rem", left: "-3.55rem", top: "-3.5rem" },
    profile: { width: "15rem", left: "-1.75rem", top: "-2rem" },
  },
  operations: {
    imageUrl: "/static/images/相框/站务组.png",
    post: { width: "8rem", left: "-4.2rem", top: "-3.9rem" },
    profile: { width: "15.2rem", left: "-2.75rem", top: "-2.5rem" },
  },
  sports: {
    imageUrl: "/static/images/相框/体艺部.png",
    post: { width: "7.5rem", left: "-3.55rem", top: "-3.5rem" },
    profile: { width: "15rem", left: "-1.75rem", top: "-2rem" },
  },
  office: {
    imageUrl: "/static/images/相框/办公室.png",
    post: { width: "7.5rem", left: "-3.55rem", top: "-3.5rem" },
    profile: { width: "15rem", left: "-1.75rem", top: "-2rem" },
  },
  verified: {
    imageUrl: "/static/images/相框/认证用户.png",
    post: { width: "7.5rem", left: "-3.5rem", top: "-3.5rem" },
    profile: { width: "15rem", left: "-1.75rem", top: "-2rem" },
  },
  annual: {
    imageUrl: "/static/images/相框/年度用户.png",
    post: { width: "7.5rem", left: "-3.7rem", top: "-3.5rem" },
    profile: { width: "15rem", left: "-2rem", top: "-2rem" },
    keepPostShadow: true,
  },
} satisfies Record<string, AvatarFrameDefinition>;

const frameKeyByDisplayTitleId = new Map<number, keyof typeof frameDefinitions>([
  [82, "mascot"],
  [18, "moderator"],
  [22, "moderator"],
  [85, "editorial"],
  [29, "editorial"],
  [37, "technical"],
  [23, "technical"],
  [28, "vip"],
  [16, "vip"],
  [84, "planning"],
  [34, "planning"],
  [96, "media"],
  [99, "media"],
  [32, "operations"],
  [21, "operations"],
  [86, "sports"],
  [35, "sports"],
  [94, "office"],
  [93, "office"],
  [91, "verified"],
  [104, "annual"],
]);

export function getAvatarFrame(
  displayTitleId: number | null | undefined,
): AvatarFrameDefinition | null {
  if (displayTitleId == null) return null;
  const key = frameKeyByDisplayTitleId.get(displayTitleId);
  return key ? frameDefinitions[key] : null;
}
