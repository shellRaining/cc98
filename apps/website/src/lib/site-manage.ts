import type { IndexColumn } from "@cc98/api";

export const SITE_MANAGE_COLUMN_KINDS = [
  "recommendationReading",
  "recommendationFunction",
  "advertisement",
  "specialOffer",
] as const;

export type SiteManageColumnKind = (typeof SITE_MANAGE_COLUMN_KINDS)[number];

export interface SiteManageColumnDefinition {
  kind: SiteManageColumnKind;
  label: string;
  type: 1 | 2 | 4 | 7;
  path: string;
  hasContent: boolean;
  hasImage: boolean;
  hasOrderWeight: boolean;
  hasDays: boolean;
}

export const SITE_MANAGE_COLUMN_DEFINITIONS: Record<
  SiteManageColumnKind,
  SiteManageColumnDefinition
> = {
  recommendationReading: {
    kind: "recommendationReading",
    label: "推荐阅读",
    type: 1,
    path: "/index/column/recommandationreading/all",
    hasContent: true,
    hasImage: true,
    hasOrderWeight: true,
    hasDays: false,
  },
  recommendationFunction: {
    kind: "recommendationFunction",
    label: "推荐功能",
    type: 2,
    path: "/index/column/recommandationfunction/all",
    hasContent: false,
    hasImage: true,
    hasOrderWeight: true,
    hasDays: false,
  },
  advertisement: {
    kind: "advertisement",
    label: "Banner",
    type: 4,
    path: "/config/global/advertisement/all",
    hasContent: false,
    hasImage: true,
    hasOrderWeight: false,
    hasDays: true,
  },
  specialOffer: {
    kind: "specialOffer",
    label: "福利优惠",
    type: 7,
    path: "/config/global/special-offer/all",
    hasContent: false,
    hasImage: false,
    hasOrderWeight: false,
    hasDays: true,
  },
};

export interface SiteManageColumnDraft {
  id: number | null;
  type: 1 | 2 | 4 | 7;
  title: string;
  content: string;
  url: string;
  imageUrl: string;
  orderWeight: number;
  enable: boolean;
  days: number;
  expiredTime: string | null;
  visibility: 0 | 1 | 2;
  isNew: boolean;
}

export type SiteManageColumnPayload = Omit<SiteManageColumnDraft, "id" | "expiredTime" | "isNew">;

export function isSiteAdministrator(privilege: string | null | undefined): boolean {
  return privilege === "管理员";
}

function normalizeVisibility(value: number | undefined, fallback: 0 | 1): 0 | 1 | 2 {
  return value === 0 || value === 1 || value === 2 ? value : fallback;
}

export function createSiteManageColumnDraft(kind: SiteManageColumnKind): SiteManageColumnDraft {
  const definition = SITE_MANAGE_COLUMN_DEFINITIONS[kind];
  return {
    id: null,
    type: definition.type,
    title: "",
    content: "",
    url: "",
    imageUrl: "",
    orderWeight: 0,
    enable: true,
    days: definition.hasDays ? 7 : 0,
    expiredTime: null,
    visibility: definition.type === 4 ? 1 : 0,
    isNew: true,
  };
}

export function normalizeSiteManageColumn(
  item: IndexColumn,
  kind: SiteManageColumnKind,
): SiteManageColumnDraft {
  const definition = SITE_MANAGE_COLUMN_DEFINITIONS[kind];
  return {
    id: item.id ?? null,
    type: definition.type,
    title: item.title ?? "",
    content: item.content ?? "",
    url: item.url ?? "",
    imageUrl: item.imageUrl ?? "",
    orderWeight: item.orderWeight ?? 0,
    enable: item.enable ?? false,
    days: item.days ?? 0,
    expiredTime: item.expiredTime ?? null,
    visibility: normalizeVisibility(item.visibility, definition.type === 4 ? 1 : 0),
    isNew: false,
  };
}

export function siteManageColumnPayload(draft: SiteManageColumnDraft): SiteManageColumnPayload {
  return {
    type: draft.type,
    title: draft.title.trim(),
    content: draft.content.trim(),
    url: draft.url.trim(),
    imageUrl: draft.imageUrl.trim(),
    orderWeight: draft.orderWeight,
    enable: draft.enable,
    days: draft.days,
    visibility: draft.visibility,
  };
}

export function validateSiteManageColumn(
  draft: SiteManageColumnDraft,
  kind: SiteManageColumnKind,
): string | null {
  const definition = SITE_MANAGE_COLUMN_DEFINITIONS[kind];
  if (!draft.title.trim()) return "请填写标题";
  if (!draft.url.trim()) return "请填写链接地址";
  if (definition.hasContent && !draft.content.trim()) return "请填写推荐内容";
  if (definition.hasImage && !draft.imageUrl.trim()) return "请填写图片地址";
  if (definition.hasOrderWeight && !Number.isFinite(draft.orderWeight)) {
    return "排序权重必须是数字";
  }
  if (definition.hasDays && (!Number.isInteger(draft.days) || draft.days <= 0)) {
    return "有效天数必须是大于 0 的整数";
  }
  return null;
}
