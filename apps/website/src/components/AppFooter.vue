<template>
  <footer class="site-footer">
    <div class="site-footer__row">
      <strong>CC98运营管理团队</strong>
      <a href="https://www.cc98.org" target="_blank" rel="noopener noreferrer">CC98论坛</a>
      <span>|</span>
      <a href="https://space.bilibili.com/222288454" target="_blank" rel="noopener noreferrer"
        >bilibili官号</a
      >
      <span>|</span>
      <a href="https://www.nexushd.org" target="_blank" rel="noopener noreferrer"
        >NexusHD高清社区</a
      >
      <span>|</span>
      <a href="https://space.bilibili.com/695376760" target="_blank" rel="noopener noreferrer"
        >CC98舞团</a
      >
      <span>|</span>
      <a href="https://gaming.cc98.org" target="_blank" rel="noopener noreferrer">CC98竞猜中心</a>
      <span>|</span>
      <a href="https://card.cc98.org" target="_blank" rel="noopener noreferrer">CC98抽卡游戏</a>
      <span>|</span>
      <a href="https://account.cc98.org" target="_blank" rel="noopener noreferrer">
        CC98账户管理 (账号密码找回)
      </a>
      <span>|</span>
      <a href="https://openid.cc98.org" target="_blank" rel="noopener noreferrer">CC98登录中心</a>
    </div>
    <div class="site-footer__row">
      <strong>友情链接</strong>
      <a href="https://www.zju.edu.cn" target="_blank" rel="noopener noreferrer">浙江大学</a>
      <span>|</span>
      <a href="https://xcb.zju.edu.cn" target="_blank" rel="noopener noreferrer">
        浙江大学党委宣传部
      </a>
      <span>|</span>
      <a href="https://www.cs.zju.edu.cn" target="_blank" rel="noopener noreferrer"
        >浙江大学计算机学院</a
      >
      <span>|</span>
      <a href="https://zjuers.com" target="_blank" rel="noopener noreferrer">ZJUers轻首页</a>
      <span>|</span>
      <a href="https://www.qsc.zju.edu.cn" target="_blank" rel="noopener noreferrer">求是潮</a>
      <span>|</span>
      <a href="https://www.zdgd.zju.edu.cn" target="_blank" rel="noopener noreferrer"
        >浙江大学广播电视网</a
      >
      <span>|</span>
      <a href="http://www.zju88.org/agent/index.do" target="_blank" rel="noopener noreferrer">
        飘渺水云间
      </a>
      <span>|</span>
      <a href="http://luckweb.057101.com/bt2/index.asp" target="_blank" rel="noopener noreferrer">
        缘网
      </a>
    </div>
    <div class="site-footer__row">
      <span>
        Copyright © 2003-{{ new Date().getFullYear() }} CC98 Durian v3.5.0 |
        <a href="mailto:contact@cc98.org">Email: contact@cc98.org</a>
      </span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 5rem;
  padding-top: 0.9375rem;
  color: var(--cc98-color-text-muted);
  font-family: "Microsoft YaHei", sans-serif;
  font-size: 0.75rem;
  line-height: 1.5;
  text-align: center;
}

.site-footer__row {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 0.9375rem;
}

.site-footer strong {
  margin-right: 0.9375rem;
  color: var(--cc98-color-text);
  font-weight: 400;
}

.site-footer a,
.site-footer a:visited {
  margin-inline: 0.375rem;
  color: var(--cc98-color-text-muted);
}
</style>
