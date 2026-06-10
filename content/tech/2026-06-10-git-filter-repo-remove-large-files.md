---
title: "从 Git 历史里彻底删掉大文件：一次把 .git 瘦身的完整复盘"
date: 2026-06-10T16:30:00+09:00
slug: "git-filter-repo-remove-large-files"
draft: false
categories: ["tech"]
tags: ["Git", "filter-repo", "GitHub", "Hugo", "版本控制"]
---

> 起因是一个朴素的担心：「我这个 Git 仓库会不会越来越大，哪天就 push 不上去了？」一查才发现，我把 **78MB 的 Hugo 二进制文件**提交进了仓库，而且它静静地躺在历史里。这篇文章完整记录排查、用 `git filter-repo` 改写历史、踩坑、到最后强制推送的全过程，以及每一步背后的原理。

## 一、先搞清楚 GitHub 到底有没有限制

担心「仓库被填满导致无法 push」之前，得先知道 GitHub 的真实红线：

| 限制对象 | 阈值 | 后果 |
|----------|------|------|
| **单个文件** | > 100 MB | push **直接被拒绝**（硬限制） |
| 单个文件 | 50–100 MB | 能 push，但每次警告 |
| **整个仓库** | 建议 < 1 GB | 超过会发邮件提醒 |
| 整个仓库 | ~5 GB 起 | 才开始真正受限 |

结论很清楚：**只要你不提交超过 100MB 的单文件，就不会「慢慢被填满到无法 push」**。真正的隐患不是总量，而是——大二进制文件一旦进了历史，**Git 会永远保留它的每一个版本**，仓库只增不减。

## 二、定位：谁在占空间

先看整体：

```bash
du -sh .              # 工作区总计：396M
du -sh .git           # 历史（push 上传的部分）：135M
```

`.git` 才是真正会被推到 GitHub 的部分。接着找出历史里最大的对象——这条命令是关键，它会扫描**所有分支、所有提交、包括已删除的文件**：

```bash
git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectsize) %(rest)' \
  | awk '/^blob/ {print $2, $3}' \
  | sort -rn | head
```

输出让我愣了一下：

```
78.1 MB  hugo                                   ← Hugo 程序本身被提交了
23.0 MB  hugo_extended_..._Linux-64bit.tar.gz   ← 已删除但仍在历史里
17.1 MB  static/videos/backprop/full_narrated.mp4
12.0 MB  static/images/6c1ac...jpg
```

两个跟 Hugo 有关的文件加起来 **101MB**，占了 135M 历史的一大半。其中那个 `.tar.gz` 我早就在工作区删了，但它**仍然霸占着历史空间**——这正是 Git 的特性：删文件不等于删历史。

## 三、一个常见误区：`.gitignore` 管不了已追踪的文件

我的 `.gitignore` 里其实早就写了 `hugo`，但 `git ls-files` 显示它依然被追踪。原因是：

> **`.gitignore` 只对「尚未被追踪」的文件生效。**一旦某个文件被 `git add` 提交过，gitignore 就拿它没办法了。

要让一个已追踪文件停止被提交，得显式地：

```bash
git rm --cached hugo      # 从索引移除，但保留工作区文件
```

但注意——**这只能让以后的提交不再包含它，历史里那 78MB 一点没少**。要真正瘦身，必须改写历史。

## 四、决策：`git rm --cached` 还是改写历史？

这里有个权衡，值得想清楚：

- **方案 A：`git rm --cached hugo`** —— 简单、不改历史、不需要强制推送。代价是 `.git` 里那 100MB 永远还在。
- **方案 B：用 `git filter-repo` 把文件从全部历史抹掉** —— 能把 135M 砍到 ~89M，但会**重写所有 commit 的哈希**，必须 `git push --force`，其它克隆会全部失效。

因为这是个人博客仓库、只有我一个人在用，没有协作者会被强制推送坑到，所以我选了**方案 B，连历史一起清干净**。

> ⚠️ 如果是多人协作的仓库，改写历史前一定要团队同步——所有人都得重新 clone，否则下次他们 push 会把删掉的东西又带回来。

## 五、执行：`git filter-repo` 全流程

### 1. 先备份（这步别省）

改写历史是不可逆的，动手前先打一个包含**所有引用**的全量备份：

```bash
git bundle create ../backup-$(date +%Y%m%d-%H%M%S).bundle --all
```

这个 `.bundle` 文件等于整个仓库的快照，万一改坏了可以 `git clone backup.bundle` 完整还原。

### 2. 保住本地能用的二进制

我希望删掉仓库里的 `hugo`，但本地还想继续 `./hugo` 跑站。所以先把二进制拷出去：

```bash
cp hugo /tmp/hugo-local-backup
```

（因为 `hugo` 已在 `.gitignore` 里，事后放回工作区它会保持「未追踪」，既能用、又不会再被提交。）

### 3. 装 `git-filter-repo`

官方早已不推荐 `git filter-branch`（慢且坑多），改用 `git filter-repo`。它本质是**一个单文件 Python 脚本**，所以即使 `pip` 因为 PEP 668「externally-managed-environment」装不了，也能直接下载：

```bash
curl -fsSL https://raw.githubusercontent.com/newren/git-filter-repo/main/git-filter-repo \
  -o /tmp/git-filter-repo && chmod +x /tmp/git-filter-repo
python3 /tmp/git-filter-repo --version
```

### 4. 抹掉文件

```bash
python3 /tmp/git-filter-repo \
  --invert-paths \
  --path hugo \
  --path hugo_extended_0.135.0_Linux-64bit.tar.gz \
  --force
```

- `--invert-paths` 表示「删掉匹配的路径」（不加就是「只保留匹配的」）。
- 几秒钟就重写完 84 个 commit。

有个细节会吓一跳——filter-repo 跑完会**自动移除 `origin` remote**：

```
NOTICE: Removing 'origin' remote; ...
```

这是它的安全设计，防止你手一滑把改写后的历史推错地方。手动加回来即可：

```bash
git remote add origin https://github.com/<user>/<repo>.git
```

### 5. 放回本地二进制 + 验证

```bash
cp /tmp/hugo-local-backup hugo && chmod +x hugo
./hugo version                                   # 本地照常可用 ✅

# 确认历史里再也找不到 hugo
git log --all --oneline -- hugo                  # 输出为空 ✅
```

## 六、踩坑：删完为什么 `.git` 反而变大了？

本以为大功告成，结果 `du -sh .git` 一看——**204M**，比改写前的 135M 还大！

冷静排查，`git count-objects -vH` 给出线索：

```
packs: 2
size-pack: 203.12 MiB
```

**有两个 pack 文件。** filter-repo 写了一个干净的新 pack（89M），但旧的那个 115M pack（装着 `hugo` 等已经不可达的对象）没被清掉，两个加一起反而更大。同时 `git rev-list --all` 里已经扫不到任何 >20MB 的可达对象——说明那 115M 全是**不可达的垃圾，只是还没被回收**。

解决办法是强制全量重打包，把不可达对象彻底丢弃：

```bash
git reflog expire --expire=now --all   # 清掉 reflog 对旧提交的引用
git repack -adf                        # -a 全部重打包 -d 删旧 pack -f 重算 delta
git prune --expire=now                 # 立即清理不可达对象
```

再看：

```
packs: 1
size-pack: 88.24 MiB        →  .git 回到 89M ✅
```

> 经验：`git filter-repo` 之后，最好显式做一次 `reflog expire` + `repack -adf` + `prune`，别假设它已经帮你回收干净。reflog 和旧 pack 都会「替你保留」那些你以为删掉的东西。

## 七、推送：强制覆盖远端历史

本地全部搞定，最后把改写后的历史推上去——因为哈希全变了，**必须 `--force`**：

```bash
git push --force origin main
```

输出里这一行说明远端历史被成功替换：

```
+ 85c4bd7...a76746b main -> main (forced update)
```

推送的 pack 只有 **69.67 MiB**（比本地 89M 小，因为传输时用了更激进的 delta 压缩）。GitHub 上那 100MB 的 Hugo 相关文件，至此也彻底没了。

## 八、收尾与复盘

确认远端正常后，清理本地临时文件：

```bash
rm ../backup-*.bundle           # 备份确认没问题后再删
rm /tmp/hugo-local-backup /tmp/git-filter-repo
```

### 最终成果

| 项 | 改写前 | 改写后 |
|----|--------|--------|
| `.git` 大小 | 135 M | **89 M** |
| 历史里的 Hugo 二进制 | 78 M | 0 |
| 残留的 tar.gz | 23 M | 0 |
| 本地 `./hugo` | 可用 | **仍可用**（未追踪） |

### 几条能复用的经验

1. **二进制 / 大资源别进 Git。** 程序、压缩包、模型权重这类东西，要么放 Release、要么用 Git LFS、要么干脆让使用者自己装。一旦进了历史，清理成本远高于一开始就不提交。
2. **`.gitignore` 不会「追溯」。** 想忽略一个已追踪文件，得先 `git rm --cached`。
3. **删文件 ≠ 删历史。** 工作区删掉只是新增一个「删除」提交，旧版本仍在。要真正回收空间只能改写历史。
4. **改写历史前先 `git bundle --all` 备份。** 一行命令，买一份安心。
5. **filter-repo 之后手动 `repack -adf` + `prune`。** 否则旧 pack 和 reflog 会让你白忙一场。
6. **担心仓库膨胀，盯的是「有没有大文件进历史」，而不是「总大小」。** GitHub 的总量限制其实很宽松，致命的是单个 >100MB 的文件被拒。

从此 `git clone` 下来不再自带 Hugo，需要时自己装一个——多一步，但换来一个干净、不会失控膨胀的仓库，值。
