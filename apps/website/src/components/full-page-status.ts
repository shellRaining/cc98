import unauthorizedImage from "../assets/status/401.webp";
import forbiddenImage from "../assets/status/403.webp";
import notFoundImage from "../assets/status/404.webp";
import serverImage from "../assets/status/500.webp";

export type FullPageStatusKind =
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "server"
  | "maintenance"
  | "network";

export interface FullPageStatusConfig {
  documentTitle: string;
  image: string;
  imageAlt: string;
  title: string;
  message: string;
  showHome?: boolean;
  showLogin?: boolean;
  showRetry?: boolean;
}

export const FULL_PAGE_STATUS_CONFIG: Record<FullPageStatusKind, FullPageStatusConfig> = {
  unauthorized: {
    documentTitle: "您未登录",
    image: unauthorizedImage,
    imageAlt: "401 未授权",
    title: "糟糕！好像出错了",
    message: "您当前未登录",
    showHome: false,
    showLogin: true,
  },
  forbidden: {
    documentTitle: "操作失败或被拒绝",
    image: forbiddenImage,
    imageAlt: "403 禁止访问",
    title: "糟糕！好像出错了",
    message: "您没有权限进行这个操作",
  },
  "not-found": {
    documentTitle: "页面不存在",
    image: notFoundImage,
    imageAlt: "404 页面不存在",
    title: "糟糕！好像出错了",
    message: "页面不存在",
  },
  server: {
    documentTitle: "服务器发生错误",
    image: serverImage,
    imageAlt: "500 服务器错误",
    title: "糟糕！好像出错了",
    message: "服务器发生错误",
    showRetry: true,
  },
  maintenance: {
    documentTitle: "论坛正在维护",
    image: serverImage,
    imageAlt: "论坛维护中",
    title: "论坛正在维护",
    message: "论坛暂时无法访问，请稍后再来",
    showRetry: true,
  },
  network: {
    documentTitle: "网络连接中断",
    image: serverImage,
    imageAlt: "网络连接中断",
    title: "网络连接中断",
    message: "请检查网络连接后重试",
    showRetry: true,
  },
};
