import mysql from 'mysql2/promise'

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a) => { const i = a.indexOf('='); if (i>0) acc.push([a.slice(0,i).replace(/^--/, ''), a.slice(i+1)]); return acc }, []))
  const student = args.student || args.s || ''
  const group = args.group || args.g || ''
  const role = (args.role || args.r || 'member')
  const roles = new Set(['leader','deputy','member'])
  if (!roles.has(role)) { console.error('invalid role, use leader/deputy/member'); process.exit(1) }
  if (!student || !group) { console.error('usage: node assign_group.js --student=<student_no> --group=<group_name>'); process.exit(1) }
  const conn = await mysql.createConnection({ host: process.env.DB_HOST||'127.0.0.1', port: Number(process.env.DB_PORT||3306), user: process.env.DB_USER||'zju_user', password: process.env.DB_PASSWORD||'zju_pass', database: process.env.DB_NAME||'zju_graduate_art_troupe', charset: 'utf8mb4' })
  try {
    await conn.beginTransaction()
    const [urows] = await conn.query('SELECT id FROM users WHERE student_no=? LIMIT 1', [student])
    if (!urows.length) throw new Error('user_not_found')
    const uid = urows[0].id
    let [grows] = await conn.query('SELECT id FROM troupe_groups WHERE name=? LIMIT 1', [group])
    if (!grows.length) { const [r] = await conn.query('INSERT INTO troupe_groups(name) VALUES(?)', [group]); grows = [{ id: r.insertId }] }
    const gid = grows[0].id
    await conn.query('INSERT INTO user_groups(group_id,user_id,role,status) VALUES(?, ?, ?, "active") ON DUPLICATE KEY UPDATE role=VALUES(role), status="active", left_at=NULL', [gid, uid, role])
    await conn.commit()
    const [verify] = await conn.query('SELECT CONVERT(g.name USING utf8mb4) AS name, m.role, m.status FROM user_groups m JOIN troupe_groups g ON g.id=m.group_id WHERE m.user_id=? ORDER BY g.name', [uid])
    console.log(JSON.stringify({ ok: true, user_id: uid, group_id: gid, memberships: verify }))
  } catch (e) {
    try { await conn.rollback() } catch {}
    console.error(JSON.stringify({ ok: false, error: String(e.message||e) }))
    process.exit(2)
  } finally {
    await conn.end()
  }
}

main()
