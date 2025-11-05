---
title: "GitHub + Cloudflare Pages = 无延迟的静态网页部署工具链"
date: 2025-11-05T00:05:03+09:00
draft: false
categories: ["tech"]
tags: ["技术"]
---

今天偶然发现Cloudflare 支持github导入
> 目标：把原本托管在 GitHub Pages 的 Hugo 博客迁移到 Cloudflare Pages，启用自动化部署。
> 读者对象：已经会基本 Git 操作、了解静态站点生成器（以 Hugo 为例）的开发者。

---

## 背景与目标

* 原站点：`zikunblog.pages.dev`（GitHub Pages）
* 新目标：使用 **Cloudflare Pages** 自动构建与部署（获得更快的全球 CDN 与灵活配置）
* 框架：**Hugo**（仓库包含主题子模块 `themes/meme`）

---

## 最终成品

* Cloudflare Pages 项目：`<repo-name>.pages.dev`（系统按仓库名生成，如 `gzk798412226-github-io.pages.dev`）
* 部署方式：**Git 集成**（连接 GitHub 仓库，一旦 push 自动构建）
* 构建配置（Hugo）：

  * Build command：`hugo`
  * Build output directory：`public`
  * Env：

    * `HUGO_VERSION=0.125.6`（或与本地一致的版本）
    * （有子模块时）`GIT_SUBMODULE_STRATEGY=recursive`

---

## 迁移流程（按时间线）

### 1）准备新仓库并迁移本地 Git 远程

新建 GitHub 仓库（示例：`zikunblog`），将本地旧仓库的远程指向新仓库：

```bash
git remote -v
git remote remove origin
git remote add origin https://github.com/gzk798412226/zikunblog.git
# 分支为 main 或 master 其一，以下以 main 为例
git push -u origin main
```

#### 遇到的问题 A：无法使用账号密码推送

* 现象：`Password authentication is not supported for Git operations`
* 结论：**必须使用 Personal Access Token（PAT）** 或 SSH

#### 解决

* 生成 **Fine-grained token**（推荐）：

  * Resource owner：选择自己的账号
  * Repository access：**Only select repositories** → 勾选 `zikunblog`
  * Repository permissions：

    * **Contents → Read and write**
    * Metadata → Read-only（默认）
* 推送时：

  * Username：`你的 GitHub 用户名`
  * Password：**粘贴 token**

> 如果输错过，先清除本地缓存的错误凭据再重试：
>
> ```bash
> # macOS/Linux
> echo "protocol=https
> host=github.com" | git credential reject
>
> # Windows
> git credential-manager erase https://github.com
> ```

#### 遇到的问题 B：403，但仓库是自己的

* 现象：`Permission to <repo> denied to <user>`
* 原因：**token 权限不完整**或**没勾选该仓库**
* 解决：重建 token，务必包含 **Contents: Read and write**，并指派到 `zikunblog`

#### 遇到的问题 C：refspec 错误

* 现象：`src refspec master does not match any`
* 原因：本地分支是 `main`，却推 `master`
* 解决：`git push -u origin main`

#### 遇到的问题 D：workflow 文件被拒

* 现象：`refusing to allow a Personal Access Token to create or update workflow ... without workflow scope`
* 方案 1（简单）：删除 `.github/workflows` 后推送
* 方案 2（需要 GitHub Actions）：给 token 增加 **Actions/Workflows → Read and write** 权限

#### 遇到的问题 E：大文件警告

* 现象：`File hugo is 78.09 MB; ...`
* 做法：不把二进制 `hugo` 放仓库中，加入 `.gitignore`

  ```bash
  rm hugo
  echo "hugo" >> .gitignore
  git add .gitignore
  git commit -m "ignore hugo binary"
  git push
  ```

---

### 2）Cloudflare Pages 创建与正确选择

Cloudflare 仪表盘 → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
选择仓库 `zikunblog`，**不要选 Worker/Workflows**（那是运行脚本的，静态站点会走偏）。

**第一次走错的界面：**

* 进入了 *Workers（需要 Deploy command）*，导致要求填写 `npx wrangler deploy` 并报：

  * `Missing entry-point to Worker script or to assets directory`
* 正确做法：回到 **Pages**，用 Git 连接 **静态站点构建**。

---

### 3）Cloudflare Pages 的构建设置

* Framework preset：`None`
* **Build command**：`hugo`
* **Build output directory**：`public`（注意不要写成 `/public`）
* Environment variables（推荐）：

  * `HUGO_VERSION=0.125.6`
  * `GIT_SUBMODULE_STRATEGY=recursive`（仓库用到主题子模块时）
  * （可选）`TZ=Asia/Shanghai`

> 如果是纯 HTML 项目（仓库根目录有 `index.html`）：
>
> * Build command：留空
> * Output directory：`.`（或 `public` 视你的目录结构）

---

## 本地开发与主题问题

本地开发命令：

```bash
hugo server -D
```

### 遇到的警告：`found no layout file`

* 现象：大量 `WARN found no layout file for "html" ...`
* 常见原因：

  1. `config.toml` 的 `theme` 未设置或名称不对

     ```toml
     theme = "meme"
     ```
  2. 主题是子模块但未初始化

     ```bash
     git submodule update --init --recursive
     ```
* 只要主题正确加载，警告消失。

> 退出 `hugo server` 用 **Ctrl+C**，`^Z` 只是挂起。

---

## 验证部署

* 每次 `git push` 到指定分支（如 `main`），Cloudflare Pages 会自动构建
* 在项目 **Deployments** 面板查看日志：

  * 看见 `hugo` 构建与发布 `public/` 即成功
* 默认域名：`<repo-name>.pages.dev`
* 若需独立域名：**Custom domains** 绑定自己的域名

---

## 常见错误速查

| 错误                                                          | 根因                        | 处理                                                         |
| ----------------------------------------------------------- | ------------------------- | ---------------------------------------------------------- |
| `Password authentication is not supported`                  | GitHub 禁止账号密码推送           | 用 PAT（fine-grained token）或 SSH                             |
| `denied to <user>`                                          | token 权限不足或未指派仓库          | 重建 token：**Contents → Read and write**，并指派到 `zikunblog`              |
| `refusing to allow ... workflow ... without workflow scope` | 尝试推 workflow，token 没工作流权限 | 删除 `.github/workflows` 或给 token 加 **Actions/Workflows** 权限 |
| `Missing entry-point to Worker script`                      | 走到了 Workers 路径            | 用 **Pages** + Git 模式，配置 `hugo/public`                      |
| `Output directory "public" not found`                       | 没有执行构建或路径写错               | 设置 **Build command: hugo**，**Output: public**              |
| 本地 `found no layout`                                        | 主题未加载/子模块未拉取              | `theme=xxx`、`git submodule update --init --recursive`      |
| Push 提示 master 不存在                                          | 本地是 `main`                | `git push -u origin main`                                  |
| 大文件警告（>50MB）                                                | 提交二进制或构建产物                | `.gitignore` 排除，或使用 Git LFS                                |

---

## 命令清单（可直接复用）

```bash
# —— 本地 Git 指向新仓库 ——
git remote remove origin
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main   # 或 master

# —— 清除错误凭据（若输错过） ——
echo "protocol=https
host=github.com" | git credential reject

# —— 子模块初始化（Hugo 主题） ——
git submodule update --init --recursive

# —— 本地开发预览 ——
hugo server -D

# —— 生成静态页（可本地确认） ——
hugo   # 输出在 public/

# —— 避免把 hugo 二进制等大文件推上去 ——
echo "hugo" >> .gitignore
git add .gitignore
git commit -m "ignore hugo binary"
git push
```

---

## 经验与建议

1. **Pages vs Workers**：托管静态站点选择 **Pages**，不要误进 Workers。
2. **Token 最小权限**：fine-grained token 只勾需要的仓库与权限（`Contents: Read and write`）；如需推 workflow，再给 **Actions/Workflows**。
3. **子模块要拉**：主题做成子模块时，构建端也要能拉到（`GIT_SUBMODULE_STRATEGY=recursive`）。
4. **构建目录别加斜杠**：`public` 而不是 `/public`。
5. **不要提交大二进制**：`hugo` 等可执行文件放本地或使用包管理器安装；仓库只放源码与内容。

---

## 结语

这次迁移体现了一个原则：**把平台当作流水线来理解**。
GitHub 负责版本与触发点，Cloudflare Pages 负责构建与发布。
只要分清职责、搞定凭据与权限，迁移过程本身是稳定且可复现的。

如果你也正从 GitHub Pages 迁移到 Cloudflare Pages，上面这套流程可以原样落地；
踩坑列表基本覆盖了 90% 常见问题，按图索骥即可。祝部署顺利。
