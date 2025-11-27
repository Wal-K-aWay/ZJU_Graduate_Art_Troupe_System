## 项目文件作用说明

### 根目录
- `docker-compose.yml`: 定义容器编排，包含 `mysql` 与 `adminer` 服务，挂载 `./mysql/data` 持久化与 `./mysql/init` 初始化脚本目录。启动命令示例已通过脚本默认注入 `MYSQL_DATABASE=zju_graduate_art_troupe`。
- `.gitignore`: 忽略 `mysql/data/`，避免将数据库运行数据提交到仓库。

### mysql/init
- `mysql/init/01_schema.sql`: 初始化数据库结构与索引，目标库 `zju_graduate_art_troupe`。关键结构包含：
  - 用户与学院：`users`、`colleges`（字符集/排序在 1–2 行设置，建表在 16–37 行）
  - 分团与成员关系：`troupe_groups`、`user_groups`（平级结构，无父子层级；见 `troupe_groups` 定义与 `user_groups` 外键）
  - 考勤域：`attendance_projects`、`attendance_applications`、`attendance_participants`、`attendance_records`（含外键级联/置空策略）
  - 演出域：`performance_projects`、`performance_applications`、`performance_participants`、`performance_programs`（含 `contact_phone`）、`performance_program_performers`
  - 图片：`images`（二进制列 `data`，并设置外键到 `performance_projects` 与 `users`）
  - 索引：为高频筛选与联表（如 `project_id,status` 组合）配置覆盖索引，提升查询效率。
- `mysql/init/02_seed.sql`: 插入学院列表与分团名称（“总团”“主持礼仪分团”“舞蹈分团”“声乐分团”“器乐分团”），用于首次启动时的基础数据。

### mysql/test
- `mysql/test/crud_demo.sql`: 基础 CRUD 测试用例，覆盖用户、考勤与演出基本流程；包含清理步骤，保证脚本可重复执行。
- `mysql/test/scenario_flow.sql`: 场景化测试用例，覆盖：
  - 管理员/团员注册与编辑（管理员编辑、团员自我编辑）
  - 考勤项目创建、报名、指定参与、签到（含迟到与请假原因）
  - 演出项目创建、报名、指定参与
  - 演出节目创建（顺序与时长）与演出人员及角色分配
  - 图片上传与查询
  - 分团归属与职务（团长/副团长/成员）
  - 脚本末尾全量清理，确保可重复执行

### scripts
- `scripts/run_db_tests.sh`: 一键执行数据库测试，支持两种模式：
  - `docker` 模式：在容器内运行两个 SQL 测试并输出清理后汇总结果
  - `local` 模式：使用本机 `mysql` 客户端连接本地服务运行测试
  - 环境变量：`MYSQL_USER`、`MYSQL_PASSWORD`、`MYSQL_DATABASE`、`DB_HOST`、`DB_PORT`、`CONTAINER_NAME`
- `scripts/docker_up.sh`: 默认注入数据库环境变量并启动 Compose，等待 `zju_mysql` 健康。
- `scripts/docker_restart.sh`: 一键 `down` + `up` 重启 Compose，等待 `zju_mysql` 健康。

### mysql/data（运行时目录）
- 由容器挂载的 MySQL 数据目录，包含实际库文件（如 `zju_graduate_art_troupe/*.ibd`）、系统库与日志。已被 `.gitignore` 忽略；请勿手动变更该目录内容。

## 使用指南（简要）
- 启动容器：`bash scripts/docker_up.sh`
- 运行测试：`MYSQL_USER=zju_user MYSQL_PASSWORD=zju_pass MYSQL_DATABASE=zju_graduate_art_troupe scripts/run_db_tests.sh docker all`
- 图形化查看：访问 `http://localhost:8080/`（Adminer），System 选 `MySQL`，Server 填 `mysql`，Database `zju_graduate_art_troupe`，用户名 `zju_user`，密码 `zju_pass`。

## 可选改进（待你确认）
- 添加 `.env.example`（不提交敏感信息），统一团队本地与云端环境变量用法。
- 增加 CI（如 GitHub Actions）在推送时自动运行 `scripts/run_db_tests.sh docker all`，确保结构与用例稳定。
- 补充只读视图（如“按分团统计报名/入选人数”“演出节目总时长”），提升查询便捷性。

请确认是否需要我继续实施上述可选改进；若确认，我将退出计划模式并直接为你添加相应文件与配置。