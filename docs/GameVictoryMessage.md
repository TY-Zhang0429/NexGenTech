# GameVictoryMessage 组件

一个简洁美观的游戏胜利消息组件，通过页面模糊效果显示胜利信息和avatar进化状态。

## 功能特性

- � 页面模糊背景，聚焦胜利信息
- 🖼️ 展示进化后的avatar图片
- ⭐ 自动处理avatar进化逻辑
- 🎨 流畅的动画效果和渐变文字
- 📱 响应式设计，支持移动端
- 🔧 可配置的消息内容和显示时长

## 设计特色

### 简洁界面
- 移除了卡片弹出效果
- 采用全屏模糊背景
- 文字和图像直接显示在模糊层上

### Avatar展示
- 进化时显示新等级的avatar图片
- 圆形头像设计，带有发光效果
- 脉动动画突出avatar形象

### 视觉效果
- 渐变色彩标题文字
- 金色进化提示文字
- 等级徽章动画效果

## 使用方法

### 1. 导入组件

```vue
<script setup>
import GameVictoryMessage from '@/components/GameVictoryMessage.vue';
</script>
```

### 2. 在模板中使用

```vue
<template>
  <div>
    <!-- 其他游戏内容 -->
    <GameVictoryMessage 
      ref="victoryMessage" 
      game-type="wordle" 
      :duration="3000"
      custom-victory-message="自定义胜利消息"
    />
  </div>
</template>
```

### 3. 在JavaScript中调用

```vue
<script setup>
const victoryMessage = ref(null);

function onGameWin() {
  // 显示胜利消息
  if (victoryMessage.value) {
    victoryMessage.value.showVictory();
  }
}

function hideMessage() {
  // 手动隐藏消息
  if (victoryMessage.value) {
    victoryMessage.value.hideVictory();
  }
}
</script>
```

## Props

| 属性 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| game-type | String | 是 | - | 游戏类型，支持 'wordle', 'match3', 'catcher' |
| custom-victory-message | String | 否 | '' | 自定义胜利消息，如果为空则使用默认消息 |
| duration | Number | 否 | 3000 | 消息显示时长（毫秒） |

## 方法

| 方法名 | 参数 | 描述 |
|--------|------|------|
| showVictory() | 无 | 显示胜利消息，自动处理avatar进化 |
| hideVictory() | 无 | 隐藏胜利消息 |

## Avatar进化逻辑

组件会自动处理以下逻辑：

1. **检查avatar类型**：只有Sol avatar ('avatara') 才会进化
2. **检查游戏完成状态**：每个游戏类型只能触发一次进化
3. **检查进化等级**：最大支持4个等级
4. **更新存储**：自动更新sessionStorage中的数据
5. **通知其他组件**：通过自定义事件通知avatar状态变化

## 存储结构

组件使用以下sessionStorage键：

- `avatarType`: avatar类型
- `avatarEvolutionLevel`: 当前进化等级 (1-4)
- `completedGames`: 已完成的游戏数组 ['wordle', 'match3', 'catcher']

## 样式自定义

组件使用scoped样式，如需自定义外观，可以通过CSS变量或深度选择器覆盖样式。

## 已集成的游戏

- ✅ WordleGameView
- ✅ Match3View  
- ✅ CatcherView

## 示例效果

### 有avatar进化时
```
[Avatar图片 - 200x200px圆形头像，带发光效果]

� Wordle Victory! 🌟
Congratulations! You guessed the word correctly!

┌─────────────────────────────────┐
│ Your avatar Sol has evolved     │
│ to level 2!                     │
│                                 │
│        [Level 2]                │
└─────────────────────────────────┘
```

### 无avatar进化时
```
[Avatar图片 - 当前等级头像]

� Wordle Victory! 🌟
Well done! You solved the puzzle!
```

### 已达到最大等级
```
[Avatar图片 - 最高等级头像]

� Wordle Victory! 🌟
Well done! You solved the puzzle!
(Avatar at max level)
```

## 注意事项

1. 确保在使用组件前已正确设置avatar系统
2. gameType必须是支持的类型之一
3. 组件会自动处理进化逻辑，无需在游戏中重复处理
4. 消息会在指定时间后自动隐藏