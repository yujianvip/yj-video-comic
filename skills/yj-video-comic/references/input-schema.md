# 输入清单

生成器接收 UTF-8 JSON 文件。相对视频路径以清单所在目录为基准。

```json
{
  "title": "最后一台机器人",
  "theme": "一个女孩在废弃城市寻找机器人",
  "language": "zh-CN",
  "style": {
    "accent": "#e4472e",
    "halftone": true,
    "background": "#171513",
    "frameShape": "random"
  },
  "panels": [
    {
      "video": "videos/01.mp4",
      "caption": "她在空城里发现了一串新鲜脚印。",
      "shape": "trapezoid-left",
      "captionPosition": { "x": 0.32, "y": 0.9 },
      "reverse": false,
      "startAngle": 0
    }
  ]
}
```

## 必填字段

- `title`：网页标题。
- `theme`：作品主题；写入页面元数据。
- `panels`：1–9 个漫画格。
- `panels[].video`：本地视频路径。
- `panels[].caption`：该格旁白，必须与画面相符。

## 可选字段

- `language`：默认 `zh-CN`。
- `style.accent`：按钮和编号强调色。
- `style.background`：页面背景色。
- `style.halftone`：初始是否显示网点，默认 `true`。
- `style.frameShape`：默认 `random`，可统一指定 `rectangle`、`trapezoid-left`、`trapezoid-right`、`slant-left`、`slant-right`、`hexagon` 或 `irregular`。
- `panels[].shape`：覆盖该格形状。可使用上述名称，或提供 3–8 个按顺序排列的凸多边形顶点，如 `[[0,0],[1,0],[0.9,1],[0.1,1]]`。坐标为格内 0–1 范围。
- `panels[].captionPosition`：选择文字靠近哪条边，`x`、`y` 均为 0–1；例如 `{ "x": 0.5, "y": 0.1 }` 靠上，`{ "x": 0.8, "y": 0.9 }` 靠下。未填时默认从上沿、下沿随机选择；要靠左或靠右，可分别设置 `{ "x": 0.1, "y": 0.5 }` 或 `{ "x": 0.9, "y": 0.5 }`。靠中间的输入会自动吸附到最近的边。
- `panels[].reverse`：将拖动方向反转。
- `panels[].startAngle`：初始角度，单位为度。

视频必须表示完整一周。生成器会读取实际时长，并用 `角度 / 360 × 时长` 定位画面。

整页布局由相邻画格共用的顶点生成不规则分割线，并留窄缝。单格聚焦时使用 `shape` 指定的轮廓；整页模式中的预设形状会影响共用分割线，自定义多边形则在单格聚焦时完整呈现。未指定格形和文字位置时，生成器会按作品内容计算稳定的随机结果，并把选中的值写进输出目录的 `manifest.json`。文字位置会按实际尺寸限制在边缘，特别长的文字仍需人工检查遮挡画面的问题。
