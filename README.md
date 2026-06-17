# MT Debate 正式联网版 - Demo UI版本

本包保持之前视觉 Demo 的 UI（暖色暗场、玻璃卡片、顶部三端切换、头像墙/观点墙），但保留正式联网功能：Firebase Authentication、Realtime Database、后台审核、大屏二维码。

上传方式：把本文件夹里面的所有内容上传到 GitHub 仓库根目录，Commit changes，等待 Vercel 自动部署 Ready。

入口：
- /screen/ 大屏端
- /mobile/ 观众端
- /admin/ 后台端

Firebase Rules 沿用当前已跑通的版本，不需要因为这次 UI 更新重新配置。


UI update: 已去除所有页面顶部“打开渠道”按钮；大屏端仅保留二维码，并移至右上角放大显示。
