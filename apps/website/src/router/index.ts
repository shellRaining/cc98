import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { normalizeFloorHash } from "../lib/route-params";
import { saveLoginRedirect } from "../lib/login-redirect";
import { useUserStore } from "../stores/user";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/HomeView.vue"),
  },
  {
    path: "/topic/hot-weekly",
    name: "hot-weekly",
    component: () => import("../views/HotTopicsView.vue"),
    meta: { hotPeriod: "weekly" },
  },
  {
    path: "/topic/hot-monthly",
    name: "hot-monthly",
    component: () => import("../views/HotTopicsView.vue"),
    meta: { hotPeriod: "monthly" },
  },
  {
    path: "/topic/hot-history",
    name: "hot-history",
    component: () => import("../views/HotTopicsView.vue"),
    meta: { hotPeriod: "history" },
  },
  {
    path: "/boards/:boardId/topics/new",
    name: "create-topic",
    component: () => import("../views/CreateTopicView.vue"),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: "/posts/:postId/edit",
    name: "edit-post",
    component: () => import("../views/EditPostView.vue"),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: "/topic/:topicId/:page?",
    name: "topic",
    component: () => import("../views/TopicView.vue"),
    props: true,
  },
  {
    path: "/list/:boardId/:type?/:page?",
    name: "board",
    component: () => import("../views/BoardView.vue"),
    props: true,
  },
  {
    path: "/boardlist",
    name: "board-list",
    component: () => import("../views/BoardListView.vue"),
  },
  {
    path: "/newtopics",
    name: "new-topics",
    component: () => import("../views/NewTopicsView.vue"),
  },
  {
    path: "/focus",
    name: "focus",
    component: () => import("../views/FocusView.vue"),
    meta: { requiresAuth: true, focusMode: "board" },
  },
  {
    path: "/focus/board",
    name: "focus-board",
    component: () => import("../views/FocusView.vue"),
    meta: { requiresAuth: true, focusMode: "board" },
  },
  {
    path: "/focus/user",
    name: "focus-user",
    component: () => import("../views/FocusView.vue"),
    meta: { requiresAuth: true, focusMode: "user" },
  },
  {
    path: "/focus/favorite",
    name: "focus-favorite",
    component: () => import("../views/FocusView.vue"),
    meta: { requiresAuth: true, focusMode: "favorite" },
  },
  {
    path: "/recommendedtopics",
    name: "recommended-topics",
    component: () => import("../views/RecommendedTopicsView.vue"),
  },
  {
    path: "/search",
    name: "search-topics",
    component: () => import("../views/SearchTopicsView.vue"),
  },
  {
    path: "/search/boards",
    name: "search-boards",
    component: () => import("../views/SearchBoardsView.vue"),
  },
  {
    path: "/searchBoard",
    redirect: (to) => ({
      path: "/search/boards",
      query: to.query,
    }),
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
    meta: { requiresAuth: true },
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
        component: () => import("../views/user-center/UserRelationsView.vue"),
        meta: { relationKind: "following" },
      },
      {
        path: "followers",
        name: "user-center-followers",
        component: () => import("../views/user-center/UserRelationsView.vue"),
        meta: { relationKind: "followers" },
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
    ],
  },
  {
    path: "/signin",
    name: "signin",
    component: () => import("../views/SigninView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/logon",
    name: "logon",
    component: () => import("../views/LogOnView.vue"),
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
  if (!to.meta.requiresAuth) return true;
  const user = useUserStore();
  if (user.isLoggedIn) return true;
  saveLoginRedirect(to.fullPath);
  return { name: "logon" };
});
