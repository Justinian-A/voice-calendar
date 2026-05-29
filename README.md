# 🎤 语音日历 (Voice Calendar)

一款基于语音交互的桌面日历管理工具，让日程管理更高效、更便捷。

## ✨ 功能特性

### 📅 日历管理
- 月视图展示，直观查看日程
- 点击日期查看/添加/编辑/删除事件
- 支持全天事件
- 事件搜索功能

### 🎙️ 语音交互
- 语音添加事件：`"添加明天下午三点开会"`
- 语音删除事件：`"删除明天的会议"`
- 语音查看日程：`"查看今天的日程"`
- 支持中英文混合识别

### 🔔 智能提醒
- 系统原生通知提醒
- 邮件提醒（163邮箱）
- 自定义提前提醒时间

### ⚙️ 个性化设置
- 通知开关控制
- 邮件提醒配置
- 测试通知/邮件功能

## 🛠️ 技术栈

- **框架**: Electron + React + TypeScript
- **构建**: Vite (electron-vite)
- **数据库**: SQLite (sql.js)
- **语音识别**: 百度语音API
- **邮件服务**: Nodemailer (163邮箱SMTP)

## 📦 安装与运行

### 开发模式
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 打包应用
```bash
# 构建项目
npm run build

# 打包为可执行文件
npm run dist
```

打包后的应用位于 `release/win-unpacked/` 目录。

## 📁 项目结构

```
voice-calendar/
├── src/
│   ├── main/              # Electron主进程
│   │   ├── index.ts       # 应用入口
│   │   ├── database.ts    # 数据库操作
│   │   ├── ipc-handlers.ts # IPC通信处理
│   │   ├── baidu-speech.ts # 百度语音API
│   │   ├── email-service.ts # 邮件服务
│   │   ├── notification-service.ts # 通知服务
│   │   └── reminder-scheduler.ts # 提醒调度
│   ├── preload/           # 预加载脚本
│   └── renderer/          # React渲染进程
│       └── src/
│           ├── components/ # 组件
│           ├── utils/      # 工具函数
│           └── styles/     # 样式
├── logs/                  # 开发日志
└── package.json
```

## 📝 使用示例

### 语音指令
| 指令 | 示例 |
|------|------|
| 添加事件 | "添加明天下午三点开会" |
| 删除事件 | "删除明天的会议" |
| 查看日程 | "查看今天的日程" |
| 搜索事件 | "搜索会议" |

### 支持的时间表述
- 今天、明天、后天
- 下周一、下周二...
- X月X日（如：6月1日）
- 上午/下午/晚上 + X点

## 🔧 配置说明

### 百度语音API
需要在百度AI开放平台注册并获取API Key，然后在 `src/main/baidu-speech.ts` 中配置。

### 邮件服务
使用163邮箱SMTP服务，在 `src/main/email-service.ts` 中配置发件邮箱和授权码。

## 📄 许可证

MIT License

## 👨‍💻 作者

Justinian

---

> 💡 提示：语音功能需要麦克风权限，请确保系统授权应用使用麦克风。
