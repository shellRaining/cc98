export const SITE_MANAGE_COLUMN_KINDS = [
  "recommendationReading",
  "recommendationFunction",
  "advertisement",
  "specialOffer",
] as const;

export type SiteManageColumnKind = (typeof SITE_MANAGE_COLUMN_KINDS)[number];

export const SITE_MANAGE_COLUMN_API: Record<
  SiteManageColumnKind,
  { type: 1 | 2 | 4 | 7; path: string }
> = {
  recommendationReading: {
    type: 1,
    path: "/index/column/recommandationreading/all",
  },
  recommendationFunction: {
    type: 2,
    path: "/index/column/recommandationfunction/all",
  },
  advertisement: {
    type: 4,
    path: "/config/global/advertisement/all",
  },
  specialOffer: {
    type: 7,
    path: "/config/global/special-offer/all",
  },
};
