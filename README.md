# Mars★ 钢琴探险

面向儿童的静态钢琴乐理学习站。产品说明见 [PRODUCT.md](PRODUCT.md)。

## 本地预览

```bash
python3 -m http.server 4173
```

访问 http://localhost:4173 。麦克风试唱需要 HTTPS 或 localhost。

## 发布

线上地址：<https://piano.gotomars.me/>。页面由 `index.html`、`app.js`、`course-data.js`、`music-data.js`、`lesson-visuals.js`、`style.css` 和 `assets/` 组成，无构建步骤。腾讯北京服务器以独立的 `gotomars-piano.service` 提供静态文件，由 Caddy 反向代理。部署、验证与回退见 [deployment/README.md](deployment/README.md)。

发布前对 4 个 JavaScript 文件运行 `node --check`，确认资源完整；发布后检查公网 HTTPS、课程、曲子识谱、音频和钢琴采样。实体 iPad 触控、麦克风试唱和真实听感仍需家长验收。
