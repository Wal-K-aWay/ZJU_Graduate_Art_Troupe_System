import { useEffect, useState } from 'react'
import { api } from '../api'
function TabLink({ id, cur, set }: { id: string; cur: string; set: (v: string)=>void }) {
  return <button className={`tab-link ${cur===id?'active':''}`} onClick={()=>set(id)}>{({today:'今日事项',profile:'个人资料',members:'团员信息',attendance:'考勤',performance:'演出'} as any)[id]}</button>
}
export default function Home() {
  const [cur, setCur] = useState('today')
  const [me, setMe] = useState<any>(null)
useEffect(()=>{ (async()=>{ try { const m = await api.me(); setMe(m) } catch { setMe({}) } })() },[])
  const isAdmin = me?.role === 'admin'
  return (
    <div className="app min-h-full">
      <div className="navbar">
        <div className="brand">浙江大学研究生艺术团管理系统</div>
        <div className="user">{me?.name || '未登录'}</div>
      </div>
      <div className="container">
        <div className="tabs-line">
          <TabLink id="today" cur={cur} set={setCur} />
          <TabLink id="profile" cur={cur} set={setCur} />
          <TabLink id="members" cur={cur} set={setCur} />
          <TabLink id="attendance" cur={cur} set={setCur} />
          <TabLink id="performance" cur={cur} set={setCur} />
        </div>

        {cur==='today' && (
          <div className="panel">
            <div className="title-lg">今日事项</div>
            <div className="date-sub">{new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric' })}</div>

            <div className="section">
              <div className="section-header"><span className="icon-dot icon-red"></span> 今天生日</div>
              <a className="btn-link" href="#">查看全部</a>
            </div>
            <div className="empty-box">今天无人生日</div>

            <div className="section">
              <div className="section-header"><span className="icon-dot icon-purple"></span> 近期演出</div>
              <a className="btn-link" href="#">查看全部</a>
            </div>
            <div className="empty-box">暂无演出安排</div>

            <div className="section">
              <div className="section-header"><span className="icon-dot icon-green"></span> 近期考勤</div>
              <a className="btn-link" href="#">查看全部</a>
            </div>
            <div className="empty-box">今天暂无考勤</div>
          </div>
        )}

        {cur==='profile' && me && (
          <div className="panel">
            <div className="title-lg">个人资料</div>
            <div className="toolbar"><button className="btn-primary" onClick={async()=>{ await api.updateMe(me.id, me) }}>保存修改</button></div>
            <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:'16px', marginTop:'12px' }}>
              <div className="avatar-lg">头像</div>
              <form className="form-grid" onSubmit={e=>e.preventDefault()}>
                <div>
                  <div className="label">姓名</div>
                  <input className="input" value={me.name||''} onChange={e=>setMe({...me,name:e.target.value})} />
                </div>
                <div>
                  <div className="label">学号</div>
                  <input className="input" value={me.student_no||''} disabled />
                </div>
                <div>
                  <div className="label">性别</div>
                  <select className="input" value={me.gender||''} onChange={e=>setMe({...me,gender:e.target.value})}><option value="male">男</option><option value="female">女</option></select>
                </div>
                <div>
                  <div className="label">手机号</div>
                  <input className="input" value={me.phone||''} onChange={e=>setMe({...me,phone:e.target.value})} />
                </div>
                <div className="col-span-2">
                  <div className="label">学院</div>
                  <input className="input" value={me.college||''} onChange={e=>setMe({...me,college:e.target.value})} />
                </div>
                <div>
                  <div className="label">生日</div>
                  <input className="input" value={me.birthday||''} onChange={e=>setMe({...me,birthday:e.target.value})} />
                </div>
                <div>
                  <div className="label">入团年份</div>
                  <input className="input" value={me.join_year||''} onChange={e=>setMe({...me,join_year:e.target.value})} />
                </div>
              </form>
            </div>
          </div>
        )}

        {cur==='members' && (
          <div className="panel">
            <div className="title-lg">团员信息</div>
            {isAdmin ? <MembersAdmin /> : <div className="muted">仅管理员可筛选与导出</div>}
          </div>
        )}

        {cur==='attendance' && (
          <div className="panel">
            <div className="title-lg">考勤</div>
            <div className="section"><div>我的考勤</div></div>
            {isAdmin && <div className="section"><div>考勤管理</div></div>}
          </div>
        )}

        {cur==='performance' && (
          <div className="panel">
            <div className="title-lg">演出</div>
            <div className="section"><div>我的演出</div></div>
            {isAdmin && <div className="section"><div>演出管理</div></div>}
          </div>
        )}
      </div>
    </div>
  )
}

function MembersAdmin() {
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState({ name:'', college:'', year:'', gender:'' })
  async function load() { const params = new URLSearchParams(q as any); const list = await api.listUsers(params); setRows(list) }
  useEffect(()=>{ load() },[])
  return (
    <div>
      <div className="grid grid-cols-5 gap-3 mb-3">
        <input className="h-10 border rounded-lg px-3" placeholder="搜索姓名或学号" value={q.name} onChange={e=>setQ({...q,name:e.target.value})} />
        <input className="h-10 border rounded-lg px-3" placeholder="选择学院" value={q.college} onChange={e=>setQ({...q,college:e.target.value})} />
        <input className="h-10 border rounded-lg px-3" placeholder="入团年份" value={q.year} onChange={e=>setQ({...q,year:e.target.value})} />
        <select className="h-10 border rounded-lg px-3" value={q.gender} onChange={e=>setQ({...q,gender:e.target.value})}><option value="">性别</option><option value="male">男</option><option value="female">女</option></select>
        <div className="flex gap-2">
          <button className="h-10 px-4 bg-blue-500 text-white rounded-lg" onClick={load}>筛选</button>
          <a className="h-10 px-4 bg-blue-100 text-blue-700 rounded-lg flex items-center" href={api.exportUsersUrl(new URLSearchParams(q as any))} target="_blank">导出CSV</a>
        </div>
      </div>
      <table className="table">
        <thead><tr><th>头像</th><th>姓名</th><th>学号</th><th>性别</th><th>学院</th><th>入团年份</th></tr></thead>
        <tbody>
          {rows.map(u=> (
            <tr key={u.id}><td>{u.profile_photo_id?'🖼️':''}</td><td>{u.name}</td><td>{u.student_no}</td><td><span className="badge">{u.gender==='male'?'男':'女'}</span></td><td>{u.college}</td><td>{u.join_year}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
