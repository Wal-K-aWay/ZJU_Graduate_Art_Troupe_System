import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
export default function Register() {
  const nav = useNavigate()
  const [form, setForm] = useState({ name:'', student_no:'', password:'', password_confirm:'', phone:'', college:'', gender:'', birth_year:'', birth_month:'', birth_day:'', join_year:'' })
  const [err, setErr] = useState('')
  useEffect(()=>{ const y=new Date().getFullYear(); setForm(f=>({ ...f, join_year:String(y) })) },[])
  function set(k: string, v: string) { setForm({ ...form, [k]: v }) }
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (form.password.length < 8) { setErr('密码至少 8 位'); return }
    if (form.password !== form.password_confirm) { setErr('两次密码不一致'); return }
    if (!/^1\d{10}$/.test(form.phone)) { setErr('手机号格式不正确'); return }
    const fd = new FormData()
    Object.entries(form).forEach(([k,v])=>fd.append(k,String(v)))
    try { await api.register(fd); nav('/login') } catch(e:any){ setErr(e.message) }
  }
  return (
    <div className="gradient-bg h-full flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-[800px] p-8">
        <h1 className="text-center text-xl font-semibold">用户注册</h1>
        <div className="text-center text-gray-500 mb-4">浙江大学研究生艺术团成员信息管理与考勤系统</div>
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          <input className="h-10 border rounded-lg px-3" placeholder="姓名" value={form.name} onChange={e=>set('name',e.target.value)} />
          <input className="h-10 border rounded-lg px-3" placeholder="学号" value={form.student_no} onChange={e=>set('student_no',e.target.value)} />
          <input className="h-10 border rounded-lg px-3" placeholder="密码" type="password" value={form.password} onChange={e=>set('password',e.target.value)} />
          <input className="h-10 border rounded-lg px-3" placeholder="确认密码" type="password" value={form.password_confirm} onChange={e=>set('password_confirm',e.target.value)} />
          <input className="h-10 border rounded-lg px-3" placeholder="手机号" value={form.phone} onChange={e=>set('phone',e.target.value)} />
          <select className="h-10 border rounded-lg px-3" value={form.gender} onChange={e=>set('gender',e.target.value)}><option value="">性别</option><option value="male">男</option><option value="female">女</option></select>
          <input className="h-10 border rounded-lg px-3" placeholder="学院" value={form.college} onChange={e=>set('college',e.target.value)} />
          <div className="grid grid-cols-3 gap-2">
            <input className="h-10 border rounded-lg px-3" placeholder="年" value={form.birth_year} onChange={e=>set('birth_year',e.target.value)} />
            <input className="h-10 border rounded-lg px-3" placeholder="月" value={form.birth_month} onChange={e=>set('birth_month',e.target.value)} />
            <input className="h-10 border rounded-lg px-3" placeholder="日" value={form.birth_day} onChange={e=>set('birth_day',e.target.value)} />
          </div>
          <input className="h-10 border rounded-lg px-3" placeholder="入团年份" value={form.join_year} onChange={e=>set('join_year',e.target.value)} />
          <button className="col-span-2 h-10 bg-blue-500 text-white rounded-lg font-semibold" type="submit">注册</button>
          {err && <div className="col-span-2 text-red-500 text-sm">{err}</div>}
          <div className="col-span-2 text-center text-sm text-gray-500">已有账号？<a href="/login" className="text-blue-600">立即登录</a></div>
        </form>
      </div>
    </div>
  )
}
