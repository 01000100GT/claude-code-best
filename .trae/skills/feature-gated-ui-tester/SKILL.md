---
name: "feature-gated-ui-tester"
description: "Validates feature-gated UI behavior across flags, config, and state guards. Invoke when UI appears conditionally or when a feature works only under specific runtime gates."
---

# Feature-Gated UI Tester

## 适用场景

当用户的任务涉及“有条件才显示”的 UI 时调用本 skill：

- 组件受 `feature('FLAG')` 控制
- 组件受配置、权限、环境、布局、全局状态共同控制
- 用户说“为什么界面没显示”
- 用户想验证某个功能在开关开启/关闭时是否都正确
- UI 只有在 fullscreen、narrow、muted、focused 等特定状态下才出现

## 核心目标

把“显示/隐藏路径”系统化拆开，验证：

1. 哪些 gate 决定组件能否出现
2. 哪些组合会让组件返回 null
3. 哪些组合会让组件切换不同布局或表现
4. 如何写最小但覆盖关键分支的测试

## 工作原则

- 先列 gate，再测 UI
- 先确认入口是否挂载，再确认内部 guard
- 区分：
  - feature gate
  - config gate
  - state gate
  - layout gate
  - environment gate

## 推荐流程

### 1. 枚举所有 gate

对目标组件，至少检查：

- `feature('...')`
- 配置项，如 muted / disabled / user setting
- 全局状态，如 reaction / selected / active / visible
- 布局条件，如 fullscreen / narrow / mobile / width
- 数据依赖是否存在，如 entity / config object / store slice

### 2. 找调用入口

不要只看组件内部。要确认：

- 调用方是否在外层就做了条件判断
- 同一个组件是否有多个挂载点
- 不同布局下是否走不同组件或不同 tail/layout

### 3. 建立真值表

至少写出这几类情况：

- gate 全开 → 应出现
- feature 关 → 不出现
- 配置关闭 → 不出现
- 关键状态缺失 → 不出现
- 布局切换 → 出现但形式变化

### 4. 测试策略

#### 轻量逻辑验证

- 抽离显示条件函数
- 写纯函数测试

#### 真实 UI 验证

- 用真实渲染器验证文本/布局/样式
- 不要只依赖静态快照
- 对 feature-gated 容器组件，必要时拆出纯展示组件做稳定测试

## 最小覆盖建议

至少覆盖以下分支：

1. feature 关闭
2. 数据缺失
3. 配置禁止
4. 正常显示
5. 关键布局差异

如果是气泡/提示类 UI，再增加：

6. 空文本或空状态不显示
7. 边界状态样式变化

## 输出要求

完成任务后应明确告诉用户：

- 这个 UI 受哪些 gate 控制
- 哪个 gate 最容易导致“看不到”
- 你实际验证了哪些组合
- 哪些组合仍未覆盖

## 反模式

避免以下做法：

- 只在“正常显示路径”上测一遍
- 不验证关闭路径
- 不区分挂载失败和内部返回 null
- 为了测试而永久绕过 feature gate

## 示例触发语句

- “这个功能明明有代码，为什么在 Claude Code 里看不到？”
- “帮我验证这个 feature-gated UI 的显示条件”
- “开关、配置和状态组合太多了，帮我把测试补全”
