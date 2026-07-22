<script setup lang="ts">
defineProps<{
  todayPosts?: number;
  todayTopics?: number;
  topics?: number;
  posts?: number;
  online?: number;
  users?: number;
  latestUser?: string;
}>();

function formatCount(value: number | undefined): string {
  return (value ?? 0).toLocaleString("zh-CN");
}
</script>

<template>
  <div class="home-forum-stats">
    <button class="home-forum-stats__trigger" type="button" aria-label="查看论坛统计">
      <img src="/home/forum-stats-mascot.webp" alt="" />
      <span class="home-forum-stats__status" aria-hidden="true" />
    </button>

    <section class="home-forum-stats__panel" aria-label="论坛统计">
      <header class="home-forum-stats__header">
        <div class="home-forum-stats__identity">
          <span class="home-forum-stats__mark" aria-hidden="true">
            <img src="/home/forum-stats-mascot.webp" alt="" />
          </span>
          <div>
            <h2>论坛统计</h2>
            <p>社区实时概览</p>
          </div>
        </div>
        <span class="home-forum-stats__live"><i aria-hidden="true" />在线</span>
      </header>
      <dl class="home-forum-stats__list">
        <div>
          <dt>今日帖数</dt>
          <dd>{{ formatCount(todayPosts) }}</dd>
        </div>
        <div>
          <dt>今日主题数</dt>
          <dd>{{ formatCount(todayTopics) }}</dd>
        </div>
        <div>
          <dt>论坛总主题数</dt>
          <dd>{{ formatCount(topics) }}</dd>
        </div>
        <div>
          <dt>论坛总回复数</dt>
          <dd>{{ formatCount(posts) }}</dd>
        </div>
        <div>
          <dt>在线用户数</dt>
          <dd>{{ formatCount(online) }}</dd>
        </div>
        <div>
          <dt>总用户数</dt>
          <dd>{{ formatCount(users) }}</dd>
        </div>
        <div>
          <dt>欢迎新用户</dt>
          <dd>
            <RouterLink v-if="latestUser" :to="`/user/name/${encodeURIComponent(latestUser)}`">
              {{ latestUser }}
            </RouterLink>
            <template v-else>暂无</template>
          </dd>
        </div>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.home-forum-stats {
  width: 4rem;
  height: 4rem;
}

.home-forum-stats::before {
  position: absolute;
  z-index: -1;
  inset: 0.4rem;
  border-radius: 50%;
  background: var(--cc98-color-primary);
  content: "";
  filter: blur(1rem);
  opacity: 0.38;
}

.home-forum-stats__trigger {
  position: relative;
  z-index: 1;
  display: grid;
  overflow: hidden;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 1px solid rgb(255 255 255 / 0.8);
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 18%, rgb(255 255 255 / 0.75), transparent 27%),
    linear-gradient(145deg, #79d5ff 0%, var(--cc98-color-primary) 52%, #287bbd 100%);
  box-shadow:
    0 0.75rem 2rem rgb(22 101 154 / 0.3),
    inset 0 0 0 1px rgb(255 255 255 / 0.24),
    inset 0 -0.5rem 1rem rgb(15 80 132 / 0.18);
  cursor: pointer;
  isolation: isolate;
  place-items: center;
  transition:
    transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 220ms ease;
}

.home-forum-stats__trigger::before {
  position: absolute;
  z-index: 1;
  inset: 0.2rem 0.65rem 2.15rem;
  border-radius: 50%;
  background: linear-gradient(to bottom, rgb(255 255 255 / 0.55), transparent);
  content: "";
  filter: blur(0.18rem);
  transform: rotate(-18deg);
}

.home-forum-stats__trigger img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-forum-stats__status {
  position: absolute;
  z-index: 2;
  right: 0.2rem;
  bottom: 0.35rem;
  width: 0.72rem;
  height: 0.72rem;
  border: 2px solid #fff;
  border-radius: 50%;
  background: #34c982;
  box-shadow: 0 0 0 0.2rem rgb(52 201 130 / 0.18);
}

.home-forum-stats__panel {
  position: absolute;
  top: 50%;
  right: calc(100% + 0.75rem);
  width: min(20rem, calc(100vw - 5.5rem));
  padding: 1rem;
  visibility: hidden;
  border: 1px solid rgb(255 255 255 / 0.72);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--cc98-color-surface) 94%, transparent);
  box-shadow:
    0 1.5rem 4rem rgb(20 69 104 / 0.22),
    0 0.25rem 1rem rgb(20 69 104 / 0.1),
    inset 0 0 0 1px rgb(255 255 255 / 0.35);
  opacity: 0;
  pointer-events: none;
  transform: translate(1rem, -50%) scale(0.96);
  transform-origin: right center;
  backdrop-filter: blur(1rem) saturate(1.25);
  transition:
    opacity 160ms ease,
    transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
    visibility 0s linear 220ms;
}

.home-forum-stats__panel::after {
  position: absolute;
  top: 0;
  right: -0.75rem;
  width: 0.75rem;
  height: 100%;
  content: "";
}

.home-forum-stats:hover .home-forum-stats__trigger,
.home-forum-stats:focus-within .home-forum-stats__trigger {
  box-shadow:
    0 1rem 2.5rem rgb(22 101 154 / 0.38),
    inset 0 0 0 1px rgb(255 255 255 / 0.3),
    inset 0 -0.5rem 1rem rgb(15 80 132 / 0.2);
  transform: translateY(-0.12rem) scale(1.045);
}

.home-forum-stats:hover .home-forum-stats__panel,
.home-forum-stats:focus-within .home-forum-stats__panel {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
  transform: translate(0, -50%) scale(1);
  transition-delay: 0s;
}

.home-forum-stats__header,
.home-forum-stats__identity,
.home-forum-stats__mark,
.home-forum-stats__live {
  display: flex;
  align-items: center;
}

.home-forum-stats__header {
  justify-content: space-between;
  gap: 1rem;
}

.home-forum-stats__identity {
  min-width: 0;
  gap: 0.7rem;
}

.home-forum-stats__mark {
  overflow: hidden;
  width: 2.5rem;
  height: 2.5rem;
  flex: none;
  justify-content: center;
  border-radius: 0.8rem;
  background: linear-gradient(145deg, #79d5ff, var(--cc98-color-primary));
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.45);
}

.home-forum-stats__mark img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-forum-stats__header h2,
.home-forum-stats__header p {
  margin: 0;
}

.home-forum-stats__header h2 {
  color: var(--cc98-color-text);
  font-size: 1.05rem;
  font-weight: 650;
  line-height: 1.35;
}

.home-forum-stats__header p {
  margin-top: 0.1rem;
  color: var(--cc98-color-text-caption);
  font-size: 0.75rem;
}

.home-forum-stats__live {
  gap: 0.35rem;
  padding: 0.3rem 0.55rem;
  flex: none;
  border-radius: 999px;
  background: color-mix(in srgb, #34c982 12%, transparent);
  color: #20875a;
  font-size: 0.72rem;
  font-weight: 600;
}

.home-forum-stats__live i {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 50%;
  background: #34c982;
  box-shadow: 0 0 0 0.18rem rgb(52 201 130 / 0.15);
}

.home-forum-stats__list {
  margin: 0.85rem 0 0;
  padding: 0;
}

.home-forum-stats__list > div {
  display: grid;
  min-height: 2rem;
  padding: 0.35rem 0.2rem;
  align-items: center;
  border-bottom: 1px solid color-mix(in srgb, var(--cc98-color-border) 70%, transparent);
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
}

.home-forum-stats__list > div:last-child {
  border-bottom: 0;
}

.home-forum-stats__list dt,
.home-forum-stats__list dd {
  margin: 0;
}

.home-forum-stats__list dt {
  color: var(--cc98-color-text-muted);
  font-size: 0.86rem;
}

.home-forum-stats__list dd {
  color: var(--cc98-color-text);
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
  font-weight: 650;
}

.home-forum-stats__list a,
.home-forum-stats__list a:visited {
  color: var(--cc98-color-primary);
}

@media (prefers-reduced-motion: reduce) {
  .home-forum-stats__trigger,
  .home-forum-stats__panel {
    transition: none;
  }
}
</style>
