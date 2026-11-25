# @yundashi/dsh-remote-control

云大师远程控制插件，安装后即可在侧边栏「远程控制」发起登录与设备配对。

## 本地开发与构建

```bash
npm install
npm run build
```

构建产物输出到 `lib/`（包含 `lib/index.js`、`lib/client.js` 与 `lib/bundled-connector/`）。

## 服务端地址配置

默认优先读取 `yunwork-runtime.json` 契约中的 `anywhereServerUrl` / `anywhereWebUrl`，也可通过环境变量覆盖：

- `YUNWORK_ANYWHERE_SERVER_URL`
- `YUNWORK_ANYWHERE_WEB_URL`
- `YUNWORK_ANYWHERE_RUNTIME_TYPE`（默认 `yunwork`）

## 发布到 Git

```bash
git init
git add .
git commit -m "feat: initial @yundashi/dsh-remote-control plugin"
git remote add origin <your-git-repo-url>
git push -u origin main
```
