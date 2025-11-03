---
title: "Cluster Aggregated GAN (CAG): A Cluster-Based Model for Appliance-Level Load Pattern Generation"
date: 2024-10-15T10:00:00+09:00
draft: false
categories: ["tech"]
tags: ["GAN", "NILM", "Synthetic Data", "Energy Analytics"]
---

## Publication Details
- Authors: Zikun Guo, Adeyinka P. Adedigba, Rammohan Mallipeddi
- Affiliation: Department of Artificial Intelligence, School of Electronics Engineering, Kyungpook National University
- PDF: [Download the full paper](/papers/cluster-aggregated-gan.pdf)

## Motivation
非侵入式负荷监测（NILM）需要高质量的家电级功率数据，但真实标注数据收集成本高且存在隐私问题。传统的单一 GAN 很难同时刻画间歇型与连续型设备的差异化行为，容易出现模式坍塌和训练不稳定。CAG 的目标是利用行为感知的生成策略，为能耗分析和数据增强提供可解释且稳定的合成曲线。

## Framework Highlights
- **行为自适应路由**：利用稀疏度与变化率统计自动判别设备是间歇型还是连续型，将其送入匹配的生成分支。
- **间歇型分支**：将原始功率序列切片、标准化并根据统计量与形状特征聚类，每个使用动机（motif）由独立的轻量级 CNN-GAN 建模，确保事件级细节与多样性。
- **连续型分支**：长序列通过分块平均降维后输入双层 LSTM-GAN，再按块重建到原尺度，稳定地捕捉长程依赖。
- **统一判别器**：共享判别器同时评估两个分支的样本，使整体生成在统计真实性与模式覆盖之间保持平衡。

## Experimental Setup
- **数据集**：UVIC 智能插座数据，覆盖 11 类家庭与办公设备，包含 CoffeeMaker、Microwave、Desktop、Server、Refrigerator 等典型间歇/连续组合。
- **训练策略**：间歇分支对每个聚类使用轻量 CNN 生成器与判别器；连续分支使用两层 LSTM。所有模型采用 Adam 优化，并通过轮廓系数自动选择聚类数。

## Key Results
- 在整体指标上取得最低的平均误差（ME 8.03）、标准差误差（Std 13.46）、FID（$5.82\times 10^{16}$）与周期 MAE（23.1），同时在多样性指标上获得最高的覆盖率（0.303）与 JS（0.657）。
- CAG 对间歇类设备保持事件级细节，对连续类设备提高长序列稳定性，优于 WaveGAN、CNN-Base、LSTM-GAN 等传统生成器。
- 聚类与分支路由显著减少了单一模型的模式坍塌风险，提供了可解释的使用动机级生成结果。

## Takeaways
CAG 将聚类融入生成架构，实现了行为驱动的建模流程。对于需要大规模合成用电数据的 NILM 研究、隐私保护分析与能效评估，CAG 提供了兼顾逼真度与多样性的解决方案。
