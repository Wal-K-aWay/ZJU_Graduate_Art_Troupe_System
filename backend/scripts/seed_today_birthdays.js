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

async function getCollegeId(conn, name) {
  const [rows] = await conn.query('SELECT id FROM colleges WHERE TRIM(name)=TRIM(?) LIMIT 1', [name])
  if (rows.length) return rows[0].id
  const [ret] = await conn.query('INSERT INTO colleges(name) VALUES(?) ON DUPLICATE KEY UPDATE name=VALUES(name)', [name])
  if (ret.insertId) return ret.insertId
  const [rows2] = await conn.query('SELECT id FROM colleges WHERE TRIM(name)=TRIM(?) LIMIT 1', [name])
  return rows2[0]?.id
}

async function getGroupId(conn, name) {
  const [rows] = await conn.query('SELECT id FROM troupe_groups WHERE TRIM(name)=TRIM(?) LIMIT 1', [name])
  if (rows.length) return rows[0].id
  const [ret] = await conn.query('INSERT INTO troupe_groups(name) VALUES(?) ON DUPLICATE KEY UPDATE name=VALUES(name)', [name])
  return ret.insertId || (await conn.query('SELECT id FROM troupe_groups WHERE TRIM(name)=TRIM(?) LIMIT 1', [name]))[0]?.[0]?.id
}

async function run() {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const today = new Date()
    const mm = String(today.getMonth()+1).padStart(2,'0')
    const dd = String(today.getDate()).padStart(2,'0')
    const birthday1 = `2001-${mm}-${dd}`
    const birthday2 = `2002-${mm}-${dd}`
    const members = [
      { name:'王新宇', gender:'male', birthday:birthday1, student_no:'SEED_TODAY_BIRTHDAY_0001', college:'软件学院', phone:'13988880101', join_year:2020, groups:[{name:'总团', role:'member'}] },
      { name:'李可欣', gender:'female', birthday:birthday2, student_no:'SEED_TODAY_BIRTHDAY_0002', college:'计算机科学与技术学院', phone:'13988880102', join_year:2021, groups:[{name:'声乐分团', role:'member'}] }
    ]

    const [old] = await conn.query('SELECT id FROM users WHERE student_no IN (?,?)', ['SEED_TODAY_BIRTHDAY_0001','SEED_TODAY_BIRTHDAY_0002'])
    const ids = old.map((x)=>x.id)
    if (ids.length) {
      await conn.query(`DELETE FROM user_groups WHERE user_id IN (${ids.map(()=>'?').join(',')})`, ids)
      await conn.query(`DELETE FROM users WHERE id IN (${ids.map(()=>'?').join(',')})`, ids)
    }

    const gidRoot = await getGroupId(conn, '总团')
    const gidVocal = await getGroupId(conn, '声乐分团')
    const groupIdMap = { '总团': gidRoot, '声乐分团': gidVocal }

    for (const m of members) {
      const collegeId = await getCollegeId(conn, m.college)
      const [uRes] = await conn.query('INSERT INTO users(role,name,gender,birthday,student_no,college_id,phone,join_year,status) VALUES("member",?,?,?,?,?,?,?,"active")', [m.name, m.gender, m.birthday, m.student_no, collegeId, m.phone, m.join_year])
      const uid = uRes.insertId
      for (const g of m.groups) {
        const gid = groupIdMap[g.name] || await getGroupId(conn, g.name)
        await conn.query('INSERT INTO user_groups(group_id,user_id,role) VALUES(?,?,?)', [gid, uid, g.role])
      }
    }

    await conn.commit()
    console.log('Inserted today birthdays:', members.map(m=>m.name).join(', '))
  } catch (e) {
    await pool.query('ROLLBACK')
    console.error('Seed today birthdays failed:', e)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

run()

