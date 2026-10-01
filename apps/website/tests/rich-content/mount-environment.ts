// 自定义宿主无需 DOM；使用客户端编译才能挂载 SFC 并验证响应式更新。
export default {
  name: "vue-host",
  viteEnvironment: "client",
  setup() {
    return { teardown() {} };
  },
};
