import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { normalizeFloorHash } from "../lib/route-params";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/HomeView.vue"),
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
