# Trae Skills 使用指南

本文档用于帮助团队成员在处理 React/Ink UI、提交审查、feature gate 和状态逻辑时，快速选择合适的 skill。

## 当前可用 Skill

### 1. react-ink-ui-refactor-validator

- 位置：`./react-ink-ui-refactor-validator/SKILL.md`
- 作用：安全重构 React/Ink UI 组件，并补齐“状态层 + UI 层”双层验证
- 适合场景：
  - 去掉 React Compiler artifacts、自动生成变量、编译器缓存代码
  - 把复杂组件重构为更可维护的写法
  - 需要同时补充逻辑测试和真实渲染测试

### 2. commit-equivalence-reviewer

- 位置：`./commit-equivalence-reviewer/SKILL.md`
- 作用：判断某个提交是否只是清理结构，还是改变了行为
- 适合场景：
  - 用户问“这个 commit 是否正确还原了代码”
  - 需要分析 refactor / cleanup / generated artifacts removal 是否等价
  - 需要输出风险点与应补测试

### 3. feature-gated-ui-tester

- 位置：`./feature-gated-ui-tester/SKILL.md`
- 作用：验证受 feature flag、配置、状态、布局条件控制的 UI
- 适合场景：
  - UI 没显示，不确定是哪个 gate 挡住了
  - 同一组件只有在 fullscreen、narrow、focused、muted 等状态下才出现
  - 需要系统化补全显示/隐藏分支测试

### 4. state-logic-extractor

- 位置：`./state-logic-extractor/SKILL.md`
- 作用：把组件中的状态迁移逻辑提取成纯函数，并补充针对性测试
- 适合场景：
  - 有 tick / phase / fading / age / mode 等状态推进逻辑
  - 某个输入变化时需要重置局部状态
  - 组件测试难写，原因是状态逻辑和 UI 耦合太深

## 如何选择

### 先按任务类型选

#### A. 用户在问“这个提交有没有改行为”

优先使用：

- `commit-equivalence-reviewer`

必要时联动：

- 如果发现问题本质是状态迁移难判断，再接 `state-logic-extractor`
- 如果发现问题本质是 feature gate 条件复杂，再接 `feature-gated-ui-tester`
- 如果最终需要顺手完成重构和补测试，再接 `react-ink-ui-refactor-validator`

#### B. 用户要你“把类似 UI 组件统一重构并补测试”

优先使用：

- `react-ink-ui-refactor-validator`

必要时联动：

- 状态逻辑太绕：接 `state-logic-extractor`
- 显示条件太多：接 `feature-gated-ui-tester`

#### C. 用户说“为什么这个界面没显示”

优先使用：

- `feature-gated-ui-tester`

必要时联动：

- 如果需要分析相关提交是不是改坏了：接 `commit-equivalence-reviewer`
- 如果显示条件背后是复杂状态逻辑：接 `state-logic-extractor`

#### D. 用户说“这段 tick / reaction / fading 逻辑太绕了”

优先使用：

- `state-logic-extractor`

必要时联动：

- 如果最终还要做真实 Ink/React 渲染验证：接 `react-ink-ui-refactor-validator`

## 推荐组合

### 组合 1：提交审查链路

适用于：

- 审查 refactor 是否等价
- 审查“去编译产物”类提交

推荐顺序：

1. `commit-equivalence-reviewer`
2. `state-logic-extractor`
3. `react-ink-ui-refactor-validator`

### 组合 2：UI 不显示排查链路

适用于：

- 功能代码存在，但界面没出现
- feature flag / 配置 / store 状态组合复杂

推荐顺序：

1. `feature-gated-ui-tester`
2. `state-logic-extractor`
3. `react-ink-ui-refactor-validator`

### 组合 3：批量可测性改造链路

适用于：

- 一批类似组件需要统一治理
- 团队希望形成标准重构模式

推荐顺序：

1. `react-ink-ui-refactor-validator`
2. `state-logic-extractor`
3. `feature-gated-ui-tester`

## 决策速查表

| 你现在的问题 | 优先 Skill |
|---|---|
| 这个提交是否正确还原代码 | `commit-equivalence-reviewer` |
| 这个 UI 为什么没显示 | `feature-gated-ui-tester` |
| 这段状态逻辑太绕，想抽纯函数 | `state-logic-extractor` |
| 这类 React/Ink UI 需要统一重构和补测试 | `react-ink-ui-refactor-validator` |

## 团队使用建议

- 先让 skill 帮你缩小问题边界，再动代码
- 遇到同时涉及“提交审查 + UI 验证 + 状态重构”的任务时，不要试图一次性用一个 skill 覆盖全部问题
- 优先选择“最贴近当前问题本质”的 skill 作为入口
- 若任务从审查演变为落地重构，再顺序切换到后续 skill

## 一个典型例子

例如遇到如下任务：

- “某个提交把 React Compiler artifacts 删掉了，想知道是否正确还原，并希望补可复用测试方案”

推荐做法：

1. 先用 `commit-equivalence-reviewer` 判断是否行为等价
2. 再用 `state-logic-extractor` 把 tick / reaction / fading 之类逻辑抽纯
3. 最后用 `react-ink-ui-refactor-validator` 补 UI 层真实渲染测试

## 维护约定

- 新增 skill 时，必须同步更新本 README
- 每个 skill 的 `description` 必须写清：
  - 它做什么
  - 什么时候调用
- 如果两个 skill 的职责开始明显重叠，应在 README 中重新梳理边界，避免团队误用
