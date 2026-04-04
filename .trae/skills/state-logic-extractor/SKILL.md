---
name: "state-logic-extractor"
description: "Extracts UI state transitions into testable pure functions and adds focused tests. Invoke when timers, state resets, or derived UI logic are hard to reason about or verify."
---

# State Logic Extractor

## 适用场景

当组件或模块存在以下问题时调用本 skill：

- 本地状态逻辑混在组件里，难以验证
- 有 `tick`、`phase`、`step`、`age`、`progress`、`mode` 等状态推进逻辑
- 某个输入变化时需要重置局部状态
- fading、过期、窗口期、节流、阶段切换等规则写在组件内部
- 组件测试很难稳定，因为状态迁移和 UI 渲染耦合太深

## 核心目标

把“状态迁移逻辑”从 UI 容器中抽离，形成：

1. 可复用的纯函数
2. 清晰的状态模型
3. 低成本单元测试
4. 更可测的展示组件

## 识别信号

当你看到以下代码形态时，优先考虑抽离：

- `useState({ tick, forX })`
- render 中同步 `setState(...)`
- `useEffect` 中做状态推进
- `setInterval(() => setState(...))`
- `if (input !== state.forInput) reset`
- `const isFading = ...`
- `const isExpired = ...`
- `const phase = ...`

## 抽离目标

通常至少拆出以下函数：

- `createXState(...)`
- `syncXState(...)`
- `advanceXState(...)`
- `isXExpired(...)`
- `isXFading(...)`
- `deriveXPhase(...)`

## 推荐流程

### 1. 定义状态结构

先明确状态对象里有哪些字段：

- 当前计数值
- 当前绑定的输入
- 上次输入
- 起始时间
- 当前阶段

### 2. 区分三类逻辑

#### 初始化逻辑

- 首次渲染时如何创建状态

#### 同步逻辑

- 外部输入变化时是否重置
- 重置哪些字段

#### 推进逻辑

- 每个 tick 或每次事件发生时如何推进

### 3. 让 UI 只消费结果

组件应尽量只做：

- 读取 state
- 调纯函数
- 把派生值传给展示层

不要让组件承担太多状态规则细节。

### 4. 测试设计

状态层至少覆盖：

- 初始化
- 输入不变
- 输入变化
- 推进一步
- 阈值边界
- 从旧输入切换到新输入

若状态影响 UI，还应补：

- 展示层对派生值的渲染测试

## 判断是否值得抽离

满足任一条件就应考虑抽离：

- 相同状态规则可能在多个组件复用
- 当前组件测试写起来很重
- 时序逻辑容易回归
- 代码里已经出现多个命名不清的临时变量

## 输出要求

完成任务后应说明：

- 抽离前有哪些状态耦合问题
- 新状态模型是什么
- 新增了哪些纯函数
- 哪些测试现在变得更容易写

## 反模式

避免以下做法：

- 为了“纯函数化”而过度抽象
- 把只用一次且非常简单的常量计算硬拆出去
- 抽离后命名比原来更难懂
- 只抽函数，不补测试

## 示例触发语句

- “把这个组件里的状态逻辑抽出去，方便测试”
- “reaction/tick/fading 这类逻辑太绕了，帮我整理”
- “这个 UI 的状态迁移经常回归，帮我提纯并加单测”
