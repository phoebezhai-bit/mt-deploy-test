# 2026 MT Debate 正式联网版

## 入口
部署到 Vercel 后，使用你的域名访问：

- 大屏端：`https://你的域名.vercel.app/screen/`
- 手机端：`https://你的域名.vercel.app/mobile/`
- 后台端：`https://你的域名.vercel.app/admin/`

大屏端右上角会自动生成指向 `/mobile/` 的二维码。

## 重要说明
正式版不再使用写在前端代码里的简单后台密码。你之前给的 `2026MT` 不适合作为正式活动后台密码，因为静态网页里的密码可以被技术人员查看。

本版本使用 Firebase Authentication 管理后台账号，并通过 Realtime Database Rules 限制只有管理员 UID 可以审核观点、切换题目、清空数据。

## Firebase 一次性设置

### 1. 开启 Authentication
Firebase Console → Authentication → Get started

开启两个登录方式：

- Email/Password
- Anonymous

### 2. 创建管理员账号
Authentication → Users → Add user

建议邮箱：你自己的邮箱或活动专用邮箱。

密码请不要使用 `2026MT`，建议至少 10 位，包含大小写字母、数字和符号，例如：`MTGlow@2026Admin`。

创建后，在 Users 列表里复制这个用户的 `User UID`。

### 3. 设置 Realtime Database Rules
Firebase Console → Realtime Database → Rules

把下面规则中的 `PASTE_ADMIN_UID_HERE` 替换为你的管理员 User UID，然后发布。

```json
{
  "rules": {
    "events": {
      "$eventId": {
        ".read": true,
        "meta": {
          ".write": "auth != null && auth.uid === 'PASTE_ADMIN_UID_HERE'"
        },
        "state": {
          ".write": "auth != null && auth.uid === 'PASTE_ADMIN_UID_HERE'"
        },
        "questions": {
          "$qid": {
            ".write": "auth != null && auth.uid === 'PASTE_ADMIN_UID_HERE'",
            "participants": {
              "$uid": {
                ".write": "auth != null && auth.uid === $uid",
                ".validate": "newData.hasChildren(['nickname','emoji','side','uid','joinedAt']) && newData.child('uid').val() === auth.uid && newData.child('nickname').isString() && newData.child('nickname').val().length <= 12 && newData.child('emoji').isString() && newData.child('side').val().matches(/^(A|B)$/)"
              }
            },
            "comments": {
              "$cid": {
                ".write": "auth != null && (auth.uid === 'PASTE_ADMIN_UID_HERE' || (!data.exists() && newData.child('uid').val() === auth.uid && newData.child('status').val() === 'pending'))",
                ".validate": "newData.hasChildren(['text','side','nickname','emoji','uid','status','createdAt']) && newData.child('text').isString() && newData.child('text').val().length <= 50 && newData.child('side').val().matches(/^(A|B)$/) && newData.child('nickname').isString() && newData.child('nickname').val().length <= 12 && newData.child('emoji').isString() && newData.child('status').val().matches(/^(pending|approved|rejected|hidden)$/)"
              }
            }
          }
        }
      }
    }
  }
}
```

### 4. 后台初始化活动数据
打开 `/admin/`，用管理员邮箱和密码登录，点击：

`初始化/修复活动数据`

然后打开 `/screen/` 和 `/mobile/` 测试。

## 使用流程

1. 后台选择当前辩题。
2. 后台切换到「阵营选择」。
3. 观众扫码进入手机端，输入昵称，选择 A/B 持方。
4. 后台切换到「观点提交」。
5. 观众提交观点。
6. 后台审核观点，通过后大屏实时显示。
7. 后台切换到「结果展示」或下一题。

## 活动前测试建议

至少用 10–20 台手机测试：

- 手机扫码是否可打开
- 昵称和 Emoji 是否显示到大屏
- A/B 人数比例是否实时变化
- 观点是否进入后台审核
- 审核通过后是否上墙
- 切换题目后是否正常
- 大屏电脑全屏显示是否正常

