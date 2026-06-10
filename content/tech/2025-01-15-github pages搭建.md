---
title: "github pages搭建"
date: 2025-01-15T09:21:42Z
draft: false
categories: ["tech"]
tags: ["技术", "GitHub", "静态网站", "博客"]
---

## 前言

GitHub Pages是GitHub提供的静态网站托管服务，可以免费托管个人博客、项目文档等静态网站。本文记录如何从零开始搭建一个基于Hugo + GitHub Pages的个人博客。

## 准备工作

### 必需工具
- Git
- Hugo（静态网站生成器）
- GitHub账号
- 代码编辑器（如VS Code）

### 环境安装

#### 安装Hugo
```bash
# macOS
brew install hugo

# Ubuntu/Debian
sudo apt install hugo

# Windows
# 下载二进制文件或使用Chocolatey
choco install hugo
```

#### 验证安装
```bash
hugo version
```

## 创建GitHub仓库

### 1. 创建源码仓库
在GitHub上创建一个新仓库用于存放博客源码：
- 仓库名：`blog`（或其他名称）
- 设为Public
- 添加README.md

### 2. 创建GitHub Pages仓库
创建另一个仓库用于托管生成的静态网站：
- 仓库名：`username.github.io`（username替换为你的GitHub用户名）
- 设为Public

## 本地博客搭建

### 1. 初始化Hugo站点
```bash
# 创建新的Hugo站点
hugo new site blog
cd blog

# 初始化Git仓库
git init
git remote add origin https://github.com/username/blog.git
```

### 2. 选择并安装主题
这里以MemE主题为例：

```bash
# 添加主题作为子模块
git submodule add https://github.com/reuixiy/hugo-theme-meme.git themes/meme

# 复制示例配置
cp themes/meme/config-examples/zh-cn/config.toml config.toml
```

### 3. 配置站点
编辑 `config.toml` 文件：

```toml
baseURL = "https://username.github.io/"
title = "你的博客标题"
theme = "meme"
languageCode = "zh-CN"

# 其他配置...
```

### 4. 创建第一篇文章
```bash
hugo new posts/hello-world.md
```

编辑文章内容：
```markdown
---
title: "Hello World"
date: 2025-01-15T09:21:42Z
draft: false
---

这是我的第一篇博客文章！
```

### 5. 本地预览
```bash
hugo server -D
```
访问 `http://localhost:1313` 预览效果。

## 部署到GitHub Pages

### 方法一：GitHub Actions自动部署（推荐）

#### 1. 创建GitHub Actions工作流
在博客源码仓库中创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy Hugo to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
          fetch-depth: 0

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: 'latest'
          extended: true

      - name: Build
        run: hugo --minify

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        if: github.ref == 'refs/heads/main'
        with:
          personal_token: ${{ secrets.PERSONAL_TOKEN }}
          external_repository: username/username.github.io
          publish_branch: main
          publish_dir: ./public
```

#### 2. 配置Personal Access Token
1. 在GitHub Settings > Developer settings > Personal access tokens生成token
2. 在源码仓库的Settings > Secrets中添加`PERSONAL_TOKEN`

#### 3. 推送代码
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 方法二：手动部署

#### 1. 生成静态文件
```bash
hugo --minify
```

#### 2. 推送到GitHub Pages仓库
```bash
cd public
git init
git remote add origin https://github.com/username/username.github.io.git
git add .
git commit -m "Deploy blog"
git push -u origin main
```

## 配置自定义域名（可选）

### 1. 添加CNAME文件
在GitHub Pages仓库根目录创建`CNAME`文件：
```
yourdomain.com
```

### 2. 配置DNS
在域名服务商处添加CNAME记录：
```
CNAME    www    username.github.io
```

### 3. 启用HTTPS
在GitHub Pages仓库Settings > Pages中勾选"Enforce HTTPS"。

## 常用操作

### 创建新文章
```bash
hugo new posts/article-name.md
```

### 本地预览
```bash
hugo server -D
```

### 生成静态文件
```bash
hugo
```

### 更新主题
```bash
git submodule update --remote --merge
```

## 文件结构说明
```
blog/
├── archetypes/          # 文章模板
├── content/            # 文章内容
│   ├── posts/          # 博客文章
│   └── about.md        # 关于页面
├── data/               # 数据文件
├── layouts/            # 布局模板
├── static/             # 静态资源
├── themes/             # 主题
├── config.toml         # 配置文件
└── public/             # 生成的静态文件
```

## 常见问题

### 1. 子模块问题
如果主题没有正确加载：
```bash
git submodule init
git submodule update
```

### 2. 部署失败
检查：
- Personal token权限
- 仓库名是否正确
- 配置文件语法

### 3. 样式丢失
确认：
- baseURL配置正确
- 主题文件完整
- 静态资源路径

## 优化建议

### 1. SEO优化
- 设置合适的title和description
- 添加sitemap
- 配置robots.txt

### 2. 性能优化
- 启用minify
- 压缩图片
- 使用CDN

### 3. 内容管理
- 建立文章分类体系
- 添加标签
- 设置文章模板

## 总结

通过GitHub Pages + Hugo的组合，我们可以快速搭建一个功能完整、性能优秀的静态博客。主要优势：

- **免费**：GitHub Pages免费托管
- **快速**：静态网站加载速度快
- **安全**：没有数据库，安全性高
- **灵活**：支持自定义域名和主题
- **版本控制**：基于Git的版本管理

只要掌握基本的Git操作和Markdown语法，就能轻松维护自己的博客。

---

*参考资料：*
- [Hugo官方文档](https://gohugo.io/documentation/)
- [GitHub Pages文档](https://docs.github.com/en/pages)
- [MemE主题文档](https://github.com/reuixiy/hugo-theme-meme)

