## ADDED Requirements

### 需求:后台管理员角色必须分级
系统必须提供 `AdminRole` 枚举，并且至少包含 `SUPER_ADMIN`、`OPERATOR`、`VIEWER` 三个角色。

#### 场景:设置管理员角色
- **当** 系统创建或更新 `AdminUser`
- **那么** `AdminRole` 必须是预定义枚举值之一

### 需求:SUPER_ADMIN 必须拥有全部后台管理权限
系统必须允许 `SUPER_ADMIN` 执行 Tool、Skill、Integration 的配置与管理操作，并可管理其他管理员账户。

#### 场景:SUPER_ADMIN 操作后台资源
- **当** `SUPER_ADMIN` 请求创建或修改 Tool/Skill/Integration
- **那么** 系统必须授权并执行该操作

### 需求:OPERATOR 只能执行配置管理权限
系统必须允许 `OPERATOR` 管理 Tool、Skill、Integration，但禁止其进行管理员账户与系统级高危配置管理。

#### 场景:OPERATOR 管理配置
- **当** `OPERATOR` 请求更新 Tool 配置
- **那么** 系统必须授权该操作

#### 场景:OPERATOR 管理管理员账户
- **当** `OPERATOR` 请求创建或变更管理员账户
- **那么** 系统必须拒绝该操作

### 需求:VIEWER 只能读取后台信息
系统必须允许 `VIEWER` 查看日志与配置只读信息，并禁止其进行任何写操作。

#### 场景:VIEWER 读取日志
- **当** `VIEWER` 请求查看后台日志
- **那么** 系统必须返回只读数据

#### 场景:VIEWER 修改配置
- **当** `VIEWER` 请求修改 Tool/Skill/Integration
- **那么** 系统必须拒绝该操作

## MODIFIED Requirements

## REMOVED Requirements
