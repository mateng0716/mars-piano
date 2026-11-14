# piano.gotomars.me 上线记录

目标：复用腾讯北京 `82.157.156.144` 上现有 GoToMars Caddy 入口，新增独立静态目录与 `piano.gotomars.me` 路由。阿里云 DNS 的 `piano` A 记录指向该 IP，TTL 10 分钟。

## 当前发布

静态页面源提交：本地 `03d10a143f7c`（版本标记 `always-with-me-20261114-1`），GitHub 对应源码提交 `207ee003a83b9bfdebb66167aaebeb087ca5615e`，两者完整文件树相同，Actions `Validate static site` run `43590980129` success。服务器发布目录 `/srv/agentcloud/apps/piano/releases/03d10a143f7c`，`current` 指向它；上一版 `ee893a9f96b4` 保留用于回退。本次新增《千与千寻》主题曲《永远同在》C 大调入门短句（弱起 + 开头四小节）、80 BPM 试听、简易单音左手，以及离开/后台时休止推进的恢复处理。现有蓝色音乐房、课程和其他曲目保留。`gotomars-piano.service` 以 `www-data` 身份在 `127.0.0.1:19080` 提供文件，Caddy 代理并管理证书。独立 `serve.py` 对首页、版本文件和 manifest 返回 `Cache-Control: no-store`，忽略旧入口的条件缓存请求。

2026-11-12 iPad 与主屏幕更新回执：大包上传中断后改用 1.4MB 增量，增量 SHA-256 `acce4094b53e9f6f59a330c11123de9c8b297c998882f84b93ba8b980adea5fa`；服务器复用旧素材并核对全部 96 个发布文件哈希。服务器重建全量归档 SHA-256 `cd07c0369711b287d29f691e18a907ec718cc93dc72ff39e101b67802c1f6e19`，其压缩字节与本地原全包不同，但 96 文件内容相同；本地原全包 SHA-256 `b2f85229bb2f4051630d466029fa71fe748d65bd297bfea5bd239cdae364a60d`。更新脚本回报 Current `756e8c411d58`、Previous `releases/c9b940b6676c`。GitHub Actions run `43162119739` success。

公网首页、4 个 JS、样式、版本 JSON、manifest、3 个图标与 C4 采样均与本地逐字节一致；携带未来 `If-Modified-Since` 的首页仍为 200/no-store，版本 JSON 为 200/no-store。线上 WebKit 768×1024、1194×834、390×844：游戏开始后隐藏导航，音符在 iPad 竖/横屏约 46/66px 宽；错误发红并留题、正确礼花，角落没有对错符号；键高 28–64% 与谱面互补，底部贴边、无横向溢出。黑键/白键宽比约 0.58，跨组 A♯→C♯ 中心间距约 1.66 个白键宽。稳定页面 46 个琴声采样解码、AudioContext running；跨尺寸快速导航时旧页面的未完成采样请求被取消，不作为当前页面加载失败。实体 iPad 主屏幕图标替换、触控与听感仍待真机验收。

2026-11-11 弹音游戏更新回执：GitHub main `1008efa39b5795619fa077b96d22149f076727fc` 中 5 个改动文件与本地逐字节一致，Actions `Validate static site` run `43045482436` success。OrcaTerm 文件管理器显示归档与 `.sha256` 传输成功，服务器 `sha256sum -c` 回报 OK；更新脚本回报 Current `c9b940b6676c`、Previous `releases/fcecfe56c0d8`。公网 HTTPS 的首页、4 个 JavaScript、样式和 C4 琴声与本地发布源逐字节一致。线上 WebKit 768×1024 模拟：错音显示红色与 X、目标音不变；答对显示绿色、16 粒礼花和正确反馈，分数由 0 到 1；60 秒结束后本机记录写入 localStorage，刷新后仍在。页面横向溢出 0，AudioContext 为 running，控制台 0 错误/警告。实际 iPad 触控与主观听感仍待真机验收。

2026-11-10 C2–C7 音域、四小节谱面与课程列表更新回执：服务器文件管理器显示发布包及 `.sha256` 传输成功，`sha256sum -c` 回报 OK；更新脚本回报 Current `fcecfe56c0d8`、Previous `releases/ab903f47aa63`。公网 HTTPS 的首页、四个 JavaScript 文件、样式、C2 与 A♯6 采样均与本地发布包逐字节一致。线上 768×1024 浏览器显示 19 节课程完整列表且第 19 课点入正常；《吉量》左右手均一次展示四个编号小节，键盘为 36 个白键和 25 个黑键，页面横向溢出 0。自由键盘点中央 C 后谱面显示 C4，46 个钢琴采样解码，AudioContext 为 running，控制台 0 错误/警告。首页刷新按钮重新加载页面，并给 CSS、JavaScript、插画及采样 URL 加入新查询参数。GitHub 源码提交 `852d2204cc7ac18840763ed5f9b7ad352a365c2f` 与本地源码树一致，Actions run `42733375148` success。以上为浏览器尺寸模拟与浏览器音频状态检查；实体 iPad 触控、麦克风和主观听感仍待家长验收。

2026-11-10 边界与手动刷新更新回执：服务器上传新包与 `.sha256` 显示成功，`sha256sum -c` 回报 OK；更新脚本回报 Current `ab903f47aa63`、Previous `releases/4816ac40cf2c`。公网 HTTPS 首页、四个 JavaScript 文件、样式、C4 录音与本地该版本逐字节一致。GitHub 源码提交 `333561ec6eff0fa2f2d982032ca55e94c4c1ca56`，Actions run `42655302441` success。实体 iPad 刷新/听感仍待家长验证。

2026-11-09 本次 C 调与节拍练习更新回执：服务器文件管理器显示归档与 `.sha256` 均传输成功，`sha256sum -c` 回报 OK；更新脚本回报 Current `4816ac40cf2c`、Previous `releases/c4d3cf981e28`，本机健康检查通过。公网 HTTPS 首页、C4 音频均为 200；`index.html`、`app.js`、`music-data.js`、`style.css`、`course-data.js`、`lesson-visuals.js` 与本地发布包逐字节一致。线上 768×1024 浏览器验证五首曲目完整列表、点击直入、《致爱丽丝》3/8 小节按拍弹奏通过并进入下一小节、键盘端部留白透明、按键后无焦点残留和无横向溢出；控制台 0 错误。GitHub 源码提交 `fda7d73553173c2b2492e6cd8f2b3589999a5cfc` 的五个改动文件 blob 与本地一致，Actions `Validate static site` 运行 `42639585495` 成功。以上为浏览器尺寸模拟；实体 iPad、麦克风及主观听感继续见 Issue #2。

2026-11-09 上次更新回执（`c4d3cf981e28`）：服务器 `sha256sum -c` OK，更新脚本回报 `Current release: c4d3cf981e28`、`Previous release: releases/311e15cf0deb`，本机服务/资源健康检查通过。公网可信 HTTPS 返回 200；`index.html`、`app.js`、`music-data.js`、`style.css`、`course-data.js`、`lesson-visuals.js`、C4/E5 琴键采样与本地包逐字节一致。线上 768×1024 浏览器验证《大梦归》《吉量》曲目入口、《吉量》首音居中与正确按键推进、中央 C 试听/加载与正确按键推进、自由键盘 C4 谱面反馈；1194×834 下页面无溢出且白键无字母。GitHub 源码提交 `477c806a2f5589cc3ccf820771f6c5df3840cd94` 的主要文件与本地一致，Actions `Validate static site` 通过。

2026-11-09 上次更新回执（`311e15cf0deb`）：服务器 `sha256sum -c` 和更新脚本健康检查通过；公网 HTTPS 的首页、CSS、4 个 JavaScript 文件与 C4 钢琴采样和当时的本地候选逐字节一致。线上 768×1024 浏览器检查：抽屉宽 720px、练习按钮 190×58px、19 节课卡与所选详情图同源；《欢乐颂》左手低音谱号与《致爱丽丝》右手 E5–D♯5 谱面显示正常，控制台 0 错误。

实际 Caddyfile：`/srv/gotomars-migration/api-lab-production/Caddyfile`，经 `/srv/agentcloud/apps/qiancheng/Caddyfile.active` 指向。发布前备份：`/srv/gotomars-migration/api-lab-production/Caddyfile.before-piano-20261108T155705Z`。发布后 SHA-256 `9bf30ae2b084dec00d4ec26eecabe198377aacd4289c1ffa48d0d137602a3c16`，备份 SHA-256 `c27b6cd0b57c38215cc8da2e6d6417e495310af64652ab9e0ab8196df41333ab`。

## 更新与回退

1. 对新静态版本生成归档与 SHA-256，把归档、`.sha256` 和 `update-beijing.sh` 上传到服务器。不要重复执行首次发布脚本 `stage-beijing.sh`。
2. 在服务器运行 `sudo bash /home/ubuntu/update-beijing.sh /home/ubuntu/mars-piano-<版本>.tar.gz`。脚本核对哈希、解压到独立版本目录并原子切换 `current`，本机健康检查失败时自动指回上一版本；不修改 Caddy 或其它站点。
3. 继续检查 `systemctl is-active gotomars-piano.service`、本机 19080、可信公网 HTTPS、首页、曲目数据与音频。更新脚本会重启钢琴独立静态服务；如需手动重启，使用 `systemctl restart gotomars-piano.service`。
4. 回退页面时，把 `current` 原子指回上一发布目录。回退域名入口时，先备份当前 Caddyfile，再移除仅 `piano.gotomars.me` 的站点块，`caddy validate` 后 reload；若需完整撤销本次配置，可在确认备份之后没有其它合法变更时恢复上述 Caddyfile 备份。DNS 可在阿里云控制台删除 `piano` 记录。

本项目无数据库和服务端密钥。`stage-beijing.sh`、`activate-beijing.sh` 是首次发布脚本；`verify-beijing.sh` 检查服务和本机资源。上线回执及真实设备尚待验收的范围见工作区任务日志。

### 2026-11-12 20:00 CST 练习体验更新

生产版本 `50972098e8fe`，上一版 `756e8c411d58`。源码提交 `5097209`；本地 96 文件包 SHA-256 `581cfdc950a7fc9dc464abeb495e558f89f7e56cef4c8cc701c5b4cd38ca8b05`。复用生产采样/插画，上传 35 KB 增量后校验全部 96 文件、重建归档并执行原子更新脚本；服务器重建包 SHA-256 `d405ddd5732ead48582170240e06a87d1527557b7334921b5238ec454e613db6`，内容与本地包逐文件相同。

公网首页、JS、CSS、版本与 C4 样本逐字节一致。线上 WebKit 768×1024 验证：单手一行、双手双谱号、Logo 回首页、移除导航与手型、间隔 1.5 秒后仍可正确推进第二音，游戏得分与低强调计时更新；46 采样解码，AudioContext running，无横向溢出或 pageerror。本地另验证 1194×834、390×844、五首×三种手选项、四小节试听和拖拽尺寸。实体 iPad 听感与触控仍见 Issue #2。

### 2026-11-12 20:52 CST 双手谱与 C 键修复

生产版本 `7ea4bbc0b293`，上一版 `50972098e8fe`。本地96文件全包SHA256 `7bf50a9803f92e66bd1e8753d93e16fe94d7c2cb5fbcf5eaae6f9c23b00d70ae`；增量包35,764字节，SHA256 `e699573a95dc98d97e59c1f27d2e5bcaecb8b46e9c6b198e6cb85f0a534558d4`。腾讯终端确认脚本和增量哈希一致，96文件验证通过；服务器重建归档SHA256 `53ca7f71ac44ba2f30a367f924d1dc2f8837f43a8e907170e365bb9a687ee94e`，更新脚本确认Current7ea4bbc0b293、Previous50972098e8fe。公网四个改动文件逐字节一致。

C2–C7的六个C白键有极浅青灰底色；手别分段按钮增加谱号，删除默认绿色说明。双手保留两行谱面最低空间，SVG等比缩放；五首曲子的全四小节均检查无图形裁切，WebKit三个视口与键高28/45/64各端均完整、无横向溢出。

### 2026-11-12 22:05 CST 无数值滑杆与轻触防误滚

生产 `a0c6416a5229`，上一版 `7ea4bbc0b293`。增量35,917字节，SHA256 `901ee3e450757cc2a630aa545666e55c65c26d26201bdb6b3f1d8aeeb41c13ab`；发布脚本SHA256 `d3c8e4e758ab0ae0c743fb3c395d79b88bb66ffcbc80544558ef5f76f0cfb46b`。上传文件实存与哈希匹配，96文件manifest全部通过；服务器重建全包SHA256 `9dfca343c9ad2ee988cdab4360a5ab50801ae1579b8fb4a366f524bce8f46f2b`，原子切换成功。

公网12个文件与本地逐字节一致；首页、index、version、manifest四项未来If-Modified-Since请求均200/no-store。公网WebKit 768×1024、1194×834、390×844及键高28/64：无数值宽度slider范围/刷新保留、双手两谱完整且等比、无溢出/pageerror；Chromium原生触摸起点scrollLeft600，18px抖动保持600、越过24px门槛时不跳、100px横拖至675、明显纵移保持600，C4显示正常。实体iPad触控听感仍需真机确认。

浏览器扩展getState超时，原生Chrome可用；独立正常窗口完成发布，使用ASCII typeText避免剪贴板争用和中文路径丢失。源码同步尝试被另一个DexData任务切换焦点阻断，未上传/提交；不因此重复部署已成功版本。仅本任务新建OrcaTerm标签已关闭，保留其他任务页面。


### 2026-11-13 蓝色音乐房整体上线

生产 `ee893a9f96b4` / `studio-blue-20261113-3`，上一版 `a0c6416a5229`。本地116文件全包36,317,301字节、SHA-256 `a40996ed2e07c8db393ddf57a6e3b7d712535b99a4f5a37e74b644c8e4ac571f`；实际上传26文件增量8,289,850字节、SHA-256 `c9950952f2d128728310962a5444cbb4e6adcdef832fc4774d80044f0e2a0703`。服务器先核增量与发布脚本hash、核旧current、合并后核全部116文件，再重建归档并执行原子更新。服务器重建归档SHA-256 `d5845e22708eaec8d38e57f3e8e0581577f4a7b60a00b19f4573efc7eb75b0b2`；压缩字节不同，116文件内容一致。更新回执Current/Previous及service active已核。

公网116个发布文件（标准核验113项及新增首页CSS/两个输入与活动脚本）与本地逐字节一致，四种入口的未来If-Modified-Since请求仍为200/no-store；WebKit10种视口、一屏完整文字、长进度、滚轮不滚及11个入口点击通过，页面/资源错误0。实际公网WebKit的启蒙/回声24项、节奏10项、原课程与游戏17项交互检查通过，46个钢琴采样解码且AudioContext运行；源码与CI回执见[仓库Actions](https://github.com/mateng0716/mars-piano/actions)，最终提交另记于本地任务日志。实体iPad、真琴MIDI/麦克风及家长听感未据模拟检查冒称通过。


### 2026-11-14《永远同在》C 调入门版

生产 `03d10a143f7c` / `always-with-me-20261114-1`，上一版 `ee893a9f96b4`。本地 116 文件全包 SHA-256 `3ab6985992c59e9f5cda3e5ea04aa8dd388e94f4b09704ef22b6ca87a12d7025`；上传四文件增量 31,379 字节、SHA-256 `73a6d3a8558018600f34bea4df5b795d747d2f693ea83fbc12318e3f479c833f`，发布脚本 SHA-256 `52c7b1379cb5384083003d5e164cc2f510b03396aa7eb61a839892a16ee05b85`。服务器两件文件 hash 与本地一致，合并后 116 文件 manifest 全部通过，再重建归档并原子切换。服务器重建包 SHA-256 `893810805451f67cd3f469927a8ba440c287bdb565dedf2188f4bee0a09a868a`；压缩字节不同，文件内容与本地相同。回执 Current/Previous/service active 已核。

公网 116 个发布文件与本地逐字节一致，首页、index、version、manifest 四项条件缓存请求均为 200/no-store。实际公网 headless WebKit 的新曲跟弹 57 项通过：右手 16 音、左手四个长音、双手顺序练习、错音留题、慢弹和完成卡切手；三种手别试听的音高、80 BPM、一拍弱起、采样、停止/切手/回首页恢复检查通过。此为浏览器验证；实体 iPad 触控、真琴 MIDI/麦克风与亲子听感仍待真机体验。

公网试听共 19 项检查通过，三个视口（1194×834、768×1024、390×844）共 9 个手别场景与 14 项布局检查通过：谱面完整、等比、无页面横向溢出；46 个采样解码且 AudioContext running，页面错误 0。
