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
  showLogin?: boolean;
  showRetry?: boolean;
}

export const FULL_PAGE_STATUS_CONFIG: Record<FullPageStatusKind, FullPageStatusConfig> = {
  unauthorized: {
    documentTitle: "您没有权限进入这个页面",
    image: "/static/images/401.webp",
    imageAlt: "401 未授权",
    title: "糟糕！好像出错了",
    message: "您没有权限进入这个页面或未登录",
    showLogin: true,
  },
  forbidden: {
    documentTitle: "操作失败或被拒绝",
    image: "/static/images/403.webp",
    imageAlt: "403 禁止访问",
    title: "糟糕！好像出错了",
    message: "您没有权限进行这个操作",
  },
  "not-found": {
    documentTitle: "页面不存在",
    image: "/static/images/404.webp",
    imageAlt: "404 页面不存在",
    title: "糟糕！好像出错了",
    message: "页面不存在",
  },
  server: {
    documentTitle: "服务器发生错误",
    image: "/static/images/500.webp",
    imageAlt: "500 服务器错误",
    title: "糟糕！好像出错了",
    message: "服务器发生错误",
    showRetry: true,
  },
  maintenance: {
    documentTitle: "论坛正在维护",
    image: "/static/images/500.webp",
    imageAlt: "论坛维护中",
    title: "论坛正在维护",
    message: "论坛暂时无法访问，请稍后再来",
    showRetry: true,
  },
  network: {
    documentTitle: "网络连接中断",
    image: "/static/images/500.webp",
    imageAlt: "网络连接中断",
    title: "网络连接中断",
    message: "请检查网络连接后重试",
    showRetry: true,
  },
};
