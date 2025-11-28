import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import mysql from 'mysql2/promise'
import mysql2 from 'mysql2'

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }))

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'zju_user',
  password: process.env.DB_PASSWORD || 'zju_pass',
  database: process.env.DB_NAME || 'zju_graduate_art_troupe',
  connectionLimit: 10,
  charset: 'UTF8MB4_GENERAL_CI',
  typeCast(field, next) {
    const t = field.type
    if (t === mysql2.Types.VAR_STRING || t === mysql2.Types.STRING || t === mysql2.Types.NEWDECIMAL || t === mysql2.Types.BLOB) {
      const buf = field.buffer()
      if (buf == null) return null
      try { return buf.toString('utf8') } catch { return next() }
    }
    return next()
  }
})
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } })
const jwtSecret = process.env.JWT_SECRET || 'dev-secret'
pool.on('connection', (conn) => {
  conn.query('SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci')
})

async function getEffectiveRole(uid) {
  const [rows] = await pool.query('SELECT CASE WHEN EXISTS (SELECT 1 FROM user_groups m WHERE m.user_id=? AND m.status="active" AND m.role IN ("leader","deputy")) THEN "admin" ELSE u.role END AS role FROM users u WHERE u.id=? LIMIT 1', [uid, uid])
  return rows?.[0]?.role || 'member'
}

app.post('/auth/login', async (req, res) => {
  const { student_no, password } = req.body || {}
  if (!student_no || !password) return res.status(400).json({ code: 400, message: '学号或密码为空' })
  const [rows] = await pool.query('SELECT id, role, name, password_hash FROM users WHERE student_no = ? AND status = "active" LIMIT 1', [student_no])
  if (!rows.length) return res.status(401).json({ code: 401, message: '用户不存在或已停用' })
  const user = rows[0]
  if (!user.password_hash) return res.status(401).json({ code: 401, message: '未设置密码' })
  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) return res.status(401).json({ code: 401, message: '密码错误' })
  const effRole = await getEffectiveRole(user.id)
  const token = jwt.sign({ uid: user.id, role: effRole }, jwtSecret, { expiresIn: '2h' })
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax' })
  res.json({ code: 200, message: '登录成功' })
})

app.post('/auth/logout', async (req, res) => {
  res.cookie('token', '', { httpOnly: true, sameSite: 'lax', maxAge: 0 })
  res.json({ code: 200, message: '已退出' })
})

app.post('/auth/register', upload.single('avatar'), async (req, res) => {
  const b = req.body || {}
  const required = ['name','student_no','password','phone','college','gender','birth_year','birth_month','birth_day','join_year']
  for (const k of required) { if (!b[k]) return res.status(400).json({ code: 400, message: `缺少字段 ${k}` }) }
  const joinYear = Number(b.join_year)
  const nowYear = new Date().getFullYear()
  if (joinYear < 2014 || joinYear > nowYear) return res.status(400).json({ code: 400, message: '入团年份不合法' })
  if (!['male','female'].includes(String(b.gender))) return res.status(400).json({ code: 400, message: '性别不合法' })
  const birth = `${b.birth_year}-${String(b.birth_month).padStart(2,'0')}-${String(b.birth_day).padStart(2,'0')}`
  const pwdHash = await bcrypt.hash(String(b.password), 10)
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    let [colRows] = await conn.query('SELECT id FROM colleges WHERE TRIM(name) = TRIM(?) LIMIT 1', [b.college])
    if (!colRows.length) {
      await conn.query('INSERT INTO colleges(name) VALUES(?) ON DUPLICATE KEY UPDATE name=VALUES(name)', [b.college])
      ;[colRows] = await conn.query('SELECT id FROM colleges WHERE TRIM(name) = TRIM(?) LIMIT 1', [b.college])
    }
    const collegeId = colRows[0].id
    let photoId = null
    if (req.file) {
      const [imgRes] = await conn.query('INSERT INTO images(kind, performance_id, uploader_id, filename, mime_type, size_bytes, data) VALUES("profile", NULL, NULL, ?, ?, ?, ?)', [req.file.originalname || 'avatar', req.file.mimetype, req.file.size, req.file.buffer])
      photoId = imgRes.insertId
    }
    const [userRes] = await conn.query('INSERT INTO users(role,name,gender,birthday,student_no,college_id,phone,join_year,profile_photo_id,status,password_hash) VALUES("member",?,?,?,?,?,?,?,?,"active",?)', [b.name, b.gender, birth, b.student_no, collegeId, b.phone, joinYear, photoId, pwdHash])
    await conn.commit()
    res.status(201).json({ code: 201, message: '注册成功' })
  } catch (e) {
    await conn.rollback()
    const msg = String(e.code || e.message || '注册失败')
    res.status(400).json({ code: 400, message: msg })
  } finally {
    await conn.release()
  }
})

app.get('/dict/colleges', async (req, res) => {
  const [rows] = await pool.query('SELECT id, CONVERT(name USING utf8mb4) AS name FROM colleges ORDER BY name')
  res.json(rows)
})

app.get('/dict/groups', async (req, res) => {
  const [rows] = await pool.query('SELECT MIN(id) AS id, CONVERT(name USING utf8mb4) AS name FROM troupe_groups GROUP BY name ORDER BY name')
  res.json(rows)
})

async function auth(req, res, next) {
  const t = req.cookies?.token
  if (!t) return res.status(401).json({ code: 401, message: '未登录' })
  try {
    const dec = jwt.verify(t, jwtSecret)
    const effRole = await getEffectiveRole(dec.uid)
    req.user = { ...dec, role: effRole }
    next()
  } catch {
    return res.status(401).json({ code: 401, message: '会话失效' })
  }
}

app.get('/auth/me', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT u.id, CASE WHEN EXISTS (SELECT 1 FROM user_groups m WHERE m.user_id=u.id AND m.status="active" AND m.role IN ("leader","deputy")) THEN "admin" ELSE u.role END AS role, u.name,u.gender,DATE_FORMAT(u.birthday, "%Y-%m-%d") AS birthday,u.student_no,CONVERT(c.name USING utf8mb4) AS college,u.phone,u.join_year,u.profile_photo_id FROM users u JOIN colleges c ON c.id=u.college_id WHERE u.id=? LIMIT 1', [req.user.uid])
  if (!rows.length) return res.status(404).json({ code: 404, message: '用户不存在' })
  res.json(rows[0])
})

app.get('/users', async (req, res) => {
  const { name = '', college = '', year = '', gender = '', group = '' } = req.query
  const sql = `SELECT DISTINCT
    u.id,
    u.name,
    CASE WHEN EXISTS (SELECT 1 FROM user_groups mz WHERE mz.user_id=u.id AND mz.status='active' AND mz.role IN ('leader','deputy')) THEN 'admin' ELSE u.role END AS role,
    u.student_no,
    u.gender,
    CONVERT(c.name USING utf8mb4) AS college,
    u.join_year,
    u.profile_photo_id,
    CAST((
      SELECT JSON_ARRAYAGG(JSON_OBJECT('name', CONVERT(g.name USING utf8mb4), 'role', m.role))
      FROM user_groups m JOIN troupe_groups g ON g.id=m.group_id
      WHERE m.user_id=u.id AND m.status='active'
    ) AS CHAR) AS groups_json
  FROM users u JOIN colleges c ON c.id=u.college_id
  LEFT JOIN user_groups m2 ON m2.user_id=u.id AND m2.status='active'
  LEFT JOIN troupe_groups g2 ON g2.id=m2.group_id
  WHERE (?='' OR u.name LIKE CONCAT('%',?,'%') OR u.student_no LIKE CONCAT('%',?,'%'))
    AND (?='' OR c.name LIKE CONCAT('%',?,'%'))
    AND (?='' OR u.join_year = ?)
    AND (?='' OR u.gender = ?)
    AND (?='' OR g2.name LIKE CONCAT('%',?,'%'))`
  const params = [name, name, name, college, college, year, year, gender, gender, group, group]
  const [rows] = await pool.query(sql, params)
  res.json(rows)
})

app.put('/users/:id', auth, async (req, res) => {
  const id = Number(req.params.id)
  if (req.user.role !== 'admin' && req.user.uid !== id) return res.status(403).json({ code: 403, message: '无权限' })
  const b = req.body || {}
  let [colRows] = await pool.query('SELECT id FROM colleges WHERE TRIM(name) = TRIM(?) LIMIT 1', [b.college])
  if (!colRows.length && b.college) { await pool.query('INSERT INTO colleges(name) VALUES(?) ON DUPLICATE KEY UPDATE name=VALUES(name)', [b.college]); [colRows] = await pool.query('SELECT id FROM colleges WHERE TRIM(name)=TRIM(?) LIMIT 1', [b.college]) }
  const collegeId = colRows?.[0]?.id
  await pool.query('UPDATE users SET name=?, gender=?, phone=?, birthday=?, join_year=?, college_id=COALESCE(?,college_id) WHERE id=?', [b.name, b.gender, b.phone, b.birthday, b.join_year, collegeId, id])
  res.json({ code: 200, message: '更新成功' })
})

app.post('/users/:id/avatar', auth, upload.single('avatar'), async (req, res) => {
  const id = Number(req.params.id)
  if (req.user.role !== 'admin' && req.user.uid !== id) return res.status(403).json({ code: 403, message: '无权限' })
  if (!req.file) return res.status(400).json({ code: 400, message: '未选择文件' })
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const [imgRes] = await conn.query('INSERT INTO images(kind, performance_id, uploader_id, filename, mime_type, size_bytes, data) VALUES("profile", NULL, ?, ?, ?, ?, ?)', [id, req.file.originalname || 'avatar', req.file.mimetype, req.file.size, req.file.buffer])
    const imgId = imgRes.insertId
    await conn.query('UPDATE users SET profile_photo_id=? WHERE id=?', [imgId, id])
    await conn.commit()
    res.json({ code: 200, message: '上传成功', image_id: imgId })
  } catch (e) {
    await conn.rollback()
    res.status(400).json({ code: 400, message: String(e.message || '上传失败') })
  } finally {
    await conn.release()
  }
})

app.get('/images/:id', async (req, res) => {
  const id = Number(req.params.id)
  const [rows] = await pool.query('SELECT mime_type, data FROM images WHERE id=? LIMIT 1', [id])
  if (!rows.length) return res.status(404).end()
  const r = rows[0]
  res.setHeader('Content-Type', r.mime_type || 'application/octet-stream')
  res.send(r.data)
})

app.get('/stats/today_birthdays', async (req, res) => {
  const [rows] = await pool.query('SELECT u.id, CONVERT(u.name USING utf8mb4) AS name, u.profile_photo_id FROM users u WHERE u.status="active" AND DATE_FORMAT(u.birthday, "%m-%d") = DATE_FORMAT(CURRENT_DATE(), "%m-%d") ORDER BY u.name')
  res.json(rows)
})

app.get('/users/:id/groups', auth, async (req, res) => {
  const id = Number(req.params.id)
  if (req.user.role !== 'admin' && req.user.uid !== id) return res.status(403).json({ code: 403, message: '无权限' })
  try {
    const [rows] = await pool.query('SELECT g.id, CONVERT(g.name USING utf8mb4) AS name, m.role, m.status, m.joined_at, m.left_at FROM user_groups m JOIN troupe_groups g ON g.id=m.group_id WHERE m.user_id=? AND m.status="active" ORDER BY g.name', [id])
    return res.json(rows)
  } catch (e) {
    return res.json([])
  }
})

app.delete('/users/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ code: 403, message: '无权限' })
  await pool.query('UPDATE users SET status="inactive" WHERE id=?', [req.params.id])
  res.json({ code: 200, message: '已删除' })
})

app.get('/users/export', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ code: 403, message: '无权限' })
  const { name = '', college = '', year = '', gender = '', group = '' } = req.query
  const sql = `SELECT DISTINCT u.name,u.student_no,u.gender,CONVERT(c.name USING utf8mb4) AS college,u.join_year FROM users u JOIN colleges c ON c.id=u.college_id LEFT JOIN user_groups m2 ON m2.user_id=u.id AND m2.status='active' LEFT JOIN troupe_groups g2 ON g2.id=m2.group_id WHERE u.status='active' AND (?='' OR u.name LIKE CONCAT('%',?,'%') OR u.student_no LIKE CONCAT('%',?,'%')) AND (?='' OR c.name LIKE CONCAT('%',?,'%')) AND (?='' OR u.join_year = ?) AND (?='' OR u.gender = ?) AND (?='' OR g2.name LIKE CONCAT('%',?,'%'))`
  const params = [name, name, name, college, college, year, year, gender, gender, group, group]
  const [rows] = await pool.query(sql, params)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="members.csv"')
  res.write('姓名,学号,性别,学院,入团年份\n')
  for (const r of rows) { res.write(`${r.name},${r.student_no},${r.gender==='male'?'男':'女'},${r.college},${r.join_year}\n`) }
  res.end()
})

app.listen(process.env.PORT || 8080, () => {})
function fixUtf8(s) {
  if (typeof s !== 'string') return s
  try { return Buffer.from(s, 'latin1').toString('utf8') } catch { return s }
}
