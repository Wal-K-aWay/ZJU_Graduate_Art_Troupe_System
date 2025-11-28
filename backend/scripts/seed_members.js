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
  const id = ret.insertId
  if (id) return id
  const [rows2] = await conn.query('SELECT id FROM colleges WHERE TRIM(name)=TRIM(?) LIMIT 1', [name])
  return rows2[0]?.id
}

async function getGroupId(conn, name) {
  const [rows] = await conn.query('SELECT id FROM troupe_groups WHERE TRIM(name)=TRIM(?) LIMIT 1', [name])
  if (rows.length) return rows[0].id
  const [ret] = await conn.query('INSERT INTO troupe_groups(name) VALUES(?) ON DUPLICATE KEY UPDATE name=VALUES(name)', [name])
  const id = ret.insertId
  if (id) return id
  const [rows2] = await conn.query('SELECT id FROM troupe_groups WHERE TRIM(name)=TRIM(?) LIMIT 1', [name])
  return rows2[0]?.id
}

async function run() {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const seedPrefix = 'SEED_MEMBER_'
    const [oldUsers] = await conn.query('SELECT id, student_no FROM users WHERE student_no LIKE CONCAT(?, "%")', [seedPrefix])
    const ids = oldUsers.map(u => u.id)
    if (ids.length) {
      await conn.query(`DELETE FROM user_groups WHERE user_id IN (${ids.map(()=>'?').join(',')})`, ids)
      await conn.query(`DELETE FROM users WHERE id IN (${ids.map(()=>'?').join(',')})`, ids)
    }
    await conn.query('DELETE FROM images WHERE kind="profile" AND filename LIKE "seed_avatar_%"')

    const groupNames = ['总团','主持礼仪分团','舞蹈分团','声乐分团','器乐分团']
    const groupIds = {}
    for (const g of groupNames) { groupIds[g] = await getGroupId(conn, g) }

    const members = [
      { name:'王晨', gender:'male', birthday:'2000-02-18', student_no:'SEED_MEMBER_0001', college:'计算机科学与技术学院', phone:'13988880001', join_year:2018, avatar:true, groups:[{name:'舞蹈分团', role:'member'}] },
      { name:'李雪', gender:'female', birthday:'2001-11-05', student_no:'SEED_MEMBER_0002', college:'软件学院', phone:'13988880002', join_year:2019, avatar:true, groups:[{name:'声乐分团', role:'deputy'}] },
      { name:'赵磊', gender:'male', birthday:'1999-07-30', student_no:'SEED_MEMBER_0003', college:'管理学院', phone:'13988880003', join_year:2017, avatar:false, groups:[{name:'器乐分团', role:'member'}] },
      { name:'周婷', gender:'female', birthday:'2002-03-12', student_no:'SEED_MEMBER_0004', college:'传媒与国际文化学院', phone:'13988880004', join_year:2020, avatar:true, groups:[{name:'主持礼仪分团', role:'member'}] },
      { name:'钱宇', gender:'male', birthday:'2000-12-25', student_no:'SEED_MEMBER_0005', college:'光华法学院', phone:'13988880005', join_year:2018, avatar:false, groups:[{name:'总团', role:'member'},{name:'声乐分团', role:'member'}] },
      { name:'孙悦', gender:'female', birthday:'2003-04-08', student_no:'SEED_MEMBER_0006', college:'艺术与考古学院', phone:'13988880006', join_year:2021, avatar:false, groups:[{name:'舞蹈分团', role:'deputy'}] },
      { name:'吴昊', gender:'male', birthday:'1998-09-19', student_no:'SEED_MEMBER_0007', college:'数学科学学院', phone:'13988880007', join_year:2016, avatar:false, groups:[{name:'器乐分团', role:'leader'}] },
      { name:'郑敏', gender:'female', birthday:'2001-06-01', student_no:'SEED_MEMBER_0008', college:'生命科学学院', phone:'13988880008', join_year:2019, avatar:false, groups:[{name:'总团', role:'deputy'}] },
      { name:'冯凯', gender:'male', birthday:'2004-01-15', student_no:'SEED_MEMBER_0009', college:'医学院', phone:'13988880009', join_year:2022, avatar:false, groups:[{name:'主持礼仪分团', role:'member'}] },
      { name:'谢婧', gender:'female', birthday:'2000-05-22', student_no:'SEED_MEMBER_0010', college:'外国语学院', phone:'13988880010', join_year:2018, avatar:true, groups:[{name:'声乐分团', role:'member'}] },
      { name:'吕航', gender:'male', birthday:'2002-10-02', student_no:'SEED_MEMBER_0011', college:'航空航天学院', phone:'13988880011', join_year:2020, avatar:false, groups:[{name:'器乐分团', role:'member'},{name:'总团', role:'member'}] },
      { name:'何佳', gender:'female', birthday:'2003-08-14', student_no:'SEED_MEMBER_0012', college:'经济学院', phone:'13988880012', join_year:2021, avatar:false, groups:[{name:'舞蹈分团', role:'member'}] }
    ]

    for (const m of members) {
      const collegeId = await getCollegeId(conn, m.college)
      let photoId = null
      if (m.avatar) {
        const buf = Buffer.from('89504E470D0A1A0A0000000D', 'hex')
        const [imgRes] = await conn.query(
          'INSERT INTO images(kind, performance_id, uploader_id, filename, mime_type, size_bytes, data) VALUES("profile", NULL, NULL, ?, ?, ?, ?)',
          [`seed_avatar_${m.student_no}.png`, 'image/png', buf.length, buf]
        )
        photoId = imgRes.insertId
      }
      const [userRes] = await conn.query(
        'INSERT INTO users(role,name,gender,birthday,student_no,college_id,phone,join_year,profile_photo_id,status) VALUES("member",?,?,?,?,?,?,?,? ,"active")',
        [m.name, m.gender, m.birthday, m.student_no, collegeId, m.phone, m.join_year, photoId]
      )
      const uid = userRes.insertId
      for (const g of m.groups) {
        const gid = groupIds[g.name]
        if (!gid) continue
        await conn.query('INSERT INTO user_groups(group_id,user_id,role) VALUES(?,?,?)', [gid, uid, g.role])
      }
    }

    await conn.commit()
    console.log('Seeded members:', members.length)
  } catch (e) {
    await pool.query('ROLLBACK')
    console.error('Seed failed:', e)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

run()

