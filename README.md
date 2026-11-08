# Mars★ 钢琴探险

面向儿童的静态钢琴乐理学习站。产品说明见 [PRODUCT.md](PRODUCT.md)。

## 本地预览

```bash
python3 -m http.server 4173
```

访问 http://localhost:4173 。麦克风试唱需要 HTTPS 或 localhost。

## 发布

线上地址：<https://piano.gotomars.me/>。页面由 `index.html`、`app.js`、`course-data.js`、`style.css` 和 `assets/` 组成，无构建步骤。腾讯北京服务器以独立的 `gotomars-piano.service` 提供静态文件，现有 Caddy 仅新增 `piano.gotomars.me` 反向代理，不影响英语站和其它路由。部署、验证与回退见 [deployment/README.md](deployment/README.md)。

发布前运行 `node --check app.js && node --check course-data.js`，确认资源完整；发布后检查公网 HTTPS、课程、音频、钢琴采样与麦克风权限。实体 iPad 体验仍需家长验收。
