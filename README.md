# Mars★ 钢琴探险

面向儿童的静态钢琴乐理学习站。产品说明见 [PRODUCT.md](PRODUCT.md)。

## 本地预览

```bash
python3 -m http.server 4173
```

访问 http://localhost:4173 。麦克风试唱需要 HTTPS 或 localhost。

## 发布

目标域名：`piano.gotomars.me`。页面由 `index.html`、`app.js`、`course-data.js`、`style.css` 和 `assets/` 组成，无构建步骤。生产部署应复用 GoToMars 腾讯北京服务器的现有 Caddy 入口，新增独立站点目录和域名路由；不要覆盖英语站目录或 Caddy 其它站点路由。

发布前运行 `node --check app.js && node --check course-data.js`，确认资源完整；发布后检查公网 HTTPS、课程、音频、钢琴采样与麦克风权限。实体 iPad 体验仍需家长验收。
