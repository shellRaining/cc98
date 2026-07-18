import { resolve } from "node:path";
import { defineConfig } from "vitepress";

const siteUrl = process.env.DOCS_SITE_URL || "https://cc98-docs.vercel.app";

export default defineConfig({
  lang: "zh-CN",
  title: "CC98 帮助中心",
  description: "登录、浏览、发帖、消息、账号和外观设置说明。",
  srcDir: "content",
  outDir: "dist",
  vite: { publicDir: resolve(import.meta.dirname, "../public") },
  sitemap: { hostname: siteUrl },
  head: [["link", { rel: "icon", type: "image/x-icon", href: "/favicon.ico" }]],
  themeConfig: {
    logo: "/favicon.ico",
    siteTitle: "CC98 帮助中心",
    nav: [
      { text: "使用指南", link: "/guide/getting-started" },
      { text: "常见问题", link: "/faq/troubleshooting" },
      { text: "返回论坛", link: "https://www.cc98.org" },
    ],
    sidebar: [
      {
        text: "开始使用",
        items: [
          { text: "登录并开始使用", link: "/guide/getting-started" },
          { text: "浏览版面和主题", link: "/guide/browsing" },
        ],
      },
      {
        text: "发表内容",
        items: [{ text: "发主题、回复和编辑", link: "/guide/writing" }],
      },
      {
        text: "账号与消息",
        items: [
          { text: "管理个人内容", link: "/account/personal-content" },
          { text: "查看通知和私信", link: "/messages/overview" },
        ],
      },
      {
        text: "外观与帮助",
        items: [
          { text: "调整皮肤和明暗模式", link: "/appearance/theme" },
          { text: "常见问题", link: "/faq/troubleshooting" },
        ],
      },
    ],
    search: { provider: "local" },
    outline: { level: [2, 3], label: "本页内容" },
    docFooter: { prev: "上一篇", next: "下一篇" },
    darkModeSwitchLabel: "切换显示模式",
    sidebarMenuLabel: "文档目录",
    returnToTopLabel: "返回顶部",
    footer: {
      message: "CC98 帮助中心",
      copyright: "Copyright © 2003-2026 CC98",
    },
  },
});
