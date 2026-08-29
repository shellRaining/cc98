import { defaultUbbRegistry, matchUbbRegexTagFamily, type UbbStaticTagName } from "@cc98/ubb";
import type { VNodeChild } from "vue";
import type { UbbRenderContext } from "./context";
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

const staticTagHandlers = {
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

/**
 * 网站的 Vue UBB renderer：输出 VNodeChild 数组。
 * 标签解析模式来自 @cc98/ubb 的默认注册器，handler 键由 registry 泛型推导，
 * 新增静态标签时类型系统会要求同步登记 handler。
 */
export const ubbVueRenderer = defaultUbbRegistry.createRenderer<VNodeChild[], UbbRenderContext>({
  text: (value) => [value],
  concat: (parts) => parts.flat(),
  handlers: staticTagHandlers,
  fallback: (props) => {
    if (matchUbbRegexTagFamily(props.node.tag)) return renderEmotionTag(props);
    return [`[${props.node.tag}]${props.text}[/${props.node.tag}]`];
  },
});
