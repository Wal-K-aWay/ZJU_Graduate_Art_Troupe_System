# 浙江大学研究生艺术团管理系统

基于 React + Vite 的前端与 Node.js + Express 的后端，MySQL 作为数据库。提供 `docker compose` 一键启动的本地环境，开箱即用。

## 快速开始

- 前提：已安装 `Docker` 和 `Docker Compose`
- 克隆项目后，在项目根目录创建 `.env` 文件，可以直接复制 `.env.example`：

```
cp .env.example .env
```

- 启动所有服务：

```
docker compose up -d
```

- 等待 MySQL 就绪后访问：
  - Web 前端：`http://localhost:3000`
  - 后端 API：`http://localhost:8080`
  - Adminer（可选的数据库管理）：`http://localhost:8081`

首次使用请在前端页面进行“注册”，随后可登录使用。数据库已内置学院与分团字典数据。

## 目录结构与服务说明

- `frontend/`：前端应用（Vite 构建，容器内由 Nginx 提供静态服务，端口 `3000`）
- `backend/`：后端 API（Express，端口 `8080`）
- `mysql/`：
  - `init/01_schema.sql` 与 `init/02_seed.sql`：自动初始化表结构与基础字典数据
  - `data/`：持久化数据卷（由容器挂载到宿主机）
- `docker-compose.yml`：定义四个服务 `mysql`、`api`、`web`、`adminer`

## 环境变量

在项目根目录的 `.env` 中配置（已提供 `.env.example`）：

- `MYSQL_ROOT_PASSWORD`：MySQL root 密码
- `MYSQL_DATABASE`：初始化数据库名称（默认 `zju_graduate_art_troupe`）
- `MYSQL_USER` / `MYSQL_PASSWORD`：应用连接数据库的账号与密码（默认 `zju_user`/`zju_pass`）
- `JWT_SECRET`：后端签发 JWT 的密钥

示例见 `.env.example`。

## 常用命令

- 查看服务状态：

```
docker compose ps
```

- 查看日志（例如后端）：

```
docker compose logs -f api
```

- 进入数据库（容器内）：

```
docker compose exec mysql mysql -u zju_user -p zju_pass zju_graduate_art_troupe
```

- 停止并移除容器（数据保留在 `mysql/data`）：

```
docker compose down
```

## 接口与前端联通性

- 后端允许跨域来源：`http://localhost:3000` 与 `http://localhost:5173`
- 前端默认将 API 指向 `http://localhost:8080`，无需额外配置；如需自定义，构建前设置 `VITE_API_BASE`

主要接口：
- `POST /auth/register`：注册（支持头像上传）
- `POST /auth/login`：登录（基于 Cookie 的会话）
- `GET /auth/me`：获取当前用户信息
- 其他用户管理、字典查询、头像上传等接口参见后端代码 `backend/server.js`

## 疑难排查

- 访问前端报“Failed to fetch”：
  - 确认 API 已启动并可访问 `http://localhost:8080/auth/me`
  - 浏览器是否拦截第三方 Cookie；本系统使用 Cookie 存储会话
- 端口冲突：
  - 如本机已有服务占用 `3000`/`8080`/`8081`，可在 `docker-compose.yml` 中调整端口映射后重启
- 数据未初始化：
  - 首次启动后，MySQL 容器会自动执行 `mysql/init` 下的脚本，完成建库与字典数据初始化；若失败可 `docker compose logs mysql` 查看原因

## 本地开发（可选）

若需要以开发模式运行：

```
# 后端（API 本机 8090）
cd backend
PORT=8090 DB_HOST=localhost DB_PORT=3306 DB_USER=zju_user DB_PASSWORD=zju_pass DB_NAME=zju_graduate_art_troupe JWT_SECRET=dev-secret npm start

# 前端（Vite 开发服务器 5173，指向本机 API 8090）
cd frontend
VITE_API_BASE=http://localhost:8090 npm run dev
```

## 许可

仅用于学习与内部使用场景，未设置公开许可证。如需开放使用，请在提交前补充许可证信息。

