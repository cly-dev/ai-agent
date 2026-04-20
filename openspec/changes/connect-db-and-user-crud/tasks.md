## 1. 数据库接入

- [x] 1.1 新增 `PrismaService`，封装连接初始化与销毁生命周期
- [x] 1.2 新增 `PrismaModule` 并在 `AppModule` 中注册导入
- [x] 1.3 增加启动期数据库连接验证与错误提示

## 2. User 模块结构

- [x] 2.1 创建 `src/modules/user` 基础目录与 `user.module.ts`
- [x] 2.2 定义 `create-user.dto.ts` 与 `update-user.dto.ts`（含基础参数校验）
- [x] 2.3 创建 `user.service.ts` 并注入 PrismaService
- [x] 2.4 创建 `user.controller.ts` 并暴露 CRUD 路由

## 3. CRUD 实现

- [x] 3.1 实现创建用户逻辑（create）
- [x] 3.2 实现查询用户列表与详情逻辑（findAll/findOne）
- [x] 3.3 实现更新用户逻辑（update）
- [x] 3.4 实现删除用户逻辑（remove）
- [x] 3.5 对不存在资源统一返回可识别错误（如 404）

## 4. 验证与文档

- [x] 4.1 添加 user service/controller 的基础单元测试
- [x] 4.2 执行 lint、test、build 并修复阻塞问题
- [x] 4.3 更新项目文档，补充数据库连接与 user CRUD 使用说明
