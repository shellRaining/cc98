import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { normalizeFloorHash } from "../lib/route-params";

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
