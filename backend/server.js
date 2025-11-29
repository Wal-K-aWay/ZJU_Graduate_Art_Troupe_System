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
  conn.query("SET time_zone = '+08:00'")
})

async function getEffectiveRole(uid) {
  const [rows] = await pool.query('SELECT CASE WHEN EXISTS (SELECT 1 FROM user_groups m WHERE m.user_id=? AND m.status="active" AND m.role IN ("leader","deputy")) THEN "admin" ELSE u.role END AS role FROM users u WHERE u.id=? LIMIT 1', [uid, uid])
  return rows?.[0]?.role || 'member'
}

async function isGlobalAdmin(uid) {
  const [rows] = await pool.query('SELECT role FROM users WHERE id=? LIMIT 1', [uid])
  return String(rows?.[0]?.role || '') === 'admin'
}

async function canEditMember(editorUid, targetUid) {
  const [rows] = await pool.query('SELECT 1 FROM user_groups m1 JOIN user_groups m2 ON m1.group_id=m2.group_id WHERE m1.user_id=? AND m1.status="active" AND m1.role IN ("leader","deputy") AND m2.user_id=? AND m2.status="active" LIMIT 1', [editorUid, targetUid])
  return rows && rows.length > 0
}

app.post('/auth/login', async (req, res) => {
  const { student_no, password } = req.body || {}
  if (!student_no || !password) return res.status(400).json({ code: 400, message: '学号或密码为空' })
  const [rows] = await pool.query('SELECT id, role, name, password_hash FROM users WHERE student_no = ? LIMIT 1', [student_no])
  if (!rows.length) return res.status(401).json({ code: 401, message: '用户不存在' })
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

app.post('/auth/change_password', auth, async (req, res) => {
  try {
    const uid = req.user.uid
    const { current_password = '', new_password = '' } = req.body || {}
    const np = String(new_password || '')
    if (!np) return res.status(400).json({ code: 400, message: '新密码不能为空' })
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id=? LIMIT 1', [uid])
    if (!rows.length) return res.status(404).json({ code: 404, message: '用户不存在' })
    const ph = rows[0]?.password_hash
    if (ph) {
      const ok = await bcrypt.compare(String(current_password || ''), ph)
      if (!ok) return res.status(401).json({ code: 401, message: '当前密码错误' })
    }
    const hash = await bcrypt.hash(np, 10)
    await pool.query('UPDATE users SET password_hash=? WHERE id=?', [hash, uid])
    return res.json({ code: 200, message: '密码已更新' })
  } catch (e) {
    return res.status(400).json({ code: 400, message: String(e.message || '更新失败') })
  }
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
  const { name = '', college = '', year = '', gender = '', group = '', status = '' } = req.query
  const sql = `SELECT DISTINCT
    u.id,
    u.name,
    CASE WHEN EXISTS (SELECT 1 FROM user_groups mz WHERE mz.user_id=u.id AND mz.status='active' AND mz.role IN ('leader','deputy')) THEN 'admin' ELSE u.role END AS role,
    u.student_no,
    u.gender,
    CONVERT(c.name USING utf8mb4) AS college,
    u.join_year,
    u.profile_photo_id,
    u.status AS status,
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
    AND (?='' OR g2.name LIKE CONCAT('%',?,'%'))
    AND (?='' OR u.status = ?)`
  const params = [name, name, name, college, college, year, year, gender, gender, group, group, status, status]
  const [rows] = await pool.query(sql, params)
  res.json(rows)
})

app.put('/users/:id', auth, async (req, res) => {
  const id = Number(req.params.id)
  if (req.user.uid !== id) {
    const isAdmin = await isGlobalAdmin(req.user.uid)
    const sameGroup = await canEditMember(req.user.uid, id)
    if (!isAdmin && !sameGroup) return res.status(403).json({ code: 403, message: '无权限' })
  }
  const b = req.body || {}
  let [colRows] = await pool.query('SELECT id FROM colleges WHERE TRIM(name) = TRIM(?) LIMIT 1', [b.college])
  if (!colRows.length && b.college) { await pool.query('INSERT INTO colleges(name) VALUES(?) ON DUPLICATE KEY UPDATE name=VALUES(name)', [b.college]); [colRows] = await pool.query('SELECT id FROM colleges WHERE TRIM(name)=TRIM(?) LIMIT 1', [b.college]) }
  const collegeId = colRows?.[0]?.id
  await pool.query('UPDATE users SET name=?, gender=?, phone=?, birthday=?, join_year=?, college_id=COALESCE(?,college_id) WHERE id=?', [b.name, b.gender, b.phone, b.birthday, b.join_year, collegeId, id])
  res.json({ code: 200, message: '更新成功' })
})

app.post('/users/:id/avatar', auth, upload.single('avatar'), async (req, res) => {
  const id = Number(req.params.id)
  if (req.user.uid !== id) {
    const isAdmin = await isGlobalAdmin(req.user.uid)
    const sameGroup = await canEditMember(req.user.uid, id)
    if (!isAdmin && !sameGroup) return res.status(403).json({ code: 403, message: '无权限' })
  }
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

app.get('/attendance/projects', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ code: 403, message: '无权限' })
  const [rows] = await pool.query('SELECT id, CONVERT(title USING utf8mb4) AS title, CONVERT(location USING utf8mb4) AS location, DATE_FORMAT(start_time, "%Y-%m-%d %H:%i") AS start_time, DATE_FORMAT(end_time, "%Y-%m-%d %H:%i") AS end_time, status, created_by, created_at FROM attendance_projects ORDER BY start_time DESC')
  function parseUtcFromBj(s) {
    if (typeof s !== 'string' || !s) return null
    const [d, t] = s.split(' ')
    if (!t) return null
    const [y, m, day] = d.split('-').map((x)=>Number(x))
    const [hh, mm] = t.split(':').map((x)=>Number(x))
    return Date.UTC(y, (m||1)-1, day||1, (hh||0)-8, mm||0)
  }
  const utcNow = Date.now()
  const list = Array.isArray(rows) ? rows.map((r)=>{
    const st = parseUtcFromBj(r.start_time)
    const et = parseUtcFromBj(r.end_time)
    let ts = '未开始'
    if (st != null && utcNow < st) ts = '未开始'
    else if (st != null && et != null && utcNow >= st && utcNow <= et) ts = '进行中'
    else if (et != null && utcNow > et) ts = '已结束'
    else if (st != null && et == null && utcNow >= st) ts = '进行中'
    return { ...r, time_status: ts }
  }) : []
  res.json(list)
})

app.get('/attendance/my', auth, async (req, res) => {
  try {
    const uid = req.user.uid
    const sql = `SELECT p.id,
      CONVERT(p.title USING utf8mb4) AS title,
      CONVERT(p.location USING utf8mb4) AS location,
      DATE_FORMAT(p.start_time, "%Y-%m-%d %H:%i") AS start_time,
      DATE_FORMAT(p.end_time, "%Y-%m-%d %H:%i") AS end_time,
      p.status
      FROM attendance_participants ap
      JOIN attendance_projects p ON p.id = ap.project_id
      WHERE ap.user_id = ?
      ORDER BY p.start_time DESC`
    const [rows] = await pool.query(sql, [uid])
    function parseUtcFromBj(s) {
      if (typeof s !== 'string' || !s) return null
      const [d, t] = s.split(' ')
      if (!t) return null
      const [y, m, day] = d.split('-').map((x)=>Number(x))
      const [hh, mm] = t.split(':').map((x)=>Number(x))
      return Date.UTC(y, (m||1)-1, day||1, (hh||0)-8, mm||0)
    }
    const utcNow = Date.now()
    const list = Array.isArray(rows) ? rows.map((r)=>{
      const st = parseUtcFromBj(r.start_time)
      const et = parseUtcFromBj(r.end_time)
      let ts = '未开始'
      if (st != null && utcNow < st) ts = '未开始'
      else if (st != null && et != null && utcNow >= st && utcNow <= et) ts = '进行中'
      else if (et != null && utcNow > et) ts = '已结束'
      else if (st != null && et == null && utcNow >= st) ts = '进行中'
      return { ...r, time_status: ts }
    }) : []
    res.json(list)
  } catch (e) {
    res.status(400).json({ code: 400, message: String(e.message || '查询失败') })
  }
})

app.post('/attendance/projects', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ code: 403, message: '无权限' })
  const b = req.body || {}
  const title = String(b.title || '').trim()
  const location = String(b.location || '').trim()
  const startIn = String(b.start_time || b.time || '').trim()
  const endIn = String(b.end_time || '').trim()
  if (!title || !location || !startIn || !endIn) return res.status(400).json({ code: 400, message: '缺少必填字段' })
  let start = startIn
  if (startIn.includes('T')) start = startIn.replace('T', ' ') + (startIn.length === 16 ? ':00' : (startIn.length === 19 ? '' : ''))
  else if (startIn.length === 16) start = startIn + ':00'
  let end = endIn
  if (endIn.includes('T')) end = endIn.replace('T', ' ') + (endIn.length === 16 ? ':00' : (endIn.length === 19 ? '' : ''))
  else if (endIn.length === 16) end = endIn + ':00'
  const sdt = new Date(start.replace(' ', 'T'))
  const edt = new Date(end.replace(' ', 'T'))
  if (!(sdt instanceof Date && !isNaN(sdt.valueOf())) || !(edt instanceof Date && !isNaN(edt.valueOf()))) return res.status(400).json({ code: 400, message: '时间不合法' })
  if (edt.getTime() <= sdt.getTime()) return res.status(400).json({ code: 400, message: '结束时间必须晚于开始时间' })
  const [r] = await pool.query('INSERT INTO attendance_projects(title, location, start_time, end_time, status, created_by) VALUES(?, ?, ?, ?, "open", ?)', [title, location, start, end, req.user.uid])
  res.status(201).json({ code: 201, message: '创建成功', id: r.insertId })
})

app.put('/attendance/projects/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ code: 403, message: '无权限' })
  const id = Number(req.params.id)
  const b = req.body || {}
  const title = String(b.title || '').trim()
  const location = String(b.location || '').trim()
  const startIn = String(b.start_time || b.time || '').trim()
  const endIn = String(b.end_time || '').trim()
  const status = String(b.status || '').trim()
  if (!title || !location || !startIn || !endIn) return res.status(400).json({ code: 400, message: '缺少必填字段' })
  let start = startIn
  if (startIn.includes('T')) start = startIn.replace('T', ' ') + (startIn.length === 16 ? ':00' : (startIn.length === 19 ? '' : ''))
  else if (startIn.length === 16) start = startIn + ':00'
  let end = endIn
  if (endIn.includes('T')) end = endIn.replace('T', ' ') + (endIn.length === 16 ? ':00' : (endIn.length === 19 ? '' : ''))
  else if (endIn.length === 16) end = endIn + ':00'
  const sdt = new Date(start.replace(' ', 'T'))
  const edt = new Date(end.replace(' ', 'T'))
  if (!(sdt instanceof Date && !isNaN(sdt.valueOf())) || !(edt instanceof Date && !isNaN(edt.valueOf()))) return res.status(400).json({ code: 400, message: '时间不合法' })
  if (edt.getTime() <= sdt.getTime()) return res.status(400).json({ code: 400, message: '结束时间必须晚于开始时间' })
  const sql = status ? 'UPDATE attendance_projects SET title=?, location=?, start_time=?, end_time=?, status=? WHERE id=?' : 'UPDATE attendance_projects SET title=?, location=?, start_time=?, end_time=? WHERE id=?'
  const params = status ? [title, location, start, end, status, id] : [title, location, start, end, id]
  await pool.query(sql, params)
  res.json({ code: 200, message: '更新成功' })
})

app.delete('/attendance/projects/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ code: 403, message: '无权限' })
  const id = Number(req.params.id)
  await pool.query('DELETE FROM attendance_projects WHERE id=?', [id])
  res.json({ code: 200, message: '已删除' })
})

app.post('/attendance/projects/:id/participants', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ code: 403, message: '无权限' })
    const projectId = Number(req.params.id)
    const ids = Array.isArray(req.body?.user_ids) ? req.body.user_ids.map((x)=>Number(x)).filter((n)=>Number.isFinite(n) && n>0) : []
    if (!ids.length) return res.json({ code: 200, message: '已更新', count: 0 })
    const placeholders = ids.map(()=>'(?, ?, "assigned", ?)').join(', ')
    const params = ids.flatMap((uid)=>[projectId, uid, req.user.uid])
    await pool.query(`INSERT INTO attendance_participants(project_id, user_id, source, assigned_by) VALUES ${placeholders} ON DUPLICATE KEY UPDATE source=VALUES(source), assigned_by=VALUES(assigned_by)`, params)
    res.json({ code: 200, message: '分配成功', count: ids.length })
  } catch (e) {
    console.error('assign participants error:', e)
    res.status(400).json({ code: 400, message: String(e.message || e) })
  }
})

app.get('/attendance/projects/:id/participants', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ code: 403, message: '无权限' })
  const projectId = Number(req.params.id)
  const sql = `SELECT u.id, u.name, u.student_no, u.gender, CONVERT(c.name USING utf8mb4) AS college, u.join_year,
    CAST((
      SELECT JSON_ARRAYAGG(JSON_OBJECT('name', CONVERT(g.name USING utf8mb4), 'role', m.role))
      FROM user_groups m JOIN troupe_groups g ON g.id=m.group_id
      WHERE m.user_id=u.id AND m.status='active'
    ) AS CHAR) AS groups_json
    FROM attendance_participants p JOIN users u ON u.id=p.user_id JOIN colleges c ON c.id=u.college_id
    WHERE p.project_id=? ORDER BY u.name`
  const [rows] = await pool.query(sql, [projectId])
  res.json(rows)
})

app.put('/attendance/projects/:id/participants', auth, async (req, res) => {
  const projectId = Number(req.params.id)
  const ids = Array.isArray(req.body?.user_ids) ? req.body.user_ids.map((x)=>Number(x)).filter((n)=>Number.isFinite(n) && n>0) : []
  const conn = await pool.getConnection()
  try {
    if (req.user.role !== 'admin') { res.status(403).json({ code: 403, message: '无权限' }); return }
    await conn.beginTransaction()
    if (!ids.length) {
      await conn.query('DELETE FROM attendance_participants WHERE project_id=?', [projectId])
    } else {
      const notIn = ids.map(()=>'?').join(',')
      await conn.query(`DELETE FROM attendance_participants WHERE project_id=? AND user_id NOT IN (${notIn})`, [projectId, ...ids])
      const placeholders = ids.map(()=>'(?, ?, "assigned", ?)').join(', ')
      const params = ids.flatMap((uid)=>[projectId, uid, req.user.uid])
      await conn.query(`INSERT INTO attendance_participants(project_id, user_id, source, assigned_by) VALUES ${placeholders} ON DUPLICATE KEY UPDATE source=VALUES(source), assigned_by=VALUES(assigned_by)`, params)
    }
    await conn.commit()
    res.json({ code: 200, message: '参与人已更新', count: ids.length })
  } catch (e) {
    await conn.rollback()
    console.error('replace participants error:', e)
    res.status(400).json({ code: 400, message: String(e.message || '更新失败') })
  } finally {
    await conn.release()
  }
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
  const isAdmin = await isGlobalAdmin(req.user.uid)
  if (!isAdmin) return res.status(403).json({ code: 403, message: '无权限' })
  await pool.query('UPDATE users SET status="inactive" WHERE id=?', [req.params.id])
  res.json({ code: 200, message: '已删除' })
})

app.get('/users/export', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ code: 403, message: '无权限' })
  const { name = '', college = '', year = '', gender = '', group = '', status = '' } = req.query
  const sql = `SELECT DISTINCT u.name,u.student_no,u.gender,CONVERT(c.name USING utf8mb4) AS college,u.join_year FROM users u JOIN colleges c ON c.id=u.college_id LEFT JOIN user_groups m2 ON m2.user_id=u.id AND m2.status='active' LEFT JOIN troupe_groups g2 ON g2.id=m2.group_id WHERE (?='' OR u.name LIKE CONCAT('%',?,'%') OR u.student_no LIKE CONCAT('%',?,'%')) AND (?='' OR c.name LIKE CONCAT('%',?,'%')) AND (?='' OR u.join_year = ?) AND (?='' OR u.gender = ?) AND (?='' OR g2.name LIKE CONCAT('%',?,'%')) AND (?='' OR u.status = ?)`
  const params = [name, name, name, college, college, year, year, gender, gender, group, group, status, status]
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
