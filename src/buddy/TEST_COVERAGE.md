# Buddy 测试覆盖清单

本文档用于记录 `src/buddy/` 当前已经补上的测试、已验证行为、以及仍缺失的测试点，便于后续持续治理。

## 当前已存在的测试文件

### 1. CompanionSprite / Floating Bubble

- 源码：
  - `CompanionSprite.tsx`
  - `CompanionFloatingBubbleState.ts`
- 测试：
  - `__tests__/CompanionFloatingBubbleState.test.ts`
  - `__tests__/CompanionFloatingBubble.ui.test.tsx`

#### 已覆盖

- `reaction` 初始化时状态创建
- `reaction` 不变时状态不误重置
- `reaction` 变化时 `tick` 正确归零
- `reaction` 清空时状态重置
- `tick` 推进逻辑
- fading 阈值边界
- 从旧 reaction 切换到新 reaction 时不继承旧 fading 状态
- `CompanionSprite` 主容器 gate 纯逻辑
- 宽屏静默路径下的 sprite column 渲染
- 宽屏 speaking 且非 fullscreen 时的 inline bubble 渲染
- fullscreen speaking 时仅渲染 sprite body，不渲染 inline bubble
- 窄屏路径下的一行 face + quoted quip 渲染
- `getCompanion() === null` 时整体不渲染
- `companionMuted` 时整体不渲染
- focused name row 会包裹空格高亮名称
- 预留列宽计算逻辑
- idle blink 步的动画派生逻辑
- blink 时 sprite 眼睛替换为 `-` 的渲染行为
- pet burst hearts 的帧推进与可视输出
- 浮动气泡文本实际渲染
- fading 前后 UI 样式变化
- fullscreen 下向下 tail 渲染

#### 仍缺失

- focused 状态在窄屏 / speaking 组合下的更细粒度回归

### 2. Buddy 通知

- 源码：
  - `useBuddyNotification.tsx`
- 测试：
  - `__tests__/useBuddyNotification.test.tsx`

#### 已覆盖

- teaser 时间窗口判断
- live 时间判断
- teaser 显示 gate 纯逻辑
- `/buddy` 触发词边界匹配
- `BuddyTeaserText` 的 Ink 渲染
- teaser notification 对象构造
- 正向通知 effect 路径会真正添加 teaser notification
- 正向通知 effect 的 cleanup 会移除 teaser notification
- companion 已存在时 Hook 不添加提示
- feature 关闭时 Hook 不添加提示

#### 仍缺失

- `findBuddyTriggerPositions()` 在 feature gate 开/关时的集成测试

### 3. Companion React 逻辑

- 源码：
  - `companionReact.ts`
- 测试：
  - `__tests__/companionReact.test.ts`

#### 已覆盖

- companion 名称正则转义
- 最近用户消息中的“被点名”判断
- transcript 构造逻辑
- mute / transcript / rate-limit 触发门控
- recent reactions 的裁剪逻辑
- API 请求体构造
- API 成功返回后写回 reaction
- 非 addressed 场景下的限流
- muted 场景下跳过 API

#### 仍缺失

- token 缺失时跳过请求
- organization UUID 缺失时跳过请求
- API 返回非 `ok` 时的恢复路径
- 返回 JSON 格式异常时的容错路径
- `recentReactions` 在多次调用中的完整累积行为

### 4. Companion Card

- 源码：
  - `CompanionCard.tsx`
- 测试：
  - `__tests__/CompanionCard.test.tsx`

#### 已覆盖

- 统计条文本格式化
- dismiss 激活条件
- 卡片边框、稀有度标题、名字、个性、stats 的 Ink 渲染
- shiny 标识渲染
- last reaction 区块显示
- last reaction 缺失时区块隐藏

#### 仍缺失

- `useInput` 触发后 `onDone` 被调用的交互测试
- 多种 rarity 颜色映射的渲染测试
- 较长 personality / lastReaction 文本的折行表现
- sprite 不同 species 的最小渲染回归测试

## 当前已开始补测但仍未补全的源码

### 1. companion.ts

#### 建议优先级

- 高

#### 原因

- 承担 companion 生成、读取、稀有度、命名等核心领域逻辑
- 一旦出错，影响 hatch、rehatch、展示、稀有度分布等多个路径

#### 已覆盖

- `rollWithSeed()` 的确定性
- `roll()` 的缓存行为
- roll 结果的基础范围约束
- `generateSeed()` 的格式
- `companionUserId()` 的回退链路
- `getCompanion()` 在配置存在 / 不存在时的行为
- `getCompanion()` 对 stored soul 与 regenerated bones 的合并逻辑
- stale bones 字段被 regenerated bones 覆盖的行为
- seed 缺失时回退到 `companionUserId()`
- `saveGlobalConfig` 写入后 `getCompanion()` 的读回逻辑
- `saveGlobalConfig` 清空 companion 后的读回行为
- common rarity 必定使用 `hat: 'none'` 的规则
- 确定性样本中覆盖全部 rarity 档位
- 确定性样本中同时覆盖 shiny / non-shiny
- rarity 分布在固定样本上保持接近权重形状
- shiny 比例在固定样本上保持在预期边界内
- 非 common rarity 在固定样本上覆盖 `none` 与非 `none` hat

#### 仍缺失

- uncommon / rare / epic / legendary 分 rarity 的 hat 分布细分断言

## 当前已补测但仍可继续完善的源码

### 2. sprites.ts

#### 建议优先级

- 中

#### 原因

- 是主要的可视输出资源层
- 不需要重构，但适合补渲染快照级回归测试

#### 已覆盖

- `renderSprite()` 对 blank hat slot 的裁剪行为
- `renderSprite()` 在可放帽子的 frame 上注入 hat line
- `renderSprite()` 在首行已被动画占用时不覆盖 hat line
- `renderSprite()` 的 frame modulo 行为
- `spriteFrameCount()` 对全部 species 的帧数回归
- `renderFace()` 的 species → face 映射回归

#### 仍缺失

- `renderSprite()` 在更多 species 上的逐行结构回归
- shiny 对 sprite 可视输出无影响这一约束的显式测试
- 不同 hat 样式在多 species 上的注入回归

### 3. prompt.ts

#### 建议优先级

- 中

#### 原因

- 逻辑不复杂，但关系到首次 companion 文案体验

#### 已覆盖

- intro 文案中的 name / species 插值
- feature 关闭时不生成 intro attachment
- companion 缺失时不生成 intro attachment
- muted 时不生成 intro attachment
- 满足条件时生成 `companion_intro` attachment
- 同名 companion 已宣布时跳过重复 attachment
- 不同 companion 名称时允许新的 intro attachment

#### 仍缺失

- `getCompanionIntroAttachment()` 在真实 feature 开启环境下的集成测试
- 更长 companion 名称 / species 的文案格式回归

### 4. types.ts

#### 建议优先级

- 低

#### 原因

- 主要是常量、类型和映射
- 更适合通过使用方测试间接覆盖

#### 已覆盖

- `SPECIES` 的完整集合与顺序
- runtime-constructed species 常量的实际字符串值
- `EYES`、`HATS`、`STAT_NAMES` 的完整性
- `RARITY_WEIGHTS`、`RARITY_STARS`、`RARITY_COLORS` 的 key 覆盖完整性
- rarity 权重总和与分布回归
- rarity 星级单调递增约束
- rarity 颜色映射回归

#### 仍缺失

- 类型层约束只能由编译器保证的部分仍未以运行时测试表达

## 当前收尾优先级

1. `companionReact.ts` 的错误恢复与累计状态测试
2. `CompanionCard.tsx` 的交互与长文本表现测试
3. `CompanionSprite.tsx` 的 focused + narrow + speaking 组合回归
4. `companion.ts` 的分 rarity hat 细分断言
5. `sprites.ts` 的更细逐行结构回归

## 当前治理总结

### 已完成“轻量治理 + 测试补齐”的文件

- `CompanionSprite.tsx`
- `CompanionFloatingBubbleState.ts`
- `useBuddyNotification.tsx`
- `companionReact.ts`
- `CompanionCard.tsx`

### 已完成基础补测的文件

- `companion.ts`
- `sprites.ts`
- `prompt.ts`
- `types.ts`

### 当前更适合“按需精修”的文件

- `CompanionSprite.tsx`
- `CompanionCard.tsx`
- `companionReact.ts`

## 建议使用方式

- 每次补完 buddy 目录测试后，更新本清单
- 若新增了新的纯函数或展示组件，也在对应条目下补充“已覆盖 / 仍缺失”
- 若后续开始治理 `companion.ts`，建议先单独建立领域逻辑测试计划，再回填到本清单

## 最终收尾总结

- `buddy` 目录的核心风险已经从“系统性缺测试”下降到“少量边界缺口”
- 领域层、资源层、提示层、常量层、主要 UI 路径、动态动画路径均已建立测试兜底
- 后续若没有明确回归信号，可以停止大范围补测，改为按需补特定缺口
