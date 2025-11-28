import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'

export default function Login() {
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const nav = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (!studentId || !password) { setErr('请输入学号和密码'); return }
    setLoading(true)
    try {
      await api.login(studentId, password)
      if (remember) localStorage.setItem('remember_student', studentId)
      nav('/home', { replace: true })
    } catch (e: any) {
      setErr(e.message || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gradient-bg h-full flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-[460px] p-8">
        {/* 头部 */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full" style={{ background:'linear-gradient(135deg,#1890ff,#722ed1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="#fff"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/><path d="M21 22a9 9 0 1 0-18 0"/></svg>
          </div>
          <div className="text-2xl font-semibold text-[#262626]">欢迎登录</div>
          <div className="text-[#64748b]">浙江大学研究生艺术团管理系统</div>
        </div>

        {/* 登录表单 */}
        <form onSubmit={submit} className="space-y-4">
          <div className="field">
            <svg className="icon" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" stroke="currentColor" strokeWidth="2"/><path d="M21 22a9 9 0 1 0-18 0" stroke="currentColor" strokeWidth="2"/></svg>
            <input className="w-full h-12 border rounded-lg px-3 input" placeholder="请输入学号" value={studentId} onChange={e=>setStudentId(e.target.value)} autoComplete="username" />
          </div>
          <div className="field">
            <svg className="icon" viewBox="0 0 24 24" fill="none"><path d="M6 10V7a6 6 0 1 1 12 0v3" stroke="currentColor" strokeWidth="2"/><rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="2"/></svg>
            <input className="w-full h-12 border rounded-lg px-3 input" placeholder="请输入密码" type={showPwd ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" />
            <button type="button" aria-label={showPwd ? '隐藏密码' : '显示密码'} className="toggle" onClick={()=>setShowPwd(s=>!s)}>
              {showPwd ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18" strokeLinecap="round"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} /> 记住我</label>
            <Link to="/forgot-password" className="text-blue-600">忘记密码？</Link>
          </div>
          <button className="w-full h-12 btn-primary font-semibold" type="submit" disabled={loading}>{loading ? '登录中...' : '登录'}</button>
          {err && <div className="text-red-500 text-sm">{err}</div>}
        </form>

        {/* 注册链接 */}
        <div className="text-center mt-6 border-t pt-4 border-[#f0f0f0]">
          <div className="text-[#64748b] text-sm mb-0">还没有账号？</div>
          <Link to="/register" className="text-blue-600 text-sm mb-1">立即注册</Link>
          <div className="text-[#9ca3af] text-sm">© 浙江大学研究生艺术团</div>
        </div>
      </div>
    </div>
  )
}
