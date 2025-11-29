import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'zju_user',
  password: process.env.DB_PASSWORD || 'zju_pass',
  database: process.env.DB_NAME || 'zju_graduate_art_troupe',
  connectionLimit: 10,
  charset: 'UTF8MB4_GENERAL_CI'
})

async function getCollegeId(conn, name) {
  const [rows] = await conn.query('SELECT id FROM colleges WHERE TRIM(name)=TRIM(?) LIMIT 1', [name])
  if (rows.length) return rows[0].id
  await conn.query('INSERT INTO colleges(name) VALUES(?) ON DUPLICATE KEY UPDATE name=VALUES(name)', [name])
  const [rows2] = await conn.query('SELECT id FROM colleges WHERE TRIM(name)=TRIM(?) LIMIT 1', [name])
  return rows2[0]?.id
}

async function run() {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    await conn.query(`UPDATE users u SET role='member' WHERE u.status='active' AND EXISTS (SELECT 1 FROM user_groups m WHERE m.user_id=u.id AND m.status='active' AND m.role IN ('leader','deputy'))`)

    const adminStudentNo = 'SYS_ADMIN_0001'
    const [existRows] = await conn.query('SELECT id FROM users WHERE student_no=? LIMIT 1', [adminStudentNo])
    if (existRows.length) {
      await conn.query(`UPDATE users SET role='admin', status='active' WHERE id=?`, [existRows[0].id])
    } else {
      const collegeId = await getCollegeId(conn, '计算机科学与技术学院')
      const pwdHash = await bcrypt.hash('admin123', 10)
      const nowYear = new Date().getFullYear()
      const [ret] = await conn.query('INSERT INTO users(role,name,gender,birthday,student_no,college_id,phone,join_year,profile_photo_id,status,password_hash) VALUES("admin","系统管理员","male","1990-01-01",?, ?, "13900000000", ?, NULL, "active", ?)', [adminStudentNo, collegeId, nowYear, pwdHash])
    }
    await conn.commit()
    const [countRows] = await conn.query('SELECT COUNT(*) AS admin_cnt FROM users WHERE role="admin"')
    console.log('Admin users:', countRows[0]?.admin_cnt)
  } catch (e) {
    await conn.rollback()
    console.error('Setup roles failed:', e)
    process.exitCode = 1
  } finally {
    await conn.release()
    await pool.end()
  }
}

run()

