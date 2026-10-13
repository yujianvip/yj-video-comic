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
    "background": "#171513"
  },
  "panels": [
    {
      "video": "videos/01.mp4",
      "caption": "她在空城里发现了一串新鲜脚印。",
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
- `panels[].reverse`：将拖动方向反转。
- `panels[].startAngle`：初始角度，单位为度。

视频必须表示完整一周。生成器会读取实际时长，并用 `角度 / 360 × 时长` 定位画面。
