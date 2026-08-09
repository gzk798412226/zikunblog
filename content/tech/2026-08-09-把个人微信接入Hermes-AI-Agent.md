---
title: "把个人微信接入 Hermes AI Agent"
date: 2026-08-09T15:40:00+08:00
slug: "wechat-hermes-gateway"
draft: false
categories: ["tech"]
tags: ["Hermes", "微信", "AI", "gateway"]
---

Hermes 是 Nous Research 出的开源 AI agent 框架，跟 Claude Code / Codex 同类，跑在终端里、有完整的工具调用能力（终端、浏览器、文件、网络）。它自带一个多平台 gateway，可以把同一个 agent 接到微信、Telegram、Discord 等一大堆 IM 上。这篇文章记录的是怎么把**个人微信**接进去，让微信上随便发条消息就能指挥这个 agent 干活。

核心结论先说：走 `hermes gateway setup` 向导 → 终端出二维码 → 微信扫码确认 → 凭证写进 `~/.hermes/.env` → systemd 常驻。整个过程不用注册任何公众号或企业微信，用的是腾讯 iLink 的个人 bot 身份（形如 `xxx@im.bot`）。

## 前置依赖

微信适配器（`gateway/platforms/weixin.py`）需要 `aiohttp` 和 `cryptography`。用 Hermes venv 的 python 检查：

```bash
$ ~/.hermes/hermes-agent/venv/bin/python -c "import aiohttp, cryptography; print('OK')"
```

注意：Hermes 的 venv 通常**没有 pip**，二维码渲染库 `qrcode` 要装到系统 python 里（`pip3 install --user qrcode`）。不装也能跑，只是终端里显示不出 ASCII 二维码，你得自己想办法把扫码链接转成二维码。

## 扫码登录

直接跑向导：

```bash
hermes gateway setup
```

向导会依次：提示准备扫码 → 在终端打出二维码 + 一个 liteapp 扫码链接 → 轮询等待状态（wait → scaned → confirmed，过期会自动刷新最多 3 次）→ 登录成功后把凭证写进 `.env`。

如果二维码在终端渲染得没法扫（终端字体/行高问题很常见），从向导日志里把 liteapp 链接抠出来，用系统 python3 渲染成 PNG 再扫：

```bash
python3 -c "import qrcode; qr=qrcode.QRCode(); qr.add_data('https://liteapp.weixin.qq.com/q/<id>?qrcode=<hex>&bot_type=3'); qr.make(); qr.print_ascii(invert=True)"
```

登录成功返回的凭证大致是 `account_id`、`token`（形如 `<account_id>:<hex>`）、`base_url`。

## 凭证写进 .env（不要放 config.yaml）

这一步向导会帮你做，但手动配的话就是这几个环境变量，全放 `~/.hermes/.env`：

```bash
WEIXIN_ACCOUNT_ID=<account_id>
WEIXIN_TOKEN=<account_id>:<hex>
WEIXIN_BASE_URL=https://ilinkai.weixin.qq.com
WEIXIN_CDN_BASE_URL=https://novac2c.cdn.weixin.qq.com/c2c   # 仅当没设时
WEIXIN_DM_POLICY=pairing                                     # 推荐
WEIXIN_ALLOW_ALL_USERS=false
WEIXIN_ALLOWED_USERS=
```

关键点：gateway 只要检测到 `WEIXIN_TOKEN` / `WEIXIN_ACCOUNT_ID` 存在就**自动启用微信平台**，不需要改 `config.yaml` 里的任何东西。这也是 Hermes 的规矩——密钥全放 `.env`，`config.yaml` 只放设置。

## DM 授权（pairing）

配对模式下，陌生人给 bot 发私聊会被拒，但 bot 会反手给对方发一个配对码。你看 `hermes pairing list` 里的 pending 请求，用下面的命令批准（直接批准请求 id 也行，用 bot 发给对方的码也行）：

```bash
hermes pairing approve weixin <request-id>
```

批过一次之后，那个码再查会显示 "not found or expired"——这是正常的，说明它已经被消费掉了。

## systemd 常驻

```bash
hermes gateway install
```

会装一个 user 级 systemd 单元 `hermes-gateway.service` 并开启 linger，SSH 登出后也照样跑。验证：

```bash
hermes gateway status
journalctl --user -u hermes-gateway -n 50 --no-pager
```

踩坑：如果之前手动 `hermes gateway run` 还活着，`install`/`start` 会失败（提示 `Gateway already running`），systemd 会进入自动重启循环。修法：先 `hermes gateway stop` 再 `hermes gateway start`，然后确认 `ps aux | grep "[h]ermes gateway"`。

## 微信平台的硬限制

这部分不是配置 bug，是平台本身决定的，先知道免得白折腾：

- **不能流式输出**。微信不支持编辑已发消息，所以回复是"整体生成完再一次性发"。模型思考多久，你就等多久——这是"卡"的最大来源，无解。
- **看不到思考过程和模型名**。gateway 投递时会把 reasoning 剥掉，只发最终答案。
- **长回复会分块**。单条上限 2000 字，长回复拆成多条，每条之间默认间隔 1.5 秒。

## 调优

分块间隔是可调的，在 `.env` 里设 `WEIXIN_SEND_CHUNK_DELAY_SECONDS`，然后 `hermes gateway restart`。默认 1.5 秒，调到 0.3 秒长回复刷出来会紧凑很多，体感明显更跟手。

## 验证

配好后从微信发一句 `测试`，bot 应该直接回复。注意长轮询平台**只在有入站流量时才打日志**，所以"日志里没东西"不等于没连上，最可靠的验证就是真实发一条消息。

另外，首次从新会话发消息会提示 "No home channel is set"，回 `/sethome` 把当前会话设成 cron 任务/转发消息的投递目标即可，不是必须的。

## 小结

整个过程其实就三步：扫码拿凭证、写进 `.env`、装 systemd 服务。微信适配器会自动启用，配对策略保护私聊安全，调一个环境变量就能让回复更跟手。唯一绕不开的是"不能流式"这个平台限制——简单问答用它挺合适，重活（写代码、长文档、多步操作）还是回 CLI 更舒服，那边能看到推理过程和实时进度。
