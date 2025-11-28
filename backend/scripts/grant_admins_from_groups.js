import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'zju_user',
  password: process.env.DB_PASSWORD || 'zju_pass',
  database: process.env.DB_NAME || 'zju_graduate_art_troupe',
  connectionLimit: 10,
  charset: 'UTF8MB4_GENERAL_CI'
})

async function run() {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    await conn.query(`UPDATE users u SET role='admin' WHERE u.status='active' AND EXISTS (SELECT 1 FROM user_groups m WHERE m.user_id=u.id AND m.status='active' AND m.role IN ('leader','deputy'))`)
    await conn.commit()
    const [rows] = await conn.query(`SELECT COUNT(*) AS cnt FROM users WHERE role='admin'`)
    console.log('Admin count:', rows[0]?.cnt)
  } catch (e) {
    await conn.rollback()
    console.error('Grant admins failed:', e)
    process.exitCode = 1
  } finally {
    await conn.release()
    await pool.end()
  }
}

run()

