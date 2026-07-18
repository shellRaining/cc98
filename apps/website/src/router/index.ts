import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { normalizeFloorHash } from "../lib/route-params";
import { saveLoginRedirect } from "../lib/login-redirect";
import { isSiteAdministrator, useUserStore } from "../stores/user";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/HomeView.vue"),
  },
  {
    path: "/topic/hot-weekly",
    name: "hot-weekly",
    component: () => import("../views/discovery/HotTopicsView.vue"),
    meta: { hotPeriod: "weekly" },
  },
  {
    path: "/topic/hot-monthly",
    name: "hot-monthly",
    component: () => import("../views/discovery/HotTopicsView.vue"),
    meta: { hotPeriod: "monthly" },
  },
  {
    path: "/topic/hot-history",
    name: "hot-history",
    component: () => import("../views/discovery/HotTopicsView.vue"),
    meta: { hotPeriod: "history" },
  },
  {
    path: "/boards/:boardId/topics/new",
    name: "create-topic",
    component: () => import("../views/writing/CreateTopicView.vue"),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: "/posts/:postId/edit",
    name: "edit-post",
    component: () => import("../views/writing/EditPostView.vue"),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: "/topic/:topicId/:page?",
    name: "topic",
    component: () => import("../views/topic/TopicView.vue"),
    props: true,
  },
  {
    path: "/list/:boardId/:type?/:page?",
    name: "board",
    component: () => import("../views/board/BoardView.vue"),
    props: true,
  },
  {
    path: "/boardlist",
    name: "board-list",
    component: () => import("../views/board/BoardListView.vue"),
  },
  {
    path: "/newtopics",
    name: "new-topics",
    component: () => import("../views/discovery/NewTopicsView.vue"),
  },
  {
    path: "/focus",
    name: "focus",
    component: () => import("../views/discovery/FocusView.vue"),
    meta: { focusMode: "board" },
  },
  {
    path: "/focus/board",
    name: "focus-board",
    component: () => import("../views/discovery/FocusView.vue"),
    meta: { focusMode: "board" },
  },
  {
    path: "/focus/user",
    name: "focus-user",
    component: () => import("../views/discovery/FocusView.vue"),
    meta: { focusMode: "user" },
  },
  {
    path: "/focus/favorite",
    name: "focus-favorite",
    component: () => import("../views/discovery/FocusView.vue"),
    meta: { focusMode: "favorite" },
  },
  {
    path: "/recommendedtopics",
    name: "recommended-topics",
    component: () => import("../views/discovery/RecommendedTopicsView.vue"),
  },
  {
    path: "/search",
    name: "search-topics",
    component: () => import("../views/discovery/SearchTopicsView.vue"),
  },
  {
    path: "/searchBoard",
    name: "search-boards",
    component: () => import("../views/discovery/SearchBoardsView.vue"),
  },
  {
    path: "/search/boards",
    redirect: (to) => ({
      path: "/searchBoard",
      query: to.query,
    }),
  },
  {
    path: "/user/id/:userId/manage",
    name: "user-manage",
    component: () => import("../views/user-manage/UserManageView.vue"),
    props: true,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/user/id/:userId",
    name: "user-id",
    component: () => import("../views/UserView.vue"),
    props: true,
  },
  {
    path: "/user/name/:userName",
    name: "user-name",
    component: () => import("../views/UserView.vue"),
    props: true,
  },
  {
    path: "/usercenter",
    component: () => import("../layouts/UserCenterLayout.vue"),
    children: [
      {
        path: "",
        name: "user-center",
        component: () => import("../views/user-center/UserCenterHomeView.vue"),
      },
      {
        path: "topics",
        name: "user-center-topics",
        component: () => import("../views/user-center/MyTopicsView.vue"),
      },
      {
        path: "settings",
        name: "user-center-settings",
        component: () => import("../views/user-center/UserSettingsView.vue"),
      },
      {
        path: "theme",
        name: "user-center-theme",
        component: () => import("../views/user-center/UserThemeView.vue"),
      },
      {
        path: "posts",
        name: "user-center-posts",
        component: () => import("../views/user-center/MyPostsView.vue"),
      },
      {
        path: "favorites",
        name: "user-center-favorites",
        component: () => import("../views/user-center/MyFavoritesView.vue"),
      },
      {
        path: "history",
        name: "user-center-history",
        component: () => import("../views/user-center/MyHistoryView.vue"),
      },
      {
        path: "following",
        name: "user-center-following",
        component: () => import("../views/user-center/FollowingUsersView.vue"),
      },
      {
        path: "followers",
        name: "user-center-followers",
        component: () => import("../views/user-center/FollowersView.vue"),
      },
      {
        path: "transfer",
        name: "user-center-transfer",
        component: () => import("../views/user-center/TransferWealthView.vue"),
      },
      {
        path: "boards",
        name: "user-center-boards",
        component: () => import("../views/user-center/MyBoardsView.vue"),
      },
    ],
  },
  {
    path: "/messages",
    component: () => import("../layouts/MessagesLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      { path: "", redirect: "/messages/replies" },
      {
        path: "replies",
        name: "messages-replies",
        component: () => import("../views/messages/NotificationListView.vue"),
        meta: { notificationKind: "replies" },
      },
      {
        path: "mentions",
        name: "messages-mentions",
        component: () => import("../views/messages/NotificationListView.vue"),
        meta: { notificationKind: "mentions" },
      },
      {
        path: "system",
        name: "messages-system",
        component: () => import("../views/messages/NotificationListView.vue"),
        meta: { notificationKind: "system" },
      },
      {
        path: "private/:userId?",
        name: "messages-private",
        component: () => import("../views/messages/PrivateMessagesView.vue"),
      },
      {
        path: "settings",
        name: "messages-settings",
        component: () => import("../views/messages/MessageSettingsView.vue"),
      },
    ],
  },
  {
    path: "/signin",
    name: "signin",
    component: () => import("../views/SigninView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/annual-review-2025",
    name: "annual-review-2025",
    component: () => import("../views/annual-review/AnnualReviewView.vue"),
  },
  {
    path: "/sitemanage",
    name: "site-manage",
    component: () => import("../views/site-manage/SiteManageView.vue"),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/logon",
    name: "logon",
    component: () => import("../views/LogOnView.vue"),
  },
  {
    path: "/error/401",
    name: "error-401",
    component: () => import("../views/StatusView.vue"),
    meta: { statusKind: "unauthorized" },
  },
  {
    path: "/error/403",
    name: "error-403",
    component: () => import("../views/StatusView.vue"),
    meta: { statusKind: "forbidden" },
  },
  {
    path: "/error/404",
    name: "error-404",
    component: () => import("../views/StatusView.vue"),
    meta: { statusKind: "not-found" },
  },
  {
    path: "/error/500",
    name: "error-500",
    component: () => import("../views/StatusView.vue"),
    meta: { statusKind: "server" },
  },
  {
    path: "/error/maintenance",
    name: "error-maintenance",
    component: () => import("../views/StatusView.vue"),
    meta: { statusKind: "maintenance" },
  },
  {
    path: "/error/network",
    name: "error-network",
    component: () => import("../views/StatusView.vue"),
    meta: { statusKind: "network" },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../views/NotFoundView.vue"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (_to.hash) {
      const floorHash = normalizeFloorHash(_to.hash);
      const el = floorHash ? `#${floorHash}` : _to.hash;
      return { el, behavior: "smooth" };
    }
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  const user = useUserStore();
  if (to.meta.requiresAuth && !user.isLoggedIn) {
    saveLoginRedirect(to.fullPath);
    return { name: "logon" };
  }
  if (to.meta.requiresAdmin && !isSiteAdministrator(user.user?.privilege)) {
    return { name: "error-403" };
  }
  return true;
});
