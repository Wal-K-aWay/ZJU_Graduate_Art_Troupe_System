import { useEffect, useState } from 'react'
import { api } from '../../api'
export default function Attendance({ isAdmin }: { isAdmin: boolean }) {
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', location: '', time: '' })
  const [rows, setRows] = useState<any[]>([])
  const [editing, setEditing] = useState<any|null>(null)
  const [edit, setEdit] = useState({ id: 0, title:'', location:'', time:'', status:'' })
  const [eq, setEq] = useState({ name:'', college:'', year:'', gender:'', group:'' })
  const [eCandidates, setECandidates] = useState<any[]>([])
  const [eSelectedIds, setESelectedIds] = useState<number[]>([])
  const [eSelectedUsers, setESelectedUsers] = useState<any[]>([])
  const [confirmDel, setConfirmDel] = useState<any|null>(null)
  const [q, setQ] = useState({ name:'', college:'', year:'', gender:'', group:'' })
  const [colleges, setColleges] = useState<string[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [selectedUsers, setSelectedUsers] = useState<any[]>([])
  async function load() { try { const list = await api.listAttendanceProjects(); setRows(Array.isArray(list)?list:[]) } catch { setRows([]) } }
  useEffect(()=>{ if (isAdmin) load() },[isAdmin])
  useEffect(()=>{ (async()=>{ try { const list = await api.colleges(); setColleges(list.map((x:any)=>x.name||x)) } catch { setColleges([]) } })() },[])
  useEffect(()=>{ (async()=>{ try { const list = await api.groups(); const names = list.map((x:any)=>x.name||x); const seen = new Set<string>(); const filtered = names.filter((n:string)=>{ const ok = typeof n==='string' && (n.includes('分团') || n.includes('总团')); if (!ok) return false; if (seen.has(n)) return false; seen.add(n); return true; }); setGroups(filtered) } catch { setGroups([]) } })() },[])
  async function loadCandidates() {
    try {
      const params = new URLSearchParams(q as any)
      const list = await api.listUsers(params)
      let arr = Array.isArray(list)?list:[]
      if (q.group) { arr = arr.filter((u:any)=>{ const gs = Array.isArray(u.groups_json) ? u.groups_json : (typeof u.groups_json === 'string' ? JSON.parse(u.groups_json||'[]') : []); return gs.some((g:any)=> String(g?.name||'').includes(q.group)) }) }
      setCandidates(arr)
    } catch { setCandidates([]) }
  }
  async function submit() {
    if (!form.title || !form.location || !form.time) return
    const r = await api.createAttendanceProject(form)
    const id = r?.id
    if (id && selectedIds.length) { try { await api.assignAttendanceParticipants(id, selectedIds) } catch (e:any) { alert(`分配参与人失败：${String(e?.message||e)}`) } }
    setShowCreate(false)
    setForm({ title:'', location:'', time:'' })
    setSelectedIds([])
    setSelectedUsers([])
    await load()
  }
  return (
    <div className="content">
      <div className="hero-box">
        <div className="title-wrap title-gap-lg"><span className="attendance-icon"/><div className="title-md">考勤</div></div>
        <div className="sub-sections">
          <div className="block">
            <div className="section-head"><div className="section-header"><span className="section-icon icon-clock-a"></span> 我的考勤</div><a className="btn-link" href="#">查看全部</a></div>
            <div className="empty-box"><span className="empty-icon"/>今天暂无考勤事项</div>
          </div>
          {isAdmin && (
            <div className="block">
              <div className="section-head">
                <div className="section-header"><span className="section-icon icon-clock-b"></span> 考勤管理</div>
                <button className="btn-primary btn-slim" onClick={()=>setShowCreate(true)}><span className="btn-icon edit-icon"/>发起考勤</button>
              </div>
              {rows && rows.length ? (
                <table className="table">
                  <colgroup><col style={{width:'22%'}}/><col style={{width:'22%'}}/><col style={{width:'34%'}}/><col style={{width:'12%'}}/><col style={{width:'10%'}}/></colgroup>
                  <thead><tr><th>时间</th><th>地点</th><th>内容</th><th>状态</th><th>操作</th></tr></thead>
                  <tbody>
                    {rows.map((r:any)=>(
                      <tr key={r.id}>
                        <td>{r.start_time}</td>
                        <td>{r.location}</td>
                        <td>{r.title}</td>
                        <td><span className="badge">{r.status}</span></td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn-text" onClick={async()=>{ setEditing(r); setEdit({ id:r.id, title:r.title||'', location:r.location||'', time:(r.start_time||'').replace(' ','T'), status:r.status||'open' }); try { const ps = await api.getAttendanceParticipants(r.id); const arr = Array.isArray(ps)?ps:[]; setESelectedUsers(arr); setESelectedIds(arr.map((u:any)=>u.id)); } catch { setESelectedUsers([]); setESelectedIds([]) } }}>编辑</button>
                            <button className="btn-text" onClick={()=> setConfirmDel({ id: r.id, title: r.title })}>删除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-box"><span className="empty-icon"/>暂无管理事项</div>
              )}
            </div>
          )}
        </div>
      </div>
      {isAdmin && showCreate && (
        <div style={{ position:'fixed', inset:'0', background:'rgba(0,0,0,0.25)', zIndex:50 }}>
          <div className="panel card-form" style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', maxWidth:'960px', width:'calc(100% - 40px)' }}>
            <div className="title-lg">发起考勤</div>
            <div className="form-grid">
              <div>
                <div className="label"><span className="req">*</span>考勤时间</div>
                <input className="input" type="datetime-local" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} />
              </div>
              <div>
                <div className="label"><span className="req">*</span>考勤地点</div>
                <input className="input" placeholder="请输入地点" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} />
              </div>
              <div className="col-span-2">
                <div className="label"><span className="req">*</span>内容</div>
                <input className="input" placeholder="请输入内容" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
              </div>
            </div>
            <div className="filter-box" style={{ marginTop:'12px' }}>
              <div className="grid grid-cols-6 gap-3">
                <input className="h-10 border rounded-lg px-3" placeholder="搜索姓名或学号" value={q.name} onChange={e=>setQ({...q,name:e.target.value})} />
                <select className="h-10 border rounded-lg px-3" value={q.college} onChange={e=>setQ({...q,college:e.target.value})} style={{ color: q.college ? '#0f172a' : '#9ca3af' }}>
                  <option value="">选择学院</option>
                  {colleges.map((n)=> <option key={n} value={n}>{n}</option>)}
                </select>
                <select className="h-10 border rounded-lg px-3" value={q.group} onChange={e=>setQ({...q,group:e.target.value})} style={{ color: q.group ? '#0f172a' : '#9ca3af' }}>
                  <option value="">选择分团</option>
                  {groups.map((n)=> <option key={n} value={n}>{n}</option>)}
                </select>
                <select className="h-10 border rounded-lg px-3" value={q.year} onChange={e=>setQ({...q,year:e.target.value})} style={{ color: q.year ? '#0f172a' : '#9ca3af' }}>
                  <option value="">入团年份</option>
                  {Array.from({length: new Date().getFullYear()-2013}, (_,i)=>String(2014+i)).map(v=> <option key={v} value={v}>{v}</option>)}
                </select>
                <select className="h-10 border rounded-lg px-3" value={q.gender} onChange={e=>setQ({...q,gender:e.target.value})} style={{ color: q.gender ? '#0f172a' : '#9ca3af' }}>
                  <option value="">性别</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
                <div className="flex gap-2 justify-end">
                  <button className="h-10 px-4 bg-blue-500 text-white rounded-lg" onClick={loadCandidates}>筛选</button>
                </div>
              </div>
            </div>
            <table className="table">
              <colgroup><col style={{width:'6%'}}/><col style={{width:'10%'}}/><col style={{width:'16%'}}/><col style={{width:'8%'}}/><col style={{width:'18%'}}/><col style={{width:'32%'}}/><col style={{width:'10%'}}/></colgroup>
              <thead>
                <tr>
                  <th><input type="checkbox" checked={candidates.length>0 && candidates.every((u:any)=>selectedIds.includes(u.id))} onChange={e=>{ const on = e.target.checked; setSelectedIds(prev=>{ const s = new Set(prev); if (on) { for (const u of candidates) s.add(u.id) } else { for (const u of candidates) s.delete(u.id) } return Array.from(s) }); setSelectedUsers(prev=>{ const map = new Map(prev.map((x:any)=>[x.id,x])); if (on) { for (const u of candidates) { map.set(u.id, u) } } else { for (const u of candidates) { map.delete(u.id) } } return Array.from(map.values()) }) }} /></th>
                  <th>姓名</th>
                  <th>学号</th>
                  <th>性别</th>
                  <th>学院</th>
                  <th>所属分团</th>
                  <th>入团年份</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((u:any)=>(
                  <tr key={u.id}>
                    <td><input type="checkbox" checked={selectedIds.includes(u.id)} onChange={e=>{ const on = e.target.checked; setSelectedIds((prev)=>{ const s = new Set(prev); if (on) s.add(u.id); else s.delete(u.id); return Array.from(s) }); setSelectedUsers(prev=>{ const map = new Map(prev.map((x:any)=>[x.id,x])); if (on) map.set(u.id, u); else map.delete(u.id); return Array.from(map.values()) }) }} /></td>
                    <td>{u.name}</td>
                    <td>{u.student_no}</td>
                    <td><span className="badge">{u.gender==='male'?'男':'女'}</span></td>
                    <td>{u.college}</td>
                    <td>
                      <div className="chips">
                        {(()=>{ const gs = Array.isArray(u.groups_json) ? u.groups_json : (typeof u.groups_json === 'string' ? JSON.parse(u.groups_json||'[]') : []); return gs && gs.length ? gs.map((g:any, i:number)=> <span key={i} className="badge">{g.name}{g.role==='leader'?'（团长）':(g.role==='deputy'?'（副团长）':'')}</span>) : <span className="muted">暂无分团</span> })()}
                      </div>
                    </td>
                    <td><span className="badge">{u.join_year ? `${u.join_year}年` : ''}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="muted" style={{ marginTop:'8px' }}>已选择 {selectedIds.length} 人</div>
            {selectedUsers.length>0 && (
              <div className="block" style={{ marginTop:'12px' }}>
                <div className="section-head"><div className="section-header">已选择人员</div></div>
                <table className="table">
                  <colgroup><col style={{width:'10%'}}/><col style={{width:'16%'}}/><col style={{width:'8%'}}/><col style={{width:'18%'}}/><col style={{width:'38%'}}/><col style={{width:'10%'}}/></colgroup>
                  <thead><tr><th>姓名</th><th>学号</th><th>性别</th><th>学院</th><th>所属分团</th><th>操作</th></tr></thead>
                  <tbody>
                    {selectedUsers.map((u:any)=>(
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.student_no}</td>
                        <td><span className="badge">{u.gender==='male'?'男':'女'}</span></td>
                        <td>{u.college}</td>
                        <td>
                          <div className="chips">
                            {(()=>{ const gs = Array.isArray(u.groups_json) ? u.groups_json : (typeof u.groups_json === 'string' ? JSON.parse(u.groups_json||'[]') : []); return gs && gs.length ? gs.map((g:any, i:number)=> <span key={i} className="badge">{g.name}{g.role==='leader'?'（团长）':(g.role==='deputy'?'（副团长）':'')}</span>) : <span className="muted">暂无分团</span> })()}
                          </div>
                        </td>
                        <td><button className="btn-text" onClick={()=>{ setSelectedIds(prev=>prev.filter(id=>id!==u.id)); setSelectedUsers(prev=>prev.filter(x=>x.id!==u.id)) }}>移除</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="toolbar" style={{ marginTop:'12px', display:'flex', gap:'8px' }}>
              <button className="btn-primary" onClick={submit}><span className="btn-icon save-icon"/>创建</button>
              <button className="btn-text" onClick={()=>setShowCreate(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
      {isAdmin && editing && (
        <div style={{ position:'fixed', inset:'0', background:'rgba(0,0,0,0.25)', zIndex:50 }}>
          <div className="panel card-form" style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', maxWidth:'960px', width:'calc(100% - 40px)' }}>
            <div className="title-lg">编辑考勤</div>
            <div className="form-grid">
              <div>
                <div className="label"><span className="req">*</span>考勤时间</div>
                <input className="input" type="datetime-local" value={edit.time} onChange={e=>setEdit({...edit,time:e.target.value})} />
              </div>
              <div>
                <div className="label"><span className="req">*</span>考勤地点</div>
                <input className="input" placeholder="请输入地点" value={edit.location} onChange={e=>setEdit({...edit,location:e.target.value})} />
              </div>
              <div className="col-span-2">
                <div className="label"><span className="req">*</span>内容</div>
                <input className="input" placeholder="请输入内容" value={edit.title} onChange={e=>setEdit({...edit,title:e.target.value})} />
              </div>
            </div>
            <div className="filter-box" style={{ marginTop:'12px' }}>
              <div className="grid grid-cols-6 gap-3">
                <input className="h-10 border rounded-lg px-3" placeholder="搜索姓名或学号" value={eq.name} onChange={e=>setEq({...eq,name:e.target.value})} />
                <select className="h-10 border rounded-lg px-3" value={eq.college} onChange={e=>setEq({...eq,college:e.target.value})} style={{ color: eq.college ? '#0f172a' : '#9ca3af' }}>
                  <option value="">选择学院</option>
                  {colleges.map((n)=> <option key={n} value={n}>{n}</option>)}
                </select>
                <select className="h-10 border rounded-lg px-3" value={eq.group} onChange={e=>setEq({...eq,group:e.target.value})} style={{ color: eq.group ? '#0f172a' : '#9ca3af' }}>
                  <option value="">选择分团</option>
                  {groups.map((n)=> <option key={n} value={n}>{n}</option>)}
                </select>
                <select className="h-10 border rounded-lg px-3" value={eq.year} onChange={e=>setEq({...eq,year:e.target.value})} style={{ color: eq.year ? '#0f172a' : '#9ca3af' }}>
                  <option value="">入团年份</option>
                  {Array.from({length: new Date().getFullYear()-2013}, (_,i)=>String(2014+i)).map(v=> <option key={v} value={v}>{v}</option>)}
                </select>
                <select className="h-10 border rounded-lg px-3" value={eq.gender} onChange={e=>setEq({...eq,gender:e.target.value})} style={{ color: eq.gender ? '#0f172a' : '#9ca3af' }}>
                  <option value="">性别</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
                <div className="flex gap-2 justify-end">
                  <button className="h-10 px-4 bg-blue-500 text-white rounded-lg" onClick={async()=>{ try { const params = new URLSearchParams(eq as any); const list = await api.listUsers(params); let arr = Array.isArray(list)?list:[]; if (eq.group) { arr = arr.filter((u:any)=>{ const gs = Array.isArray(u.groups_json) ? u.groups_json : (typeof u.groups_json === 'string' ? JSON.parse(u.groups_json||'[]') : []); return gs.some((g:any)=> String(g?.name||'').includes(eq.group)) }) } setECandidates(arr) } catch { setECandidates([]) } }}>筛选</button>
                </div>
              </div>
            </div>
            {eCandidates && eCandidates.length>0 && (
              <table className="table">
                <colgroup><col style={{width:'6%'}}/><col style={{width:'10%'}}/><col style={{width:'16%'}}/><col style={{width:'8%'}}/><col style={{width:'18%'}}/><col style={{width:'32%'}}/><col style={{width:'10%'}}/></colgroup>
                <thead>
                  <tr>
                    <th><input type="checkbox" checked={eCandidates.length>0 && eCandidates.every((u:any)=>eSelectedIds.includes(u.id))} onChange={e=>{ const on = e.target.checked; setESelectedIds(prev=>{ const s = new Set(prev); if (on) { for (const u of eCandidates) s.add(u.id) } else { for (const u of eCandidates) s.delete(u.id) } return Array.from(s) }); setESelectedUsers(prev=>{ const map = new Map(prev.map((x:any)=>[x.id,x])); if (on) { for (const u of eCandidates) { map.set(u.id, u) } } else { for (const u of eCandidates) { map.delete(u.id) } } return Array.from(map.values()) }) }} /></th>
                    <th>姓名</th>
                    <th>学号</th>
                    <th>性别</th>
                    <th>学院</th>
                    <th>所属分团</th>
                    <th>入团年份</th>
                  </tr>
                </thead>
                <tbody>
                  {eCandidates.map((u:any)=>(
                    <tr key={u.id}>
                      <td><input type="checkbox" checked={eSelectedIds.includes(u.id)} onChange={e=>{ const on = e.target.checked; setESelectedIds((prev)=>{ const s = new Set(prev); if (on) s.add(u.id); else s.delete(u.id); return Array.from(s) }); setESelectedUsers(prev=>{ const map = new Map(prev.map((x:any)=>[x.id,x])); if (on) map.set(u.id, u); else map.delete(u.id); return Array.from(map.values()) }) }} /></td>
                      <td>{u.name}</td>
                      <td>{u.student_no}</td>
                      <td><span className="badge">{u.gender==='male'?'男':'女'}</span></td>
                      <td>{u.college}</td>
                      <td>
                        <div className="chips">
                          {(()=>{ const gs = Array.isArray(u.groups_json) ? u.groups_json : (typeof u.groups_json === 'string' ? JSON.parse(u.groups_json||'[]') : []); return gs && gs.length ? gs.map((g:any, i:number)=> <span key={i} className="badge">{g.name}{g.role==='leader'?'（团长）':(g.role==='deputy'?'（副团长）':'')}</span>) : <span className="muted">暂无分团</span> })()}
                        </div>
                      </td>
                      <td><span className="badge">{u.join_year ? `${u.join_year}年` : ''}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="muted" style={{ marginTop:'8px' }}>已选择 {eSelectedIds.length} 人</div>
            {eSelectedUsers.length>0 && (
              <div className="block" style={{ marginTop:'12px' }}>
                <div className="section-head"><div className="section-header">已选择人员</div></div>
                <table className="table">
                  <colgroup><col style={{width:'10%'}}/><col style={{width:'16%'}}/><col style={{width:'8%'}}/><col style={{width:'18%'}}/><col style={{width:'38%'}}/><col style={{width:'10%'}}/></colgroup>
                  <thead><tr><th>姓名</th><th>学号</th><th>性别</th><th>学院</th><th>所属分团</th><th>操作</th></tr></thead>
                  <tbody>
                    {eSelectedUsers.map((u:any)=>(
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.student_no}</td>
                        <td><span className="badge">{u.gender==='male'?'男':'女'}</span></td>
                        <td>{u.college}</td>
                        <td>
                          <div className="chips">
                            {(()=>{ const gs = Array.isArray(u.groups_json) ? u.groups_json : (typeof u.groups_json === 'string' ? JSON.parse(u.groups_json||'[]') : []); return gs && gs.length ? gs.map((g:any, i:number)=> <span key={i} className="badge">{g.name}{g.role==='leader'?'（团长）':(g.role==='deputy'?'（副团长）':'')}</span>) : <span className="muted">暂无分团</span> })()}
                          </div>
                        </td>
                        <td><button className="btn-text" onClick={()=>{ setESelectedIds(prev=>prev.filter(id=>id!==u.id)); setESelectedUsers(prev=>prev.filter(x=>x.id!==u.id)) }}>移除</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="toolbar" style={{ marginTop:'12px', display:'flex', gap:'8px' }}>
              <button className="btn-primary" onClick={async()=>{ await api.updateAttendanceProject(edit.id, { title: edit.title, location: edit.location, time: edit.time, status: edit.status }); try { await api.replaceAttendanceParticipants(edit.id, eSelectedIds) } catch (e:any) { alert(`更新参与人失败：${String(e?.message||e)}`) } setEditing(null); setESelectedIds([]); setESelectedUsers([]); await load() }}><span className="btn-icon save-icon"/>保存</button>
              <button className="btn-text" onClick={()=>setEditing(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
      {isAdmin && confirmDel && (
        <div style={{ position:'fixed', inset:'0', background:'rgba(0,0,0,0.25)', zIndex:60 }}>
          <div className="panel card-form" style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', maxWidth:'420px', width:'calc(100% - 40px)' }}>
            <div className="title-lg">确认删除</div>
            <div className="subtitle" style={{ textAlign:'left' }}>确定删除该考勤事件{confirmDel.title ? `（${confirmDel.title}）` : ''}？此操作不可恢复。</div>
            <div className="toolbar" style={{ marginTop:'12px', display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button className="btn-primary" onClick={async()=>{ await api.deleteAttendanceProject(confirmDel.id); setConfirmDel(null); await load() }}>删除</button>
              <button className="btn-text" onClick={()=>setConfirmDel(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
