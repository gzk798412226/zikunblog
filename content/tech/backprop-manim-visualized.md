---
title: "用 Manim 把「反向传播」讲清楚：一支 8 章动画的诞生"
date: 2026-06-10T15:00:00+09:00
draft: false
categories: ["tech"]
tags: ["Manim", "反向传播", "深度学习", "可视化", "教学"]
katex: true
---

> 神经网络到底是怎么「学习」的？我用 [Manim](https://www.manim.community/) 做了一支 8 章的动画，把反向传播（Backpropagation）从单个神经元一路推到四个基本方程。这篇文章既是教学讲解，也是制作复盘——文中穿插的都是动画里的真实片段。

反向传播是几乎所有深度学习的训练核心，但它常常被讲成一坨吓人的求和符号。我的目标很简单：**让「误差如何反向流动」这件事，能被肉眼看见。**

整支片子用一套统一的视觉语言：蓝色是权重、黄色是激活值、红色是损失、橙色是梯度/误差。背景近黑（`#0d0f14`），让发光的数据流更突出。下面按章节走一遍。

<video src="/videos/backprop/full_narrated.mp4" controls preload="metadata" style="width:100%;border-radius:8px;margin:1rem 0;">
  你的浏览器不支持 video 标签。
</video>

<p style="text-align:center;color:#888;font-size:0.9em;margin-top:-0.5rem;">↑ 完整配音版（约 3 分钟），下面是分章节拆解。</p>

---

## 第 1 章 · 前向传播：单个神经元在做什么

一切从最小的单元讲起。每条连线有一个权重 `w`，每个输入有一个激活值 `a`，加上偏置 `b` 做一次加权求和得到 `z`，再用激活函数 σ 把它压进 0~1：

$$z = \sum_i w_i a_i + b, \qquad a = \sigma(z)$$

整层一起写，就是熟悉的矩阵形式 $a^{(l)} = \sigma(W^{(l)} a^{(l-1)} + b^{(l)})$。数据从输入层一路算到输出层——这就是**前向传播**。

<video src="/videos/backprop/01_forward.mp4" autoplay muted loop playsinline style="width:100%;border-radius:8px;margin:1rem 0;"></video>

## 第 2 章 · 损失：把「错了多少」变成一个数

网络给出输出 `a`，我们手里有正确答案 `y`。把两者差的平方加起来，就是单个样本的损失：

$$C = \tfrac{1}{2}\sum_j (a_j - y_j)^2$$

差得越多 `C` 越大，完全正确时 `C = 0`。训练真正要最小化的，是**所有样本上的平均损失**。目标也随之明确：调整网络里所有的 `w` 和 `b`，让这个数尽可能小。

<video src="/videos/backprop/02_loss.mp4" autoplay muted loop playsinline style="width:100%;border-radius:8px;margin:1rem 0;"></video>

## 第 3 章 · 梯度下降：往哪个方向走，C 会下降

损失 `C` 是网络里成千上万个参数的函数。先把它想象成一维——只调一个权重时，斜率（导数）告诉我们往哪走 `C` 会下降。于是沿着「下坡」方向一小步一小步地挪：

$$w \leftarrow w - \eta\,\frac{\partial C}{\partial w}$$

`η` 是学习率，决定步子迈多大。把每个参数的偏导排成一列，就是梯度 ∇C。**核心问题只剩一个：那 ∂C/∂w 到底怎么算？** 反向传播，就是高效算出这一整列偏导的方法。

<video src="/videos/backprop/03_gradient.mp4" autoplay muted loop playsinline style="width:100%;border-radius:8px;margin:1rem 0;"></video>

## 第 4 章 · 链式法则：一个扰动如何被层层放大

追踪一个权重 $w^L$：改一点点它，会改变 $z^L$，进而改变 $a^L$，最后改变 `C`。一个微小扰动沿着链条被层层传递，每一段的「放大率」就是一个偏导，乘起来就是链式法则：

$$\frac{\partial C}{\partial w^L} = \frac{\partial z^L}{\partial w^L}\cdot\frac{\partial a^L}{\partial z^L}\cdot\frac{\partial C}{\partial a^L}$$

一个权重的梯度，就这样被拆成了几段可计算的乘积。

<video src="/videos/backprop/04_chainrule.mp4" autoplay muted loop playsinline style="width:100%;border-radius:8px;margin:1rem 0;"></video>

## 第 5 章 · 一个最简例子：误差像多米诺骨牌倒推

用「每层只有一个神经元」的最简网络，引入关键量——误差 `δ`，它表示「第 l 层的带权输入 $z^l$ 变一点，C 会变多少」。

输出层的 δ 直接由链式法则给出，这是反向传播的**起点**。有了 δ，权重和偏置的梯度立刻就有了。而最妙的一步是把 δ 往前一层传：

$$\delta^l = (w^{l+1}\,\delta^{l+1})\,\odot\,\sigma'(z^l)$$

于是误差像多米诺骨牌，从输出层一路倒推回去——每一层的 δ 只需要后一层的 δ，算一遍就够。这就是「反向」二字的由来。

<video src="/videos/backprop/05_example.mp4" autoplay muted loop playsinline style="width:100%;border-radius:8px;margin:1rem 0;"></video>

## 第 6 章 · 四个基本方程

真实网络每层有很多神经元，只要加上下标 `j`（当前层第 j 个）、`k`（上一层第 k 个），把「乘」换成「对所有 k 求和」，就得到反向传播的四个基本方程：

$$
\begin{aligned}
\delta^L &= \nabla_a C \odot \sigma'(z^L) && \text{(BP1)}\\
\delta^l &= \big((w^{l+1})^\top \delta^{l+1}\big)\odot\sigma'(z^l) && \text{(BP2)}\\
\frac{\partial C}{\partial b^l_j} &= \delta^l_j && \text{(BP3)}\\
\frac{\partial C}{\partial w^l_{jk}} &= a^{l-1}_k\,\delta^l_j && \text{(BP4)}
\end{aligned}
$$

BP1 给出起点，BP2 负责一层层往回传，其余两个顺手就得到。

## 第 7 章 · 完整算法：为什么一定要「反向」

一次完整的训练步骤：

1. **前向传播**：算出每层的 $z^l$、$a^l$ 并保存；
2. **输出层误差**：$\delta^L = \nabla_a C \odot \sigma'(z^L)$（BP1）；
3. **反向传播**：`l` 从 `L-1` 到 `1`，逐层算 $\delta^l$（BP2）；
4. **取梯度**：$\partial C/\partial w^l$ 和 $\partial C/\partial b^l$（BP3、BP4）；
5. **梯度下降**：$w \leftarrow w - \eta\,\partial C/\partial w$，更新参数。

为什么非得「反向」？因为每一层的 $\delta^l$ 都依赖它后面一层的 $\delta^{l+1}$。从输出层出发倒着算，每个 δ 只算一次。如果对每个权重单独求梯度，慢得无法接受；而反向传播只需**一次前向 + 一次反向**，就同时拿到几百万个权重的全部梯度。动画里，误差的流动方向正好和前向传播相反——这正是它的威力。

<video src="/videos/backprop/07_algorithm.mp4" autoplay muted loop playsinline style="width:100%;border-radius:8px;margin:1rem 0;"></video>

## 第 8 章 · 一句话总结

$$\text{前向传播} \to \text{损失} \to \text{反向传播} \to \text{梯度下降} \to \circlearrowright$$

不断循环，网络逐渐变好。反向传播，**就是让网络「知道错在哪、该怎么改」的算法**。这一次，答案对了 ✓。

<video src="/videos/backprop/08_summary.mp4" autoplay muted loop playsinline style="width:100%;border-radius:8px;margin:1rem 0;"></video>

---

## 制作笔记

- **工具**：[Manim Community](https://www.manim.community/)，Python 描述动画，渲染出 1080p60 / 480p15 两套（后者体积小，正好用来做本文这种内联自动循环的片段）。
- **结构**：8 个章节各自独立成 `chN_*.py`，共用一个 `bp_common.py` 放统一的配色、中文字体封装 `cn()`、以及可复用的 `NeuralNet` 组件（自带 `forward_pulse` / `backward_pulse` 两种数据流动画）。
- **配色即语义**：蓝=权重、黄=激活、红=损失、橙=梯度。颜色一旦固定，观众就能仅凭颜色追踪「这是谁在流动」，不必反复看标注。
- **配音版**：另有一版加了旁白的 `vo_common.py` 流程，就是文章顶部那支完整视频。

如果你也想把抽象的数学讲「活」，Manim 是个很值得投入的工具——把公式拆成可以被看见的运动，往往比再写十行解释更有效。
