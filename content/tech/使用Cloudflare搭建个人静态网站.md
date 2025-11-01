---
title: "使用Cloudflare搭建个人静态网站"
date: 2023-04-23T20:37:02+09:00
draft: false
categories: ["tech"]
tags: ["技术", "Cloudflare", "静态网站", "部署"]
---
# github pages VS vps VS cloudflare
众所周知，cloudflare pages和github pages是竞争产品，在朋友的介绍下见识到了cloudflare服务器的性能确实优于github。
github pages最大的问题就是对站点的更改在推送到 GitHub 后，最长可能需要 10 分钟才会发布。：

首先访问cloudflare官网 ： https://pages.cloudflare.com

注册以后进入点击pages：

![Cloudflare Pages 控制台](/images/tech/cloudflare.png)


创建网站的方式有两种，一种是github链接网站文件，另一种是直接从本地上传渲染好的静态文件，由于链接github需要设置环境变量，我懒得弄，直接从本地上传渲染好的静态文件了就。

```
hugo -D
```
选择本地的public,直接上传到new deployment
![](/images/tech/image.png)

ok，大功告成！你有了一个不用租用vps或者需要等待10分钟才能发布的个人网站

