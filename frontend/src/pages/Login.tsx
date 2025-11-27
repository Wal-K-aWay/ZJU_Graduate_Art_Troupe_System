import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
export default function Login() {
  const [student_no, setStudentNo] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const nav = useNavigate()
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (!student_no || !password) { setErr('请填写学号和密码'); return }
    try { await api.login(student_no, password); nav('/home') } catch (e: any) { setErr(e.message) }
  }
  return (
    <div className="gradient-bg h-full flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-[460px] p-8">
        <h1 className="text-center text-2xl font-semibold text-[#0f172a]">浙江大学研究生艺术团</h1>
        <div className="text-center text-[#64748b] mb-5">主持礼仪分团</div>
        <form onSubmit={submit} className="space-y-4">
          <div className="field">
            <svg className="icon" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" stroke="currentColor" strokeWidth="2"/><path d="M21 22a9 9 0 1 0-18 0" stroke="currentColor" strokeWidth="2"/></svg>
            <input className="w-full h-10 border rounded-lg px-3 input" placeholder="请输入学号" value={student_no} onChange={e=>setStudentNo(e.target.value)} />
          </div>
          <div className="field">
            <svg className="icon" viewBox="0 0 24 24" fill="none"><path d="M6 10V7a6 6 0 1 1 12 0v3" stroke="currentColor" strokeWidth="2"/><rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="2"/></svg>
            <input className="w-full h-10 border rounded-lg px-3 input" placeholder="请输入密码" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <button className="w-full h-10 btn-primary font-semibold" type="submit">登录</button>
          {err && <div className="text-red-500 text-sm">{err}</div>}
          <div className="text-center text-sm text-[#64748b]">还没有账号？<Link to="/register" className="text-blue-600">立即注册</Link></div>
        </form>
      </div>
    </div>
  )
}
