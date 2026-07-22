import annualFrameUrl from "../../assets/user/avatar-frames/年度用户.png";
import editorialFrameUrl from "../../assets/user/avatar-frames/编辑部.png";
import mascotFrameUrl from "../../assets/user/avatar-frames/守护天使.png";
import mediaFrameUrl from "../../assets/user/avatar-frames/影音部.png";
import moderatorFrameUrl from "../../assets/user/avatar-frames/版主.png";
import officeFrameUrl from "../../assets/user/avatar-frames/办公室.png";
import operationsFrameUrl from "../../assets/user/avatar-frames/站务组.png";
import planningFrameUrl from "../../assets/user/avatar-frames/策划部.png";
import sportsFrameUrl from "../../assets/user/avatar-frames/体艺部.png";
import technicalFrameUrl from "../../assets/user/avatar-frames/技术组.png";
import verifiedFrameUrl from "../../assets/user/avatar-frames/认证用户.png";
import vipFrameUrl from "../../assets/user/avatar-frames/贵宾.png";

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
    imageUrl: mascotFrameUrl,
    post: { width: "6.66rem", left: "-3.33rem", top: "-3.2rem" },
    profile: { width: "13.32rem", top: "-1.45rem" },
  },
  moderator: {
    imageUrl: moderatorFrameUrl,
    post: { width: "7.64rem", left: "-3.5rem", top: "-3.5rem" },
    profile: { width: "15rem", left: "-1.75rem", top: "-2rem" },
  },
  editorial: {
    imageUrl: editorialFrameUrl,
    post: { width: "7.5rem", left: "-3.5rem", top: "-3.5rem" },
    profile: { width: "15rem", left: "-1.75rem", top: "-2rem" },
  },
  technical: {
    imageUrl: technicalFrameUrl,
    post: { width: "6.6rem", left: "-3.3rem", top: "-3.3rem" },
    profile: { width: "13rem", left: "-1.2rem", top: "-1.4rem" },
  },
  vip: {
    imageUrl: vipFrameUrl,
    post: { width: "7.5rem", left: "-3.55rem", top: "-3.5rem" },
    profile: { width: "15rem", left: "-1.75rem", top: "-2rem" },
  },
  planning: {
    imageUrl: planningFrameUrl,
    post: { width: "7.5rem", left: "-3.55rem", top: "-3.5rem" },
    profile: { width: "15rem", left: "-1.75rem", top: "-2rem" },
  },
  media: {
    imageUrl: mediaFrameUrl,
    post: { width: "7.5rem", left: "-3.55rem", top: "-3.5rem" },
    profile: { width: "15rem", left: "-1.75rem", top: "-2rem" },
  },
  operations: {
    imageUrl: operationsFrameUrl,
    post: { width: "8rem", left: "-4.2rem", top: "-3.9rem" },
    profile: { width: "15.2rem", left: "-2.75rem", top: "-2.5rem" },
  },
  sports: {
    imageUrl: sportsFrameUrl,
    post: { width: "7.5rem", left: "-3.55rem", top: "-3.5rem" },
    profile: { width: "15rem", left: "-1.75rem", top: "-2rem" },
  },
  office: {
    imageUrl: officeFrameUrl,
    post: { width: "7.5rem", left: "-3.55rem", top: "-3.5rem" },
    profile: { width: "15rem", left: "-1.75rem", top: "-2rem" },
  },
  verified: {
    imageUrl: verifiedFrameUrl,
    post: { width: "7.5rem", left: "-3.5rem", top: "-3.5rem" },
    profile: { width: "15rem", left: "-1.75rem", top: "-2rem" },
  },
  annual: {
    imageUrl: annualFrameUrl,
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
