import { globalConfigSchema, indexColumnSchema } from "@cc98/api";
import { queryOptions } from "@tanstack/vue-query";
import { SITE_MANAGE_COLUMN_DEFINITIONS, type SiteManageColumnKind } from "../../lib/site-manage";
import { typedGet } from "../../lib/http";
import { queryKeys } from "./keys.ts";

export const siteManageGlobalConfigQuery = (enabled = true) =>
  queryOptions({
    queryKey: queryKeys.siteManageGlobal,
    queryFn: async () => {
      const data = await typedGet<unknown>("/config/global");
      return globalConfigSchema.parse(data);
    },
    enabled,
  });

export const siteManageColumnsQuery = (kind: SiteManageColumnKind, enabled = true) =>
  queryOptions({
    queryKey: queryKeys.siteManageColumns(kind),
    queryFn: async () => {
      const data = await typedGet<unknown>(SITE_MANAGE_COLUMN_DEFINITIONS[kind].path);
      return indexColumnSchema.array().parse(data);
    },
    enabled,
  });
