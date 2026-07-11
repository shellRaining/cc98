import { matchUbbRegexTagFamily, type UbbRegexTagFamily, type UbbStaticTagName } from "@cc98/ubb";
import { renderEmotionTag } from "./emotion";
import { renderLiteralTag } from "./literal";
import { renderSiteLinkTag, renderUrlTag } from "./link";
import {
  renderBiliTag,
  renderImageTag,
  renderMathTag,
  renderMediaTag,
  renderUploadTag,
} from "./media";
import { renderPermissionTag } from "./permission";
import { renderDividerTag, renderQuoteTag, renderTableTag } from "./structure";
import { renderAlignmentTag, renderTextStyleTag } from "./textStyle";
import type { UbbTagRenderer } from "./types";

export const staticTagRenderers = {
  b: renderTextStyleTag,
  i: renderTextStyleTag,
  u: renderTextStyleTag,
  del: renderTextStyleTag,
  english: renderTextStyleTag,
  left: renderAlignmentTag,
  center: renderAlignmentTag,
  right: renderAlignmentTag,
  size: renderTextStyleTag,
  color: renderTextStyleTag,
  font: renderTextStyleTag,
  align: renderAlignmentTag,
  cursor: renderTextStyleTag,
  url: renderUrlTag,
  table: renderTableTag,
  tr: renderTableTag,
  td: renderTableTag,
  th: renderTableTag,
  quote: renderQuoteTag,
  quotex: renderQuoteTag,
  user: renderSiteLinkTag,
  topic: renderSiteLinkTag,
  board: renderSiteLinkTag,
  pm: renderSiteLinkTag,
  code: renderLiteralTag,
  md: renderLiteralTag,
  noubb: renderLiteralTag,
  img: renderImageTag,
  audio: renderMediaTag,
  mp3: renderMediaTag,
  video: renderMediaTag,
  upload: renderUploadTag,
  bili: renderBiliTag,
  math: renderMathTag,
  m: renderMathTag,
  line: renderDividerTag,
  needreply: renderPermissionTag,
  posteronly: renderPermissionTag,
  allowviewer: renderPermissionTag,
} satisfies Record<UbbStaticTagName, UbbTagRenderer>;

export const regexFamilyRenderers = {
  em: renderEmotionTag,
  ac: renderEmotionTag,
  ms: renderEmotionTag,
  mahjong: renderEmotionTag,
  cc98: renderEmotionTag,
  tb: renderEmotionTag,
} satisfies Record<UbbRegexTagFamily, UbbTagRenderer>;

export function resolveUbbTagRenderer(tag: string): UbbTagRenderer | undefined {
  const staticRenderer = staticTagRenderers[tag as UbbStaticTagName];
  if (staticRenderer) return staticRenderer;
  const family = matchUbbRegexTagFamily(tag);
  return family ? regexFamilyRenderers[family] : undefined;
}
