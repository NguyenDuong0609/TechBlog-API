# Commit Convention - NestJS Tech Blog (Blog Features Added)

Dự án sử dụng **Conventional Commits** với cấu hình tùy chỉnh qua `commitlint.config.js`.

## Chức năng đã thêm so với BASE-PROJECT-NESTJS

Dưới đây là danh sách các commit convention cho các chức năng đã thêm vào dự án để build thành Tech Blog:

### Phase 1: Blog Core Entities (Migration 1793000000000)

```bash
feat(database): add blog core entities migration

Add categories, tags, posts, series tables with proper relationships.
Expand users table with bio, avatarUrl, socialLinks, postCount fields.
Add Author role to user_role_enum.
Create post_status_enum (DRAFT, PENDING, PUBLISHED, ARCHIVED).
Create post_level_enum (basic, series, lab, advanced).

Closes Blog Core Setup
```

```bash
feat(posts): create posts module with CRUD operations

Implement posts controller, service, entities, DTOs.
Support post status management (draft, pending, published, archived).
Add post levels (basic, series, lab, advanced).
Include view count, reading time, reaction count tracking.
Support featured and editor's choice flags.
```

```bash
feat(categories): create categories module

Implement categories management with name, slug, description, color, icon.
Add postCount tracking per category.
Support category listing and filtering.
```

```bash
feat(tags): create tags module

Implement tags management with name, slug, usageCount.
Add tag- post many-to-many relationship.
Support tag search and usage statistics.
```

```bash
feat(series): create series module

Implement series management for organizing related posts.
Add series-posts relationship with ordering.
Support series listing by author.
```

```bash
feat(common): add blog-specific enums and utilities

Add post_status_enum, post_level_enum, reaction_type_enum, notification_type_enum.
Add reading-time.util for calculating post reading duration.
Add slug.util for generating URL-friendly slugs.
```

### Phase 2: Blog Phase 2 Entities (Migration 1793100000000)

```bash
feat(database): add blog phase 2 entities migration

Add notifications table with multiple notification types.
Add user_follows table for author following.
Add category_follows table for category subscription.
Add post_reactions table for like/love/clap reactions.
Expand comments table with moderation fields (isHidden, hiddenReason).
Create notification_type_enum with 10 notification types.
```

```bash
feat(notifications): create notifications module

Implement notifications controller, service, entities, DTOs.
Support notification types: NEW_COMMENT, REPLY, POST_APPROVED, POST_REJECTED,
POST_PENDING, MENTION, NEW_MESSAGE, SYSTEM, NEW_POST_FROM_FOLLOWING,
NEW_POST_IN_CATEGORY.
Add unread notification tracking.
Support notification data JSON payload.
```

```bash
feat(follows): create follows module

Implement user follow/unfollow functionality.
Add category follow/subscribe functionality.
Track follower/following relationships.
Support listing followers and following users.
```

```bash
feat(reactions): create reactions module

Implement post reactions (like, love, clap).
Support reaction toggling (add/remove).
Track reaction counts per post.
Support listing user's reactions.
```

```bash
feat(comments): add moderation support

Add isHidden field for comment moderation.
Add hiddenReason field for admin notes.
Support comment hiding/showing by admins.
```

### Phase 3: Blog Phase 3 Entities (Migration 1793200000000)

```bash
feat(database): add blog phase 3 entities migration

Add chat_conversations table for real-time messaging.
Add conversation_participants join table.
Add chat_messages table with read status.
Add settings table for system configuration.
Add isActive column to users table.
```

```bash
feat(chat): create chat module with WebSocket support

Implement real-time chat using WebSocket gateway.
Support conversation creation and management.
Add message sending and receiving.
Track message read status.
Support conversation participants management.
```

```bash
feat(settings): create settings module

Implement system settings management.
Support key-value configuration storage.
Add isPublic flag for public settings.
Support settings CRUD operations.
```

```bash
feat(users): add isActive field

Add isActive column to users table for account status management.
Support account activation/deactivation.
```

### Phase 4: Blog Phase 4 Cleanup (Migration 1793300000000)

```bash
refactor(database): remove legacy boilerplate tables

Drop checkin_stats, checkins tables.
Drop flash_card_states, flash_cards tables.
Drop collections, topics tables.
Clean up unused base project entities.
```

### Additional Features

```bash
feat(socket): create WebSocket module

Implement WebSocket gateway infrastructure.
Add socket guards for authentication.
Create socket service for connection management.
Support real-time features integration.
```

```bash
feat(dashboard): create dashboard module

Implement dashboard controller and service.
Add statistics aggregation for posts, comments, users.
Support admin dashboard metrics.
```

```bash
improve(posts): add reading time calculation

Implement automatic reading time calculation based on word count.
Default to 1 minute minimum reading time.
Update readingTime field on post save.
```

```bash
improve(posts): add slug generation

Implement automatic slug generation from post title.
Ensure unique slugs across posts.
Handle special characters and spaces.
Update slug field on post save.
```

### Documentation Updates

```bash
docs(readme): update project documentation for tech blog

Update README.md with blog-specific features.
Add POSTMAN_GUIDE.md for API testing.
Add PRODUCTION_DEPLOYMENT_GUIDE.md for deployment.
Add docs-v2 directory with organized documentation.
```

```bash
docs(postman): create blog-specific Postman collection

Create postman_blog_technical_collection.json.
Create postman_blog_technical_environment.json.
Add endpoints for posts, categories, tags, series, comments, reactions, notifications, chat.
```

### Configuration Updates

```bash
chore(env): update environment configuration for blog features

Add blog-specific environment variables.
Update .env.dev with new configuration.
Add notification settings.
Add chat WebSocket configuration.
```

## Tổng quan các Module đã thêm

| Module | Mô tả | Scope trong commit |
|--------|-------|-------------------|
| `posts` | Quản lý bài viết blog | `posts` |
| `categories` | Quản lý danh mục bài viết | `categories` |
| `tags` | Quản lý tags bài viết | `tags` |
| `series` | Quản lý series bài viết | `series` |
| `notifications` | Quản lý thông báo | `notifications` |
| `follows` | Quản lý follow user/category | `follows` |
| `reactions` | Quản lý reaction bài viết | `reactions` |
| `chat` | Chat real-time | `chat` |
| `settings` | Cấu hình hệ thống | `settings` |
| `dashboard` | Dashboard thống kê | `dashboard` |
| `socket` | WebSocket infrastructure | `socket` |
| `common` | Enums và utilities chung | `common` |

## Format

```bash
<type>(<scope>): <subject>

<body>

<footer>
```

## Type (Loại thay đổi)

### Các type được hỗ trợ

| Type | Mô tả | Ví dụ |
|------|-------|-------|
| `feat` | Tính năng mới | `feat(auth): add Google OAuth2 login` |
| `fix` | Sửa lỗi | `fix(posts): resolve infinite loop in comment tree` |
| `improve` | Cải thiện code (performance, code quality) | `improve(cache): optimize Redis query performance` |
| `refactor` | Tái cấu trúc code (không thay đổi chức năng) | `refactor(users): extract user validation to separate service` |
| `docs` | Thêm/cập nhật tài liệu | `docs(api): update Swagger documentation for posts` |
| `chore` | Thay đổi nhỏ trong quá trình phát triển | `chore(deps): upgrade TypeORM to version 0.3.20` |
| `style` | Sửa lỗi định dạng, không ảnh hưởng logic | `style: fix code formatting in user controller` |
| `test` | Viết/sửa test | `test(comments): add unit tests for comment validation` |
| `revert` | Revert commit trước đó | `revert: revert "feat(posts): add bookmark feature"` |
| `ci` | Thay đổi cấu hình CI/CD | `ci(gitlab): update deployment pipeline stages` |
| `build` | Build tệp tin, thay đổi build config | `build: update Dockerfile for production` |

## Scope (Phạm vi thay đổi)

Scope bắt buộc và nên mô tả module hoặc phần của hệ thống bị ảnh hưởng.

### Các scope phổ biến cho dự án

| Scope | Mô tả |
|-------|-------|
| `auth` | Authentication, Authorization, JWT, OAuth |
| `users` | User management, profile |
| `posts` | Blog posts, articles |
| `categories` | Categories management |
| `tags` | Tags management |
| `series` | Series management |
| `comments` | Comments, reactions |
| `reactions` | Post reactions (like, love, clap) |
| `follows` | User follows, category follows |
| `notifications` | Notifications system |
| `chat` | Real-time chat |
| `settings` | System settings |
| `dashboard` | Dashboard statistics |
| `socket` | WebSocket infrastructure |
| `media` | File upload, media management |
| `search` | Search functionality |
| `cache` | Redis caching |
| `queue` | BullMQ background jobs |
| `database` | Database migrations, schema |
| `api` | API endpoints, controllers |
| `dto` | Data Transfer Objects, validation |
| `config` | Configuration, environment variables |
| `audit` | Audit logging |
| `common` | Common enums, utilities |
| `infrastructure` | Docker, CI/CD, DevOps |

## Subject (Tiêu đề)

- Viết thường (lower-case)
- Không kết thúc bằng dấu chấm
- Tối đa 72 ký tự
- Sử dụng động từ mệnh lệnh (imperative mood): "add" thay vì "added", "fix" thay vì "fixed"

✅ **Tốt:**

```bash
feat(posts): add bookmark functionality for articles
fix(auth): resolve JWT token expiration issue
```

❌ **Kém:**

```bash
feat(posts): Added bookmark functionality for articles.
fix(auth): Resolved JWT token expiration issue (quá dài)
```

## Body (Nội dung chi tiết)

- Tùy chọn, nhưng nên có cho các thay đổi phức tạp
- Giải thích **tại sao** (why) thay đổi được thực hiện, không chỉ **cái gì** (what)
- Có thể có nhiều dòng
- Mỗi dòng tối đa 72 ký tự

```bash
feat(posts): add bookmark functionality for articles

Allow users to bookmark posts for later reading. Bookmarks are stored
in the database with user_id and post_id references. This feature
addresses user feedback requesting a way to save interesting articles.
```

## Footer (Phần chân)

- Tùy chọn
- Dùng để:
  - Tham chiếu issue: `Closes #123`, `Fixes #456`
  - Breaking changes: `BREAKING CHANGE:`
  - Thêm thông tin metadata

```bash
feat(auth): implement refresh token rotation

Implements secure refresh token rotation to prevent token reuse.
Old refresh tokens are invalidated when new ones are issued.

Closes #78
BREAKING CHANGE: Refresh token format changed, clients must update
```

## Ví dụ Commit Messages

### Tính năng mới

```bash
feat(posts): add comment tree pagination with cursor

Implement cursor-based pagination for nested comments to improve
performance on posts with large comment threads. Uses the ltree
column for efficient tree traversal.

Closes #234
```

```bash
feat(media): add support for multiple image upload in posts

Allow users to upload up to 10 images per post using S3 multipart
upload. Images are compressed automatically before storage.
```

### Sửa lỗi

```bash
fix(comments): resolve SQL injection vulnerability in comment search

Sanitize user input before passing to SQL query. Use parameterized
queries via TypeORM instead of string concatenation.

Security: High priority fix
```

```bash
fix(auth): fix infinite redirect loop in OAuth callback

OAuth callback was incorrectly redirecting when user already
authenticated, causing browser to hang. Now properly handles
authenticated state.
```

### Cải thiện

```bash
improve(cache): implement query result caching for posts

Cache frequently accessed post data in Redis with 5-minute TTL.
Reduces database load by ~40% for post listing endpoints.

Performance: Reduced average response time from 200ms to 120ms
```

### Tái cấu trúc

```bash
refactor(posts): extract post validation logic to dedicated service

Move post validation logic from controller to PostValidationService
to improve testability and reusability. No functional changes.
```

### Tài liệu

```bash
docs(readme): update setup instructions for Windows

Add specific instructions for Windows development environment,
including PowerShell command examples and known workarounds.
```

### CI/CD

```bash
ci(gitlab): add automated deployment to staging environment

Configure GitLab CI to automatically deploy to staging on merge
to develop branch. Includes environment variable injection and
health check verification.
```

### Build

```bash
build(docker): optimize Docker image size by using multi-stage build

Reduce final image size from 1.2GB to 450GB by separating build
and runtime stages. Improves deployment speed and reduces costs.
```

## Quy tắc bắt buộc (Theo commitlint.config.js)

1. ✅ **Type phải hợp lệ**: Chỉ sử dụng các type được liệt kê ở trên
2. ✅ **Type viết thường**: `feat` thay vì `Feat` hoặc `FEAT`
3. ✅ **Type không được trống**: Phải có type
4. ✅ **Scope bắt buộc**: Phải có scope trong ngoặc đơn
5. ✅ **Subject không được trống**: Phải có tiêu đề
6. ✅ **Subject không có dấu chấm**: Không kết thúc bằng `.`
7. ✅ **Header tối đa 72 ký tự**: Giữ ngắn gọn

## Công cụ hỗ trợ

Dự án đã cấu hình:
- **commitlint**: Tự động validate commit message
- **husky**: Git hook để chạy commitlint trước khi commit

Nếu commit message không tuân thủ quy tắc, commit sẽ bị từ chối.

## Tips

1. **Commit nhỏ, thường xuyên**: Mỗi commit nên chỉ làm một việc
2. **Viết subject rõ ràng**: Người khác đọc là hiểu ngay
3. **Giải thích "tại sao"**: Body nên giải thích lý do thay đổi
4. **Sử dụng scope đúng**: Giúp người đọc biết phần nào bị ảnh hưởng
5. **Test trước khi commit**: Đừng commit code bị lỗi

## Ví dụ Workflow

```bash
# Thay đổi code
git add .

# Commit với message đúng format
git commit -m "feat(posts): add bookmark functionality"

# Nếu commit phức tạp, dùng -m nhiều lần
git commit -m "feat(posts): add bookmark functionality

Allow users to bookmark posts for later reading. Bookmarks are
stored in the database with user_id and post_id references.

Closes #123"
```

## Liên kết

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Commitlint Documentation](https://commitlint.js.org/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)
