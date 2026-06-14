---
title: "Code"
description: "在浏览器里直接写 Python，给新手练手"
code: |
  # 欢迎写 Python！这里的代码直接在你的浏览器里运行，不需要后端。
  # 改下面的代码，然后点「运行」（或按 Ctrl/⌘ + Enter）。

  name = "新手"
  print("你好，" + name + "！")

  # 求 100 以内的素数试试看
  primes = [n for n in range(2, 100) if all(n % d for d in range(2, n))]
  print("100 以内的素数：", primes)
---
