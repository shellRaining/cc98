import type { IndexColumn } from "@cc98/api";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { SiteManageColumnKind } from "../site-manage";
import { typedPost, typedPut } from "../../lib/http";
import { queryKeys } from "../queries/index.ts";

export interface SiteManageColumnInput {
  id: number | null;
  type: 1 | 2 | 4 | 7;
  title: string;
  content: string;
  url: string;
  imageUrl: string;
  orderWeight: number;
  enable: boolean;
  days: number;
  visibility: 0 | 1 | 2;
  isNew: boolean;
}

export type SiteManageColumnPayload = Omit<SiteManageColumnInput, "id" | "isNew">;

export function siteManageColumnPayload(draft: SiteManageColumnInput): SiteManageColumnPayload {
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

export function putSiteAnnouncement(announcement: string) {
  return typedPut<void>("/config/global/announcement", { announcement });
}

export function putHomepageCacheRefresh() {
  return typedPut<void>("/config/index/update");
}

export function saveSiteManageColumn(draft: SiteManageColumnInput) {
  const payload = siteManageColumnPayload(draft);
  if (draft.isNew || draft.id == null) {
    return typedPost<IndexColumn | void>("/index/column/", payload);
  }
  return typedPut<IndexColumn | void>(`/index/column/${draft.id}`, payload);
}

export function useUpdateSiteAnnouncementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: putSiteAnnouncement,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.siteManageGlobal }),
        queryClient.invalidateQueries({ queryKey: queryKeys.homepageIndex }),
      ]);
    },
  });
}

export function useRefreshHomepageCacheMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: putHomepageCacheRefresh,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.homepageIndex }),
        queryClient.invalidateQueries({ queryKey: queryKeys.homepageAdvertisements }),
      ]);
    },
  });
}

export function useSaveSiteManageColumnMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ draft }: { kind: SiteManageColumnKind; draft: SiteManageColumnInput }) =>
      saveSiteManageColumn(draft),
    onSuccess: async (_data, { kind }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.siteManageColumns(kind) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.homepageIndex }),
        queryClient.invalidateQueries({ queryKey: queryKeys.homepageAdvertisements }),
      ]);
    },
  });
}
