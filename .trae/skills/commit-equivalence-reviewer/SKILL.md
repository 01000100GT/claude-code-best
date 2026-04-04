---
name: "commit-equivalence-reviewer"
description: "Reviews whether a commit preserves behavior after refactor or cleanup. Invoke when user asks if a commit correctly restored code, simplified generated artifacts, or changed behavior."
---

# Commit Equivalence Reviewer

## 适用场景

当用户提出以下类型的问题时调用本 skill：

- “这个 commit 是不是把代码正确还原了？”
- “这次重构只是清理可读性，还是改了行为？”
- “删除编译产物/自动生成变量后，逻辑有没有偏移？”
- “帮我看这个提交值不值得合并，是否存在行为回归风险”

## 核心目标

对一个提交做“行为等价性审查”，输出：

1. 改动范围
2. 改动意图
3. 行为是否等价
4. 剩余风险点
5. 应补的测试

## 审查原则

- 不把“代码更像人写的”自动等同于“行为没变”
- 不把“变量名、缓存变量、辅助函数变化”自动视为风险
- 必须区分：
  - 结构性还原
  - 语义性变更
  - 时序性变更
  - 守卫条件变更

## 推荐流程

### 1. 先看提交本身

- 读取 `git show --stat --patch <commit>`
- 确认是否只改一个文件，还是涉及多处调用链
- 标记是否出现以下信号：
  - `_temp`
  - `_c(...)`
  - `$[i]`
  - 编译器缓存
  - 自动内联 helper
  - 人工重写的 hooks/effect/state

### 2. 判断改动性质

把本次改动归类为以下之一：

- 编译产物还原为普通 React/TS 代码
- 变量提炼/命名优化
- 条件判断重排
- effect 依赖变化
- 定时器/生命周期变化
- 容器与展示层分离
- 真实行为变更

### 3. 建立行为不变量

至少明确以下问题：

- 组件/函数什么时候执行
- 什么时候返回空值/null
- 状态何时初始化
- 状态何时重置
- 定时器何时启动、停止
- 文本/结构/样式何时变化
- 从 A 切到 B 时是否保留旧状态

### 4. 风险优先检查项

优先看这些高风险点：

- `useEffect` 依赖数组变化
- render 阶段同步 setState
- `useState` 初始值计算方式变化
- `useRef` 改成 `useState` 或反过来
- guard 条件顺序变化
- feature flag 判断位置变化
- timeout / interval 清理逻辑变化
- 闭包捕获值变化

### 5. 给出结论等级

输出结论时要分级：

- 高置信等价：已结合代码与测试验证
- 中置信等价：静态审查未见异常，但缺少运行态验证
- 存疑：存在时序、守卫或状态迁移风险
- 非等价：已发现明确行为变化

## 输出模板

输出应包含：

- 提交主要改了什么
- 看起来是“清理”还是“行为调整”
- 哪些点等价
- 哪些点需要警惕
- 推荐写什么测试
- 当前结论置信度

## 测试建议模板

针对提交审查，优先建议：

- 边界条件测试
- 输入切换测试
- effect/timer 驱动测试
- UI 结构存在性测试
- fading / disabled / muted / hidden 之类阈值测试

## 反模式

避免以下做法：

- 只看代码更短更干净就判定等价
- 不查调用入口就下结论
- 不查 feature gate、配置和全局状态
- 不区分“当前实现正确”和“提交是否正确还原”

## 示例触发语句

- “帮我判断这个 git 提交是否把代码正确还原了”
- “这个 refactor 是不是只清理了 React Compiler artifacts”
- “比较提交前后是否行为等价”
