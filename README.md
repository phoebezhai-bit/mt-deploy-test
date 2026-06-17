# MT Debate Live Demo UI v10

本版本更新：
- 大屏端：观点区域支持鼠标滚动回看历史观点；新观点通过审核后仍会自动滚动到最新位置。
- 大屏端：每条已上墙观点显示点赞总数。
- 观众端：发表观点页面下方新增“已公开观点”列表，可按“全部 / A方 / B方”筛选。
- 观众端：可对已公开观点点赞 / 取消点赞；点赞数实时同步到大屏端和后台端。
- 后台端：待审核和已上墙观点中显示点赞总数。

## 部署
将本文件夹内所有内容上传到 GitHub 仓库根目录，Commit 后等待 Vercel 自动部署。

## Firebase Realtime Database Rules（v10 必须更新）

进入 Firebase → Realtime Database → Rules，把规则替换为下面这版。
其中管理员 UID 已按当前项目填入：`qohU57hS1YPjrRAC6qcUYGVeSS02`。

```json
{
  "rules": {
    "events": {
      "$eventId": {
        ".read": true,
        "meta": {
          ".read": true,
          ".write": "auth != null && auth.uid === 'qohU57hS1YPjrRAC6qcUYGVeSS02'"
        },
        "state": {
          ".read": true,
          ".write": "auth != null && auth.uid === 'qohU57hS1YPjrRAC6qcUYGVeSS02'"
        },
        "settings": {
          ".read": true,
          ".write": "auth != null && auth.uid === 'qohU57hS1YPjrRAC6qcUYGVeSS02'"
        },
        "questions": {
          ".read": true,
          "$questionIndex": {
            ".read": true,
            ".write": "auth != null && auth.uid === 'qohU57hS1YPjrRAC6qcUYGVeSS02'",
            "title": {
              ".read": true,
              ".write": "auth != null && auth.uid === 'qohU57hS1YPjrRAC6qcUYGVeSS02'"
            },
            "sideA": {
              ".read": true,
              ".write": "auth != null && auth.uid === 'qohU57hS1YPjrRAC6qcUYGVeSS02'"
            },
            "sideB": {
              ".read": true,
              ".write": "auth != null && auth.uid === 'qohU57hS1YPjrRAC6qcUYGVeSS02'"
            },
            "updatedAt": {
              ".read": true,
              ".write": "auth != null && auth.uid === 'qohU57hS1YPjrRAC6qcUYGVeSS02'"
            },
            "participants": {
              "$participantId": {
                ".read": true,
                ".write": "newData.child('uid').val() === $participantId || (auth != null && auth.uid === 'qohU57hS1YPjrRAC6qcUYGVeSS02')"
              }
            },
            "comments": {
              "$commentId": {
                ".read": true,
                ".write": "(!data.exists() && newData.child('status').val() === 'pending') || (auth != null && auth.uid === 'qohU57hS1YPjrRAC6qcUYGVeSS02') || (data.exists() && newData.child('text').val() === data.child('text').val() && newData.child('side').val() === data.child('side').val() && newData.child('nickname').val() === data.child('nickname').val() && newData.child('emoji').val() === data.child('emoji').val() && newData.child('uid').val() === data.child('uid').val() && newData.child('status').val() === data.child('status').val() && newData.child('createdAt').val() === data.child('createdAt').val())",
                "likes": {
                  "$uid": {
                    ".read": true,
                    ".write": "newData.val() === true || !newData.exists() || (auth != null && auth.uid === 'qohU57hS1YPjrRAC6qcUYGVeSS02')"
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

发布 Rules 后，重新刷新大屏端、观众端、后台端测试。


## v10 修复
- 修复手机端点赞 Permission Denied：Rules 允许观众只更新 likes，不允许修改观点正文/持方/昵称/状态。
- 优化大屏端点赞统计：爱心和数字放在观点卡片右下角，字号放大，并增加圆角矩形衬底，避免和正文重叠。
