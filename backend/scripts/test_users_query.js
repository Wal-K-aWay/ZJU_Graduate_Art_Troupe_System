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
  const name = ''
  const college = ''
  const year = ''
  const gender = ''
  const sql = `SELECT 
    u.id,
    u.name,
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
  WHERE (?='' OR u.name LIKE CONCAT('%',?,'%') OR u.student_no LIKE CONCAT('%',?,'%'))
    AND (?='' OR c.name LIKE CONCAT('%',?,'%'))
    AND (?='' OR u.join_year = ?)
    AND (?='' OR u.gender = ?)`
  const params = [name, name, name, college, college, year, year, gender, gender]
  const [rows] = await pool.query(sql, params)
  console.log(rows)
  await pool.end()
}

main().catch(e=>{ console.error(e); process.exit(1) })
