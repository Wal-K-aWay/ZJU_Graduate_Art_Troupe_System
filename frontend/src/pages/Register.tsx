import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'

type College = { id: number; name: string }

export default function Register() {
  const nav = useNavigate()
  const [form, setForm] = useState({ name:'', student_no:'', password:'', password_confirm:'', phone:'', gender:'', birth_year:'', birth_month:'', birth_day:'', join_year:'', college:'' })
  const [colleges, setColleges] = useState<College[]>([])
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [birthDays, setBirthDays] = useState<string[]>([])

  useEffect(()=>{ const y=new Date().getFullYear(); setForm(f=>({ ...f, join_year:String(y) })); api.colleges().then(setColleges).catch(()=>{}) },[])
  function set(k: string, v: string) { setForm({ ...form, [k]: v }) }

  function validate() {
    if (form.password.length < 8) return '密码至少 8 位'
    if (form.password !== form.password_confirm) return '两次密码不一致'
    if (!/^1\d{10}$/.test(form.phone)) return '手机号格式不正确'
    if (!form.gender) return '请选择性别'
    if (!form.college) return '请选择学院'
    if (!form.student_no) return '请输入学号'
    if (!form.name) return '请输入姓名'
    if (!avatar) return '请上传头像'
    return ''
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const v = validate()
    if (v) { setErr(v); return }
    setErr(''); setLoading(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k,v])=>fd.append(k,String(v)))
    if (avatar) fd.append('avatar', avatar)
    try { await api.register(fd); nav('/login') } catch(e:any){ setErr(e.message || '注册失败，请检查信息后重试') } finally { setLoading(false) }
  }

  function onAvatarChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setErr('只能上传图片文件'); return }
    if (file.size > 2 * 1024 * 1024) { setErr('图片大小不能超过2MB'); return }
    try { if (avatarPreview) URL.revokeObjectURL(avatarPreview) } catch {}
    try { const url = URL.createObjectURL(file); setAvatarPreview(url) } catch {}
    setAvatar(file)
  }

  const years = Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() - i))
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1))
  const selectStyle = (v: string) => ({ color: v ? '#6b7280' : '#9ca3af' })
  useEffect(()=>{
    const y = Number(form.birth_year); const m = Number(form.birth_month)
    if (!y || !m) { setBirthDays([]); return }
    const d = new Date(y, m, 0).getDate()
    setBirthDays(Array.from({ length: d }, (_, i) => String(i + 1)))
  }, [form.birth_year, form.birth_month])
  useEffect(()=>{ return ()=>{ try { if (avatarPreview) URL.revokeObjectURL(avatarPreview) } catch {} } }, [avatarPreview])

  return (
    <div className="gradient-bg h-full flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl card-form p-8">
        <div className="text-center mb-6">
          <div className="text-2xl font-semibold text-[#262626]">用户注册</div>
          <div className="subtitle">浙江大学研究生艺术团成员信息管理系统</div>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div>
              <div className="label"><span className="req">*</span>姓名</div>
              <div className="field">
                <svg className="icon" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" stroke="currentColor" strokeWidth="2"/><path d="M21 22a9 9 0 1 0-18 0" stroke="currentColor" strokeWidth="2"/></svg>
                <input className="input" placeholder="请输入真实姓名" value={form.name} onChange={e=>set('name',e.target.value)} />
              </div>
            </div>
            <div>
              <div className="label"><span className="req">*</span>学号</div>
              <div className="field">
                <svg className="icon" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M6 8h6" stroke="currentColor" strokeWidth="2"/></svg>
                <input className="input" placeholder="请输入学号" value={form.student_no} onChange={e=>set('student_no',e.target.value)} />
              </div>
            </div>
            <div>
              <div className="label"><span className="req">*</span>密码</div>
              <div className="field">
                <svg className="icon" viewBox="0 0 24 24" fill="none"><path d="M6 10V7a6 6 0 1 1 12 0v3" stroke="currentColor" strokeWidth="2"/><rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="2"/></svg>
                <input className="input" type="password" placeholder="至少 8 位，包含大小写字母和数字" value={form.password} onChange={e=>set('password',e.target.value)} />
              </div>
            </div>
            <div>
              <div className="label"><span className="req">*</span>确认密码</div>
              <div className="field">
                <svg className="icon" viewBox="0 0 24 24" fill="none"><path d="M6 10V7a6 6 0 1 1 12 0v3" stroke="currentColor" strokeWidth="2"/><rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="2"/></svg>
                <input className="input" type="password" placeholder="请再次输入密码" value={form.password_confirm} onChange={e=>set('password_confirm',e.target.value)} />
              </div>
            </div>
            <div>
              <div className="label"><span className="req">*</span>手机号</div>
              <div className="field">
                <svg className="icon" viewBox="0 0 24 24" fill="none"><path d="M6 2h12v20H6z" stroke="currentColor" strokeWidth="2"/><path d="M10 18h4" stroke="currentColor" strokeWidth="2"/></svg>
                <input className="input" placeholder="请输入手机号" value={form.phone} onChange={e=>set('phone',e.target.value)} />
              </div>
            </div>
            <div>
              <div className="label"><span className="req">*</span>性别</div>
              <div className="field">
                <svg className="icon" viewBox="0 0 24 24" fill="none">
                  <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M10 14v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M8 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M14 6l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M18 2h-3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <select className="input" style={selectStyle(form.gender)} value={form.gender} onChange={e=>set('gender',e.target.value)}>
                  <option value="">请选择性别</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>
            </div>
            <div>
              <div className="label"><span className="req">*</span>学院</div>
              <div className="field">
                <svg className="icon" viewBox="0 0 24 24" fill="none"><path d="M3 10l9-5 9 5-9 5-9-5z" stroke="currentColor" strokeWidth="2"/><path d="M3 14l9 5 9-5" stroke="currentColor" strokeWidth="2"/></svg>
                <select className="input" style={selectStyle(form.college)} value={form.college} onChange={e=>set('college',e.target.value)}>
                  <option value="">请选择学院</option>
                  {colleges.map(c=> <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <div className="label"><span className="req">*</span>入团年份</div>
              <div className="field">
                <svg className="icon" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 9h18" stroke="currentColor" strokeWidth="2"/><path d="M7 3v4M17 3v4" stroke="currentColor" strokeWidth="2"/></svg>
                <select className="input" style={selectStyle(form.join_year)} value={form.join_year} onChange={e=>set('join_year',e.target.value)}>
                  {years.map(y=> <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="col-span-2">
              <div className="label"><span className="req">*</span>出生日期</div>
              <div className="grid grid-cols-3 gap-2">
                <select className="input" style={selectStyle(form.birth_year)} value={form.birth_year} onChange={e=>set('birth_year',e.target.value)}>
                  <option value="">年份</option>
                  {Array.from({ length: 50 }, (_, i) => String(new Date().getFullYear() - i)).map(y=> <option key={y} value={y}>{y}</option>)}
                </select>
                <select className="input" style={selectStyle(form.birth_month)} value={form.birth_month} onChange={e=>set('birth_month',e.target.value)}>
                  <option value="">月份</option>
                  {months.map(m=> <option key={m} value={m}>{m}</option>)}
                </select>
                <select className="input" style={selectStyle(form.birth_day)} value={form.birth_day} onChange={e=>set('birth_day',e.target.value)}>
                  <option value="">日期</option>
                  {birthDays.map(d=> <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="col-span-2">
              <div className="label"><span className="req">*</span>头像（≤2MB）</div>
              {avatarPreview ? (
                <div className="upload-box" style={{ width:'120px', height:'120px' }}>
                  <img className="avatar-img" src={avatarPreview} alt="头像预览" />
                  <input type="file" accept="image/*" onChange={onAvatarChange} />
                </div>
              ) : (
                <div className="upload-box">
                  <svg className="upload-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 16V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8.5 10.5 L12 7 L15.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>上传头像</span>
                  <input type="file" accept="image/*" onChange={onAvatarChange} />
                </div>
              )}
            </div>
          </div>
          <div className="toolbar" style={{ marginTop:'16px', justifyContent:'center' }}>
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? '注册中...' : '完成注册'}</button>
          </div>
          {err && <div className="text-red-500 text-sm mt-2">{err}</div>}
          <div className="text-center text-sm text-[#64748b] mt-4">已有账号？<Link to="/login" className="text-blue-600">立即登录</Link></div>
        </form>
      </div>
    </div>
  )
}
