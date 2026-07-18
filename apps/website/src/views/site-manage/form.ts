import type { IndexColumn } from "@cc98/api";
import { SITE_MANAGE_COLUMN_API, type SiteManageColumnKind } from "../../api/site-manage";

export interface SiteManageColumnDefinition {
  kind: SiteManageColumnKind;
  label: string;
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
    hasContent: true,
    hasImage: true,
    hasOrderWeight: true,
    hasDays: false,
  },
  recommendationFunction: {
    kind: "recommendationFunction",
    label: "推荐功能",
    hasContent: false,
    hasImage: true,
    hasOrderWeight: true,
    hasDays: false,
  },
  advertisement: {
    kind: "advertisement",
    label: "Banner",
    hasContent: false,
    hasImage: true,
    hasOrderWeight: false,
    hasDays: true,
  },
  specialOffer: {
    kind: "specialOffer",
    label: "福利优惠",
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

function normalizeVisibility(value: number | undefined, fallback: 0 | 1): 0 | 1 | 2 {
  return value === 0 || value === 1 || value === 2 ? value : fallback;
}

export function createSiteManageColumnDraft(kind: SiteManageColumnKind): SiteManageColumnDraft {
  const definition = SITE_MANAGE_COLUMN_DEFINITIONS[kind];
  const type = SITE_MANAGE_COLUMN_API[kind].type;
  return {
    id: null,
    type,
    title: "",
    content: "",
    url: "",
    imageUrl: "",
    orderWeight: 0,
    enable: true,
    days: definition.hasDays ? 7 : 0,
    expiredTime: null,
    visibility: type === 4 ? 1 : 0,
    isNew: true,
  };
}

export function normalizeSiteManageColumn(
  item: IndexColumn,
  kind: SiteManageColumnKind,
): SiteManageColumnDraft {
  const type = SITE_MANAGE_COLUMN_API[kind].type;
  return {
    id: item.id ?? null,
    type,
    title: item.title ?? "",
    content: item.content ?? "",
    url: item.url ?? "",
    imageUrl: item.imageUrl ?? "",
    orderWeight: item.orderWeight ?? 0,
    enable: item.enable ?? false,
    days: item.days ?? 0,
    expiredTime: item.expiredTime ?? null,
    visibility: normalizeVisibility(item.visibility, type === 4 ? 1 : 0),
    isNew: false,
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
