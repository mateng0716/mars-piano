# piano.gotomars.me 上线记录

目标：复用腾讯北京 `82.157.156.144` 上现有 GoToMars Caddy 入口，新增独立静态目录与 `piano.gotomars.me` 路由。阿里云 DNS 的 `piano` A 记录指向该 IP，TTL 10 分钟。

## 当前发布

静态页面源提交：`f2bee874faca`。发布包 `releases/mars-piano-f2bee874faca.tar.gz`，SHA-256 `0105e459a2547e98170a73166deba158fe02431a1397b810cefb5ee8640024d9`。服务器发布目录 `/srv/agentcloud/apps/piano/releases/f2bee874faca`；`/srv/agentcloud/apps/piano/current` 是指向它的软链接。`gotomars-piano.service` 以 `www-data` 身份在 `127.0.0.1:19080` 提供静态文件，Caddy 反向代理该端口并管理证书。

实际 Caddyfile：`/srv/gotomars-migration/api-lab-production/Caddyfile`，经 `/srv/agentcloud/apps/qiancheng/Caddyfile.active` 指向。发布前备份：`/srv/gotomars-migration/api-lab-production/Caddyfile.before-piano-20261108T155705Z`。发布后 SHA-256 `9bf30ae2b084dec00d4ec26eecabe198377aacd4289c1ffa48d0d137602a3c16`，备份 SHA-256 `c27b6cd0b57c38215cc8da2e6d6417e495310af64652ab9e0ab8196df41333ab`。

## 更新与回退

1. 对新静态版本生成归档与 SHA-256，上传到服务器，在 `/srv/agentcloud/apps/piano/releases/<版本>` 解压并核对文件。不要重复执行首次发布脚本 `stage-beijing.sh`。
2. 创建 `current.next` 软链接并用 `mv -Tf` 原子替换 `current`；检查 `systemctl is-active gotomars-piano.service`、本机 19080、可信公网 HTTPS、首页与音频。Python 静态服务读取软链接目标，无需重启；如需重启，使用 `systemctl restart gotomars-piano.service`。
3. 回退页面时，把 `current` 原子指回上一发布目录。回退域名入口时，先备份当前 Caddyfile，再移除仅 `piano.gotomars.me` 的站点块，`caddy validate` 后 reload；若需完整撤销本次配置，可在确认备份之后没有其它合法变更时恢复上述 Caddyfile 备份。DNS 可在阿里云控制台删除 `piano` 记录。

本项目无数据库和服务端密钥。`stage-beijing.sh`、`activate-beijing.sh` 是首次发布脚本；`verify-beijing.sh` 检查服务和本机资源。上线回执及真实设备尚待验收的范围见工作区任务日志。
