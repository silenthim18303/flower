# Flower Garden - PhaserJS 小游戏

一个基于 **Phaser** 的轻量点击养成小游戏示例。

游戏中会生成一片花田，花朵会随时间自动生长；当花朵长到最大状态时，点击任意一朵“成熟花”即可统一收割，并累计计数。

## 功能简介

- 使用 `Phaser` 渲染 2D 场景
- 6 × 4 花朵网格（共 24 朵）
- 花朵三段生长状态（缩放值：`0.3 -> 0.6 -> 1`）
- 每朵花都有进度条，随生长状态变化颜色
- 点击成熟花后，重置所有成熟花并增加计数
- 左上角显示累计收获数量

## 玩法说明

1. 打开游戏后，花朵会自动进入生长周期。
2. 当花朵长到最大状态（成熟）后，点击任意成熟花。
3. 系统会一次性收割当前所有成熟花，并将它们重置为初始状态继续生长。

> 当前版本中，点击未成熟花不会触发收割。

## 本地运行

> 由于浏览器的静态资源访问限制，建议通过本地 Web 服务器运行，不要直接双击 `index.html`。

### 方式一：使用 http-server（推荐）

项目已包含依赖：`http-server`。

```bash
npm install
npx http-server .
```

启动后在浏览器访问命令行输出的地址（通常为 `http://127.0.0.1:8080`）。

### 方式二：任意静态服务器

你也可以使用 VSCode Live Server、Nginx 或其他静态服务器，只要项目根目录能被正常托管即可。

## 项目结构

```text
.
├─ index.html        # 主游戏入口与核心逻辑
├─ phaser.min.js     # Phaser 引擎文件
├─ assets/           # 游戏图片资源
├─ example.html      # Phaser 示例页面（非主游戏）
├─ package.json      # 依赖定义（http-server）
└─ readme.txt        # 原始简要说明
```

## 关键可调参数（index.html）

- `flowerScaleValues`：花朵各阶段缩放比例
- `flowerCycleSeconds`：完整生长周期（秒）
- `rows` / `cols`：花朵排布行列数

根据需求调整这些参数，即可快速改变游戏节奏与难度。

## 依赖

- Phaser（本地 `phaser.min.js`）
- Node.js（仅用于本地启动静态服务）

## 素材声明

软件内部分图片素材使用了 [Iconfont](https://www.iconfont.cn/) 提供的资源。

## 许可协议

本仓库包含 `LICENSE` 文件，请按该协议使用。
