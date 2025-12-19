# 发布到 npm

## 📦 为什么发布到 npm？

发布到 npm 后，用户可以直接使用：

```bash
# 而不是
npm install -g git+https://github.com/chiuweilun1107/aidevelop-template.git

# 可以直接
npm install -g @chiuweilun1107/specflow-cli
```

更简洁、更专业！

## 🚀 发布步骤

### 1. 注册 npm 账号

访问 https://www.npmjs.com/signup 注册账号

### 2. 登录 npm

```bash
npm login
```

输入：
- Username: `chiuweilun1107`（或你的用户名）
- Password: 你的密码
- Email: 你的邮箱

### 3. 验证登录

```bash
npm whoami
# 应该显示你的用户名
```

### 4. 确认 package.json 配置

确保以下字段正确：

```json
{
  "name": "@chiuweilun1107/specflow-cli",
  "version": "1.0.0",
  "description": "规范驱动开发 CLI 工具 - 将 AI 提示词工作流工程化",
  "main": "dist/index.js",
  "bin": {
    "specflow": "./bin/specflow"
  }
}
```

### 5. 构建项目

```bash
# 确保代码已编译
npm run build

# 检查将要发布的文件
npm pack --dry-run
```

### 6. 发布到 npm

```bash
# 首次发布（公开包）
npm publish --access public

# 后续更新
npm publish
```

### 7. 验证发布

访问 https://www.npmjs.com/package/@chiuweilun1107/specflow-cli

或者测试安装：

```bash
npm install -g @chiuweilun1107/specflow-cli
specflow --version
```

## 🔄 更新版本

### 自动更新版本号

```bash
# 补丁版本 (1.0.0 → 1.0.1) - 修复 bug
npm version patch

# 次版本 (1.0.0 → 1.1.0) - 新功能，向后兼容
npm version minor

# 主版本 (1.0.0 → 2.0.0) - 破坏性更新
npm version major
```

### 发布新版本

```bash
# 1. 更新版本
npm version patch

# 2. 推送到 GitHub（包含 tag）
git push && git push --tags

# 3. 发布到 npm
npm publish
```

## 📋 发布前检查清单

- [ ] 代码已编译 (`npm run build`)
- [ ] 测试通过
- [ ] README.md 已更新
- [ ] CHANGELOG.md 已更新（如果有）
- [ ] package.json 版本号已更新
- [ ] Git 已提交并推送
- [ ] 已登录 npm (`npm whoami`)

## 🎯 一键发布脚本

创建 `scripts/publish.sh`：

```bash
#!/bin/bash
set -e

echo "🔍 检查工作目录..."
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ 有未提交的更改，请先提交"
  exit 1
fi

echo "🏗️  构建项目..."
npm run build

echo "📦 发布到 npm..."
npm publish --access public

echo "🚀 推送 tags 到 GitHub..."
git push --tags

echo "✅ 发布完成！"
echo "查看: https://www.npmjs.com/package/@chiuweilun1107/specflow-cli"
```

使用：

```bash
chmod +x scripts/publish.sh
./scripts/publish.sh
```

## ⚠️ 注意事项

### 1. 包名规则

- `@username/package-name` - scoped package（推荐）
- `package-name` - unscoped package（可能被占用）

### 2. 版本号规范（semver）

- `MAJOR.MINOR.PATCH`
- 例如：`1.2.3`
  - MAJOR: 破坏性更新
  - MINOR: 新功能，向后兼容
  - PATCH: Bug 修复

### 3. 什么会被发布？

根据 `.npmignore` 决定：
- ✅ 包含：`dist/`, `bin/`, `README.md`, `LICENSE`, `package.json`
- ❌ 排除：`src/`, `node_modules/`, `tests/`, `.git/`

### 4. 撤销发布

```bash
# 撤销指定版本（72小时内）
npm unpublish @chiuweilun1107/specflow-cli@1.0.0

# 撤销整个包（谨慎！）
npm unpublish @chiuweilun1107/specflow-cli --force
```

## 📊 发布后

### 查看下载统计

访问 https://www.npmjs.com/package/@chiuweilun1107/specflow-cli

### 更新 README badges

npm version badge 会自动显示最新版本：

```markdown
[![npm version](https://img.shields.io/npm/v/@chiuweilun1107/specflow-cli.svg)](https://www.npmjs.com/package/@chiuweilun1107/specflow-cli)
[![npm downloads](https://img.shields.io/npm/dm/@chiuweilun1107/specflow-cli.svg)](https://www.npmjs.com/package/@chiuweilun1107/specflow-cli)
```

## 🎓 最佳实践

1. **使用语义化版本** - 遵循 semver 规范
2. **维护 CHANGELOG** - 记录每个版本的更改
3. **测试后发布** - 确保功能正常
4. **Git tag 同步** - 版本号与 git tag 对应
5. **及时响应 issues** - 维护项目声誉

## 🔗 相关链接

- npm 官网: https://www.npmjs.com/
- npm 文档: https://docs.npmjs.com/
- semver 规范: https://semver.org/
- 包管理最佳实践: https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry
