import { useEffect, useState } from 'react'
import { api } from '../../api'
export default function Profile({ me, setMe }: { me: any; setMe: (fn: any)=>void }) {
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileDraft, setProfileDraft] = useState<any>(null)
  const [avatarPreview, setAvatarPreview] = useState<string|null>(null)
  const [colleges, setColleges] = useState<string[]>([])
  const [myGroups, setMyGroups] = useState<any[]>([])
  const [pwdOld, setPwdOld] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [pwdConfirm, setPwdConfirm] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  useEffect(()=>{ (async()=>{ try { const list = await api.colleges(); setColleges(list.map((x:any)=>x.name||x)) } catch { setColleges([]) } })() },[])
  useEffect(()=>{ if (me?.id) { (async()=>{ try { const gs = await api.userGroups(me.id); setMyGroups(Array.isArray(gs)?gs:[]) } catch { setMyGroups([]) } })() } },[me?.id])
  async function onUploadAvatar(file: File | null) { if (!file || !me) return; const r = await api.uploadAvatar(me.id, file); const pid = r.image_id; setProfileDraft((d:any)=>({ ...(d||me), profile_photo_id: pid })); setMe((m:any)=>({ ...(m||{}), profile_photo_id: pid })) }
  return (
    <div className="content">
      <div className="hero-box">
        <div className="title-wrap title-gap-lg"><span className="profile-icon"/><div className="title-md">个人资料</div></div>
        <div className="sub-sections">
          <div className="block narrow">
            <div className="section-head">
              <div className="section-header"><span className="profile-icon"/> 基本信息</div>
              <div className="flex gap-2">
                <button className="btn-primary btn-slim" onClick={()=>{
                  setPwdMsg('')
                  setShowPwd((v)=>{
                    const nv = !v
                    if (!nv) { setPwdOld(''); setPwdNew(''); setPwdConfirm('') }
                    return nv
                  })
                }}><span className="btn-icon edit-icon"/>修改密码</button>
                <button className="btn-primary btn-slim" onClick={async()=>{ if (!editingProfile) { setProfileDraft(me); setEditingProfile(true) } else { await api.updateMe(me.id, profileDraft); setMe(profileDraft); setEditingProfile(false); setAvatarPreview(null) } }}>{editingProfile? <span className="btn-icon save-icon"/> : <span className="btn-icon edit-icon"/>}{editingProfile?'保存修改':'编辑资料'}</button>
              </div>
            </div>
            <div className="profile-section">
              <div className="profile-grid">
                <div className="avatar-lg">{editingProfile ? (
                  <div className="avatar-edit">
                    {(avatarPreview || profileDraft?.profile_photo_id || me.profile_photo_id) ? (
                      <>
                        <img className="avatar-img" src={avatarPreview || api.imageUrl(profileDraft?.profile_photo_id || me.profile_photo_id)} alt="头像"/>
                        <div className="avatar-hint"><svg className="upload-icon" viewBox="0 0 24 24"><path d="M12 3v10" stroke="currentColor" strokeWidth="2"/><path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2"/><rect x="4" y="13" width="16" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/></svg><span>更换头像</span></div>
                        <input className="avatar-input" type="file" accept="image/*" onChange={e=>{ const f = e.target.files?.[0]||null; if (f) { try { const u = URL.createObjectURL(f); setAvatarPreview(u) } catch {} } onUploadAvatar(f) }} />
                      </>
                    ) : (
                      <div className="upload-box" style={{ width:'100%', height:'100%' }}>
                        <svg className="upload-icon" viewBox="0 0 24 24"><path d="M12 3v10" stroke="currentColor" strokeWidth="2"/><path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2"/><rect x="4" y="13" width="16" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/></svg><span>上传头像</span><input type="file" accept="image/*" onChange={e=>onUploadAvatar(e.target.files?.[0]||null)} />
                      </div>
                    )}
                  </div>
                ) : (me.profile_photo_id ? <img className="avatar-img" src={api.imageUrl(me.profile_photo_id)} alt="头像"/> : '头像')}</div>
                <form className="form-grid" onSubmit={e=>e.preventDefault()}>
                  <div>
                    <div className="label">姓名</div>
                    <input className="input" value={editingProfile?(profileDraft?.name||''):(me.name||'')} onChange={e=>setProfileDraft({...profileDraft,name:e.target.value})} disabled={!editingProfile} />
                  </div>
                  <div>
                    <div className="label">学号</div>
                    <input className="input" value={editingProfile?(profileDraft?.student_no||''):(me.student_no||'')} disabled />
                  </div>
                  <div>
                    <div className="label">性别</div>
                    {editingProfile ? (
                      <select className="input select-input" value={profileDraft?.gender||''} onChange={e=>setProfileDraft({...profileDraft,gender:e.target.value})}>
                        <option value="male">男</option>
                        <option value="female">女</option>
                      </select>
                    ) : (
                      <input className="input" value={(me.gender||'')==='male'?'男':((me.gender||'')==='female'?'女':'')} disabled />
                    )}
                  </div>
                  <div>
                    <div className="label">手机号</div>
                    <input className="input" value={editingProfile?(profileDraft?.phone||''):(me.phone||'')} onChange={e=>setProfileDraft({...profileDraft,phone:e.target.value})} disabled={!editingProfile} />
                  </div>
                  <div>
                    <div className="label">学院</div>
                    {editingProfile ? (
                      <select className="input select-input" value={profileDraft?.college||''} onChange={e=>setProfileDraft({...profileDraft,college:e.target.value})}>
                        <option value="">请选择学院</option>
                        {colleges.map((n)=> <option key={n} value={n}>{n}</option>)}
                      </select>
                    ) : (
                      <input className="input" value={me.college||''} disabled />
                    )}
                  </div>
                  <div>
                    <div className="label">入团年份</div>
                    {editingProfile ? (
                      (()=>{ const ysel = String(profileDraft?.join_year||''); const now = new Date().getFullYear(); const ys = Array.from({length: now-2013}, (_,i)=>String(2014+i)); return (
                        <select className="input select-input" value={ysel} onChange={e=>setProfileDraft({...profileDraft,join_year:e.target.value})}>
                          <option value="">请选择年份</option>
                          {ys.map(v=> <option key={v} value={v}>{v}</option>)}
                        </select>
                      ) })()
                    ) : (
                      <input className="input" value={me.join_year||''} disabled />
                    )}
                  </div>
                  <div className="col-span-2">
                    <div className="label">生日</div>
                    {editingProfile ? (
                      (()=>{ const src = String(profileDraft?.birthday||me.birthday||''); const parts = src.split('-'); const y = parts[0]||''; const m = parts[1]||''; const d = parts[2]||''; const mVal = m ? String(parseInt(m,10)) : ''; const dVal = d ? String(parseInt(d,10)) : ''; const now = new Date().getFullYear(); const ys = Array.from({length: now-1989}, (_,i)=>String(1990+i)); const ms = Array.from({length:12}, (_,i)=>String(i+1)); const dim = (yy: any, mm: any)=>{ const mi = Number(mm||1); const yi = Number(yy||now); return new Date(yi, mi, 0).getDate() }; const days = Array.from({length: dim(y, mVal)}, (_,i)=>String(i+1)); return (
                        <div className="form-row-3">
                          <select className="input select-input" value={y} onChange={e=>{ const ny = e.target.value; const nd = dVal && Number(dVal) > dim(ny, mVal) ? String(dim(ny, mVal)) : dVal; setProfileDraft({...profileDraft,birthday:`${ny||''}-${String(mVal||'').padStart(2,'0')}-${String(nd||'').padStart(2,'0')}`}) }}>
                            <option value="">年份</option>
                            {ys.map(v=> <option key={v} value={v}>{v}</option>)}
                          </select>
                          <select className="input select-input" value={mVal} onChange={e=>{ const nm = e.target.value; const ndmax = dim(y, nm); const nd = dVal && Number(dVal) > ndmax ? String(ndmax) : dVal; setProfileDraft({...profileDraft,birthday:`${y||''}-${String(nm||'').padStart(2,'0')}-${String(nd||'').padStart(2,'0')}`}) }}>
                            <option value="">月份</option>
                            {ms.map(v=> <option key={v} value={v}>{v}</option>)}
                          </select>
                          <select className="input select-input" value={dVal} onChange={e=>{ const nd = e.target.value; setProfileDraft({...profileDraft,birthday:`${y||''}-${String(mVal||'').padStart(2,'0')}-${String(nd||'').padStart(2,'0')}`}) }}>
                            <option value="">日期</option>
                            {days.map(v=> <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                      ) })()
                    ) : (
                      <input className="input" value={me.birthday||''} disabled />
                    )}
                  </div>
                </form>
                <div className="groups-row col-2">
                  <div className="label">所属分团</div>
                  <div className="chips">
                    {myGroups.length ? myGroups.map((g: any, i)=> <span key={i} className="badge">{g.name}{g.role==='leader'?'（团长）':(g.role==='deputy'?'（副团长）':'')}</span>) : <span className="muted">暂无分团</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {showPwd && (
            <div style={{ position:'fixed', inset:'0', background:'rgba(0,0,0,0.25)', zIndex:50 }}>
              <div className="panel card-form" style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', maxWidth:'520px', width:'calc(100% - 40px)' }}>
                <div className="title-lg">修改密码</div>
                <div className="form-grid">
                  <div className="col-span-2">
                    <div className="label">当前密码</div>
                    <input className="input" type="password" value={pwdOld} onChange={e=>setPwdOld(e.target.value)} placeholder="如未设置可留空" />
                  </div>
                  <div className="col-span-2">
                    <div className="label">新密码</div>
                    <input className="input" type="password" value={pwdNew} onChange={e=>setPwdNew(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <div className="label">确认新密码</div>
                    <input className="input" type="password" value={pwdConfirm} onChange={e=>setPwdConfirm(e.target.value)} />
                  </div>
                </div>
                <div className="toolbar" style={{ marginTop:'12px', display:'flex', gap:'8px' }}>
                  <button className="btn-primary" onClick={async()=>{
                    setPwdMsg('')
                    if (pwdLoading) return
                    if (!pwdNew) { setPwdMsg('新密码不能为空'); return }
                    if (pwdNew !== pwdConfirm) { setPwdMsg('两次输入的新密码不一致'); return }
                    try {
                      setPwdLoading(true)
                      await api.changePassword(pwdOld, pwdNew)
                      setPwdMsg('密码已更新')
                      setPwdOld(''); setPwdNew(''); setPwdConfirm('')
                      setShowPwd(false)
                    } catch (e: any) {
                      setPwdMsg(String(e?.message || '更新失败'))
                    } finally {
                      setPwdLoading(false)
                    }
                  }}><span className="btn-icon save-icon"/>保存</button>
                  <button className="btn-text" onClick={()=>{ setShowPwd(false); setPwdOld(''); setPwdNew(''); setPwdConfirm(''); setPwdMsg('') }}>取消</button>
                </div>
                {pwdMsg ? <div className="hint" style={{ marginTop:'8px' }}>{pwdMsg}</div> : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
