# piano.gotomars.me 上线记录

目标：复用腾讯北京 `82.157.156.144` 上现有 GoToMars Caddy 入口，新增独立静态目录与 `piano.gotomars.me` 路由。阿里云 DNS 的 `piano` A 记录指向该 IP，TTL 10 分钟。

## 当前发布

静态页面源提交：`311e15cf0deb`。发布包 `releases/mars-piano-311e15cf0deb.tar.gz`，SHA-256 `6c9cce674bbeea5a6037b01c680033be5e2636524c9c5bb1d00f2d74ee914055`。服务器发布目录 `/srv/agentcloud/apps/piano/releases/311e15cf0deb`；`/srv/agentcloud/apps/piano/current` 是指向它的软链接。上一版本 `f2bee874faca` 保留在独立目录用于回退。`gotomars-piano.service` 以 `www-data` 身份在 `127.0.0.1:19080` 提供静态文件，Caddy 反向代理该端口并管理证书。

2026-11-09 上线回执：服务器 `sha256sum -c` 和更新脚本健康检查通过；公网 HTTPS 的首页、CSS、4 个 JavaScript 文件与 C4 钢琴采样和本地候选逐字节一致。线上 768×1024 浏览器检查：抽屉宽 720px、练习按钮 190×58px、19 节课卡与所选详情图同源；《欢乐颂》左手低音谱号与《致爱丽丝》右手 E5–D♯5 谱面显示正常，控制台 0 错误。实体 iPad 触控、麦克风试唱和主观听感仍见 GitHub Issue #2。

实际 Caddyfile：`/srv/gotomars-migration/api-lab-production/Caddyfile`，经 `/srv/agentcloud/apps/qiancheng/Caddyfile.active` 指向。发布前备份：`/srv/gotomars-migration/api-lab-production/Caddyfile.before-piano-20261108T155705Z`。发布后 SHA-256 `9bf30ae2b084dec00d4ec26eecabe198377aacd4289c1ffa48d0d137602a3c16`，备份 SHA-256 `c27b6cd0b57c38215cc8da2e6d6417e495310af64652ab9e0ab8196df41333ab`。

## 更新与回退

1. 对新静态版本生成归档与 SHA-256，把归档、`.sha256` 和 `update-beijing.sh` 上传到服务器。不要重复执行首次发布脚本 `stage-beijing.sh`。
2. 在服务器运行 `sudo bash /home/ubuntu/update-beijing.sh /home/ubuntu/mars-piano-<版本>.tar.gz`。脚本核对哈希、解压到独立版本目录并原子切换 `current`，本机健康检查失败时自动指回上一版本；不修改 Caddy 或其它站点。
3. 继续检查 `systemctl is-active gotomars-piano.service`、本机 19080、可信公网 HTTPS、首页、曲目数据与音频。Python 静态服务读取软链接目标，无需重启；如需重启，使用 `systemctl restart gotomars-piano.service`。
4. 回退页面时，把 `current` 原子指回上一发布目录。回退域名入口时，先备份当前 Caddyfile，再移除仅 `piano.gotomars.me` 的站点块，`caddy validate` 后 reload；若需完整撤销本次配置，可在确认备份之后没有其它合法变更时恢复上述 Caddyfile 备份。DNS 可在阿里云控制台删除 `piano` 记录。

本项目无数据库和服务端密钥。`stage-beijing.sh`、`activate-beijing.sh` 是首次发布脚本；`verify-beijing.sh` 检查服务和本机资源。上线回执及真实设备尚待验收的范围见工作区任务日志。
