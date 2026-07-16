import type { IndexColumn } from "@cc98/api";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import {
  siteManageColumnPayload,
  type SiteManageColumnDraft,
  type SiteManageColumnKind,
} from "../../lib/site-manage";
import { typedPost, typedPut } from "../../lib/http";
import { queryKeys } from "../queries/index.ts";

export function putSiteAnnouncement(announcement: string) {
  return typedPut<void>("/config/global/announcement", { announcement });
}

export function putHomepageCacheRefresh() {
  return typedPut<void>("/config/index/update");
}

export function saveSiteManageColumn(draft: SiteManageColumnDraft) {
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
    mutationFn: ({ draft }: { kind: SiteManageColumnKind; draft: SiteManageColumnDraft }) =>
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
