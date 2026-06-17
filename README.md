# MT Debate Live Demo UI v6

本版本修复：
- 观众端扫码后无法提交阵营的问题：按钮重新绑定，并增加失败弹窗提示。
- 后台端阶段切换按钮无反应的问题：改为事件代理绑定，写入 `events/<eventId>/state`，并显示成功/失败提示。
- 大屏端新增“当前状态”提示卡，后台切换阶段后大屏实时显示当前状态。

## 部署
将本文件夹内所有内容上传到 GitHub 仓库根目录，Commit 后等待 Vercel 自动部署。

## 必须确认 Firebase 设置
Authentication：
- Email/Password：Enabled
- Anonymous：Enabled

Realtime Database Rules 需要允许：
- 管理员写入 `events/mt2026-graduation-debate/state`
- 匿名观众写入 `events/mt2026-graduation-debate/questions/$questionIndex/participants/$uid`
- 匿名观众写入 `events/mt2026-graduation-debate/questions/$questionIndex/comments/$commentId`

如果上传 v6 后仍提示 Permission denied，请将 Realtime Database Rules 替换为以下版本，并把 ADMIN_UID 替换为管理员 UID：

```json
{
  "rules": {
    "events": {
      "$eventId": {
        ".read": true,
        ".write": "auth != null && auth.uid === 'ADMIN_UID'",
        "state": {
          ".read": true,
          ".write": "auth != null && auth.uid === 'ADMIN_UID'"
        },
        "meta": {
          ".read": true,
          ".write": "auth != null && auth.uid === 'ADMIN_UID'"
        },
        "questions": {
          ".read": true,
          "$questionIndex": {
            ".read": true,
            ".write": "auth != null && auth.uid === 'ADMIN_UID'",
            "participants": {
              "$uid": {
                ".read": true,
                ".write": "auth != null && (auth.uid === $uid || auth.uid === 'ADMIN_UID')"
              }
            },
            "comments": {
              "$commentId": {
                ".read": true,
                ".write": "auth != null && ((!data.exists() && newData.child('uid').val() === auth.uid) || auth.uid === 'ADMIN_UID')"
              }
            }
          }
        }
      }
    }
  }
}
```


## v7 Firebase Realtime Database Rules（重要）

v7 观众端不再使用 Firebase Anonymous Auth，而是使用本地 Guest ID，避免手机端出现 `auth/admin-restricted-operation`。
请进入 Firebase → Realtime Database → Rules，把规则替换为下面这版，并把 `PASTE_ADMIN_UID_HERE` 替换成你的后台管理员 UID。

```json
{
  "rules": {
    "events": {
      "$eventId": {
        ".read": true,
        "meta": {
          ".read": true,
          ".write": "auth != null && auth.uid === 'PASTE_ADMIN_UID_HERE'"
        },
        "state": {
          ".read": true,
          ".write": "auth != null && auth.uid === 'PASTE_ADMIN_UID_HERE'"
        },
        "settings": {
          ".read": true,
          ".write": "auth != null && auth.uid === 'PASTE_ADMIN_UID_HERE'"
        },
        "questions": {
          ".read": true,
          "$questionIndex": {
            ".read": true,
            ".write": "auth != null && auth.uid === 'PASTE_ADMIN_UID_HERE'",
            "title": {
              ".read": true,
              ".write": "auth != null && auth.uid === 'PASTE_ADMIN_UID_HERE'"
            },
            "sideA": {
              ".read": true,
              ".write": "auth != null && auth.uid === 'PASTE_ADMIN_UID_HERE'"
            },
            "sideB": {
              ".read": true,
              ".write": "auth != null && auth.uid === 'PASTE_ADMIN_UID_HERE'"
            },
            "updatedAt": {
              ".read": true,
              ".write": "auth != null && auth.uid === 'PASTE_ADMIN_UID_HERE'"
            },
            "participants": {
              "$participantId": {
                ".read": true,
                ".write": "newData.child('uid').val() === $participantId || (auth != null && auth.uid === 'PASTE_ADMIN_UID_HERE')"
              }
            },
            "comments": {
              "$commentId": {
                ".read": true,
                ".write": "(!data.exists() && newData.child('status').val() === 'pending') || (auth != null && auth.uid === 'PASTE_ADMIN_UID_HERE')"
              }
            }
          }
        }
      }
    }
  }
}
```
