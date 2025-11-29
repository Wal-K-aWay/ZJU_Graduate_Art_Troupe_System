import { useEffect, useState } from 'react'
import { api } from '../../api'
export default function MembersAdmin({ isAdmin = false }: { isAdmin?: boolean }) {
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState({ name:'', college:'', year:'', gender:'', group:'', status:'' })
  const [colleges, setColleges] = useState<string[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [me, setMe] = useState<any>(null)
  const [myLeaderGroups, setMyLeaderGroups] = useState<number[]>([])
  useEffect(()=>{ (async()=>{ try { const list = await api.colleges(); setColleges(list.map((x:any)=>x.name||x)) } catch { setColleges([]) } })() },[])
  useEffect(()=>{ (async()=>{ try { const list = await api.groups(); const names = list.map((x:any)=>x.name||x); const seen = new Set<string>(); const filtered = names.filter((n:string)=>{ const ok = typeof n==='string' && (n.includes('分团') || n.includes('总团')); if (!ok) return false; if (seen.has(n)) return false; seen.add(n); return true; }); setGroups(filtered) } catch { setGroups([]) } })() },[])
  useEffect(()=>{ (async()=>{ try { const m = await api.me(); setMe(m); const gs = await api.userGroups(m.id); const leaderIds = Array.isArray(gs) ? gs.filter((g:any)=> ['leader','deputy'].includes(String(g.role||'')) && String(g.status||'')==='active').map((g:any)=> Number(g.id)).filter((n)=> Number.isFinite(n)) : []; setMyLeaderGroups(leaderIds) } catch { setMyLeaderGroups([]) } })() },[])
  async function load() { try { const params = new URLSearchParams(q as any); const list = await api.listUsers(params); let arr = Array.isArray(list)?list:[]; if (q.group) { arr = arr.filter((u:any)=>{ const gs = Array.isArray(u.groups_json) ? u.groups_json : (typeof u.groups_json === 'string' ? JSON.parse(u.groups_json||'[]') : []); return gs.some((g:any)=> String(g?.name||'').includes(q.group)) }) } setRows(arr) } catch { setRows([]) } }
  useEffect(()=>{ load() },[])
  const [editing, setEditing] = useState<any|null>(null)
  const [edit, setEdit] = useState<any>({})
  const [confirmDel, setConfirmDel] = useState<any|null>(null)
  function canOperate(u: any) { const gs = Array.isArray(u.groups_json) ? u.groups_json : (typeof u.groups_json === 'string' ? JSON.parse(u.groups_json||'[]') : []); const userGroupIds = Array.isArray(gs) ? gs.map((g:any)=> Number(g?.id)).filter((n)=> Number.isFinite(n)) : []; return myLeaderGroups.some((gid)=> userGroupIds.includes(gid)) }
  function startEdit(u: any) { if (!canOperate(u)) return; setEditing(u); setEdit({ id:u.id, name:u.name, gender:u.gender, college:u.college, join_year:u.join_year, phone:'', birthday:'', status:String(u.status||'') }) }
  async function saveEdit() { if (!editing) return; await api.updateMe(edit.id, edit); setEditing(null); await load() }
  async function delUser(u: any) { if (!canOperate(u)) return; setConfirmDel({ id: u.id, name: u.name }) }
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const total = rows.length
  const maxPage = Math.max(1, Math.ceil(total / pageSize))
  const start = (page-1) * pageSize
  const end = Math.min(total, start + pageSize)
  const viewRows = rows.slice(start, end)
  const now = new Date().getFullYear(); const yearOpts = Array.from({length: now-2013}, (_,i)=>String(2014+i))
  return (
    <div>
      <div className="filter-box">
        <div className="grid grid-cols-12 gap-3">
          <input className="h-10 border rounded-lg px-3 col-span-2" placeholder="搜索姓名或学号" value={q.name} onChange={e=>setQ({...q,name:e.target.value})} />
          <select className="h-10 border rounded-lg px-3 col-span-3" value={q.college} onChange={e=>setQ({...q,college:e.target.value})} style={{ color: q.college ? '#0f172a' : '#9ca3af' }}>
            <option value="">选择学院</option>
            {colleges.map((n)=> <option key={n} value={n}>{n}</option>)}
          </select>
          <select className="h-10 border rounded-lg px-3 col-span-2" value={q.group} onChange={e=>setQ({...q,group:e.target.value})} style={{ color: q.group ? '#0f172a' : '#9ca3af' }}>
            <option value="">选择分团</option>
            {groups.map((n)=> <option key={n} value={n}>{n}</option>)}
          </select>
          <select className="h-10 border rounded-lg px-3 col-span-1" value={q.year} onChange={e=>setQ({...q,year:e.target.value})} style={{ color: q.year ? '#0f172a' : '#9ca3af' }}>
            <option value="">入团年份</option>
            {yearOpts.map(v=> <option key={v} value={v}>{v}</option>)}
          </select>
          <select className="h-10 border rounded-lg px-3 col-span-1" value={q.gender} onChange={e=>setQ({...q,gender:e.target.value})} style={{ color: q.gender ? '#0f172a' : '#9ca3af' }}><option value="">性别</option><option value="male">男</option><option value="female">女</option></select>
          <select className="h-10 border rounded-lg px-3 col-span-1" value={q.status} onChange={e=>setQ({...q,status:e.target.value})} style={{ color: q.status ? '#0f172a' : '#9ca3af' }}>
            <option value="">是否在团</option>
            <option value="active">在团</option>
            <option value="inactive">不在团</option>
          </select>
          <div className="flex gap-2 justify-end items-center col-span-2">
            <button className="h-10 px-4 bg-blue-500 text-white rounded-lg" onClick={()=>{ setPage(1); load() }}><span className="btn-icon save-icon"/>筛选</button>
            {isAdmin && (
              <a className="h-10 px-4 bg-blue-100 text-blue-700 rounded-lg flex items-center" href={api.exportUsersUrl(new URLSearchParams(q as any))} target="_blank">导出CSV</a>
            )}
          </div>
        </div>
      </div>
      <table className="table">
        <colgroup>
          {(myLeaderGroups.length>0) ? (
            <>
              <col style={{ width: '6%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '12%' }} />
            </>
          ) : (
            <>
              <col style={{ width: '6%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '19%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '10%' }} />
            </>
          )}
        </colgroup>
        <thead><tr><th>头像</th><th>姓名</th><th>学号</th><th>性别</th><th>学院</th><th>所属分团</th><th>状态</th><th>入团年份</th>{(myLeaderGroups.length>0) && <th>操作</th>}</tr></thead>
        <tbody>
          {viewRows.map(u=> (
            <tr key={u.id}>
              <td>{u.profile_photo_id ? (<img className="avatar-sm-img" src={api.imageUrl(u.profile_photo_id)} alt="头像" />) : (<span className="avatar-sm" />)}</td>
              <td>{u.name}</td>
              <td>{u.student_no}</td>
              <td><span className="badge">{u.gender==='male'?'男':'女'}</span></td>
              <td>{u.college}</td>
              <td>
                <div className="chips">
                  {(()=>{ const gs = Array.isArray(u.groups_json) ? u.groups_json : (typeof u.groups_json === 'string' ? JSON.parse(u.groups_json||'[]') : []); return gs && gs.length ? gs.map((g:any, i:number)=> <span key={i} className="badge">{g.name}{g.role==='leader'?'（团长）':(g.role==='deputy'?'（副团长）':'')}</span>) : <span className="muted">暂无分团</span> })()}
                </div>
              </td>
              <td><span className="badge">{(String(u.status||'').trim()==='active')?'在团':''}</span></td>
              <td><span className="badge">{u.join_year ? `${u.join_year}年` : ''}</span></td>
              {(myLeaderGroups.length>0) && <td>{canOperate(u) ? (<div className="flex gap-2"><button className="btn-text" onClick={()=>startEdit(u)}>编辑</button><button className="btn-text" onClick={()=>delUser(u)}>删除</button></div>) : null}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <span className="muted">第 {total? start+1:0}-{end} 条，共 {total} 条</span>
        <button className="pager-btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>上一页</button>
        <button className="pager-btn" onClick={()=>setPage(p=>Math.min(maxPage,p+1))} disabled={page>=maxPage}>下一页</button>
        <select className="pager-input" value={pageSize} onChange={e=>{ const v = Number(e.target.value); setPageSize(v); setPage(1) }}>
          <option value={10}>10 条/页</option>
          <option value={20}>20 条/页</option>
          <option value={50}>50 条/页</option>
        </select>
        <input className="pager-input" style={{ width:'56px' }} value={page} onChange={e=>{ const v = Math.max(1, Math.min(maxPage, Number(e.target.value||1))); setPage(v) }} />
      </div>
      {(myLeaderGroups.length>0) && editing && (
        <div style={{ position:'fixed', inset:'0', background:'rgba(0,0,0,0.25)', zIndex:50 }} onClick={()=>setEditing(null)}>
          <div className="panel card-form" style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', maxWidth:'640px', width:'calc(100% - 40px)' }} onClick={e=>e.stopPropagation()}>
            <div className="title-lg">编辑团员</div>
            <div className="form-grid">
              <div>
                <div className="label">姓名</div>
                <input className="input" value={edit.name||''} onChange={e=>setEdit({...edit,name:e.target.value})} />
              </div>
              <div>
                <div className="label">性别</div>
                <select className="input" value={edit.gender||''} onChange={e=>setEdit({...edit,gender:e.target.value})}><option value="male">男</option><option value="female">女</option></select>
              </div>
              <div className="col-span-2">
                <div className="label">学院</div>
                <input className="input" value={edit.college||''} onChange={e=>setEdit({...edit,college:e.target.value})} />
              </div>
              <div>
                <div className="label">入团年份</div>
                <input className="input" value={edit.join_year||''} onChange={e=>setEdit({...edit,join_year:e.target.value})} />
              </div>
              <div>
                <div className="label">手机号</div>
                <input className="input" value={edit.phone||''} onChange={e=>setEdit({...edit,phone:e.target.value})} />
              </div>
              <div>
                <div className="label">是否在团</div>
                <select className="input" value={edit.status||''} onChange={e=>setEdit({...edit,status:e.target.value})}><option value="active">在团</option><option value="inactive">不在团</option></select>
              </div>
            </div>
            <div className="toolbar" style={{ marginTop:'12px', display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button className="btn-primary" onClick={saveEdit}>保存</button>
              <button className="btn-text" onClick={()=>setEditing(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
      {(myLeaderGroups.length>0) && confirmDel && (
        <div style={{ position:'fixed', inset:'0', background:'rgba(0,0,0,0.25)', zIndex:60 }}>
          <div className="panel card-form" style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', maxWidth:'420px', width:'calc(100% - 40px)' }}>
            <div className="title-lg">确认删除</div>
            <div className="subtitle" style={{ textAlign:'left' }}>确定删除该团员{confirmDel.name ? `（${confirmDel.name}）` : ''}？此操作不可恢复。</div>
            <div className="toolbar" style={{ marginTop:'12px', display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button className="btn-primary" onClick={async()=>{ await api.deleteUser(confirmDel.id); setConfirmDel(null); await load() }}>删除</button>
              <button className="btn-text" onClick={()=>setConfirmDel(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
