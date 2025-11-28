import mysql from 'mysql2/promise'
import mysql2 from 'mysql2'

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'zju_user',
    password: process.env.DB_PASSWORD || 'zju_pass',
    database: process.env.DB_NAME || 'zju_graduate_art_troupe',
    connectionLimit: 4,
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
  try {
    const [rows] = await pool.query('SELECT m.user_id, CONVERT(g.name USING utf8mb4) AS group_name, m.role, m.status FROM user_groups m JOIN troupe_groups g ON g.id=m.group_id ORDER BY m.user_id, g.name')
    console.log(JSON.stringify(rows, null, 2))
  } finally {
    await pool.end()
  }
}

main().catch(e=>{ console.error('ERROR', e.message || e) ; process.exit(1) })

