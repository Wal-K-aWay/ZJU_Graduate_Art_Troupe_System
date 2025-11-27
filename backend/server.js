import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import mysql from 'mysql2/promise'

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }))

const pool = mysql.createPool({ host: process.env.DB_HOST || 'mysql', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER || 'zju_user', password: process.env.DB_PASSWORD || 'zju_pass', database: process.env.DB_NAME || 'zju_graduate_art_troupe', connectionLimit: 10, charset: 'utf8mb4_general_ci' })
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } })
const jwtSecret = process.env.JWT_SECRET || 'dev-secret'
pool.query('SET NAMES utf8mb4')

app.post('/auth/login', async (req, res) => {
  const { student_no, password } = req.body || {}
  if (!student_no || !password) return res.status(400).json({ code: 400, message: '学号或密码为空' })
  const [rows] = await pool.query('SELECT id, role, name, password_hash FROM users WHERE student_no = ? AND status = "active" LIMIT 1', [student_no])
  if (!rows.length) return res.status(401).json({ code: 401, message: '用户不存在或已停用' })
  const user = rows[0]
  if (!user.password_hash) return res.status(401).json({ code: 401, message: '未设置密码' })
  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) return res.status(401).json({ code: 401, message: '密码错误' })
  const token = jwt.sign({ uid: user.id, role: user.role }, jwtSecret, { expiresIn: '2h' })
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax' })
  res.json({ code: 200, message: '登录成功' })
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
  const [rows] = await pool.query('SELECT id,name FROM colleges ORDER BY name')
  res.json(rows)
})

function auth(req, res, next) {
  const t = req.cookies?.token
  if (!t) return res.status(401).json({ code: 401, message: '未登录' })
  try { req.user = jwt.verify(t, jwtSecret); next() } catch { return res.status(401).json({ code: 401, message: '会话失效' }) }
}

app.get('/auth/me', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT u.id,u.role,u.name,u.gender,DATE_FORMAT(u.birthday, "%Y-%m-%d") AS birthday,u.student_no,c.name AS college,u.phone,u.join_year,u.profile_photo_id FROM users u JOIN colleges c ON c.id=u.college_id WHERE u.id=? LIMIT 1', [req.user.uid])
  if (!rows.length) return res.status(404).json({ code: 404, message: '用户不存在' })
  res.json(rows[0])
})

app.get('/users', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ code: 403, message: '无权限' })
  const { name = '', college = '', year = '', gender = '' } = req.query
  const sql = `SELECT u.id,u.name,u.student_no,u.gender,c.name AS college,u.join_year,u.profile_photo_id FROM users u JOIN colleges c ON c.id=u.college_id WHERE u.status='active' AND (?='' OR u.name LIKE CONCAT('%',?,'%') OR u.student_no LIKE CONCAT('%',?,'%')) AND (?='' OR c.name LIKE CONCAT('%',?,'%')) AND (?='' OR u.join_year = ?) AND (?='' OR u.gender = ?)`
  const params = [name, name, name, college, college, year, year, gender, gender]
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

app.delete('/users/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ code: 403, message: '无权限' })
  await pool.query('UPDATE users SET status="inactive" WHERE id=?', [req.params.id])
  res.json({ code: 200, message: '已删除' })
})

app.get('/users/export', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ code: 403, message: '无权限' })
  const { name = '', college = '', year = '', gender = '' } = req.query
  const sql = `SELECT u.name,u.student_no,u.gender,c.name AS college,u.join_year FROM users u JOIN colleges c ON c.id=u.college_id WHERE u.status='active' AND (?='' OR u.name LIKE CONCAT('%',?,'%') OR u.student_no LIKE CONCAT('%',?,'%')) AND (?='' OR c.name LIKE CONCAT('%',?,'%')) AND (?='' OR u.join_year = ?) AND (?='' OR u.gender = ?)`
  const params = [name, name, name, college, college, year, year, gender, gender]
  const [rows] = await pool.query(sql, params)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="members.csv"')
  res.write('姓名,学号,性别,学院,入团年份\n')
  for (const r of rows) { res.write(`${r.name},${r.student_no},${r.gender==='male'?'男':'女'},${r.college},${r.join_year}\n`) }
  res.end()
})

app.listen(process.env.PORT || 8080, () => {})
