# yj-video-comic

把多段完整 360° 环绕视频制作成可拖拽旋转、单格聚焦和自动播放的 Three.js 互动漫画静态网站。

## 功能

- 支持 1–9 段 360° 环绕视频
- 横向拖动控制观察角度
- 单格聚焦、上一格、下一格和整页模式
- 自动旋转、复位和漫画网点效果
- 自动适配桌面端、触摸屏和键盘操作
- 使用 FFmpeg 转换为全关键帧 H.264 MP4，改善随机跳帧体验
- 输出可部署到 GitHub Pages 等静态托管平台的网站

## 安装为 Codex Skill

将 `skills/yj-video-comic` 目录复制到：

```text
C:\Users\<用户名>\.codex\skills\yj-video-comic
```

重新打开 Codex 后，可以这样调用：

```text
使用 $yj-video-comic，把指定目录中的 360° 视频制作成互动漫画。
主题：一个女孩在废弃城市寻找最后一台机器人
标题：最后一台机器人
输出到：C:\互动漫画
```

## 依赖

- Windows 11
- Node.js 18 或更高版本
- FFmpeg 和 FFprobe

## 目录

```text
skills/yj-video-comic/
├─ SKILL.md
├─ agents/openai.yaml
├─ assets/site/index.html
├─ references/input-schema.md
└─ scripts/
   ├─ build-comic.mjs
   ├─ serve.mjs
   └─ selftest.mjs
```

输入清单格式见 [input-schema.md](skills/yj-video-comic/references/input-schema.md)。

## 验证

```powershell
node skills\yj-video-comic\scripts\selftest.mjs
```

测试会生成临时视频，并验证转码、视频元数据读取、配置注入和静态网站输出。

