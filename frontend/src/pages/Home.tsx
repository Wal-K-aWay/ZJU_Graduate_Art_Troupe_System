import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import TabLink from './home/TabLink'
import Today from './home/Today'
import Profile from './home/Profile'
import Members from './home/Members'
import Attendance from './home/Attendance'
import Performance from './home/Performance'
export default function Home() {
  const [cur, setCur] = useState('today')
  const [me, setMe] = useState<any>(null)
  const nav = useNavigate()
  useEffect(()=>{ (async()=>{ try { const m = await api.me(); setMe(m) } catch { setMe({}) } })() },[])
  const isAdmin = me?.role === 'admin'
  const [indicatorLeft, setIndicatorLeft] = useState(0)
  const [indicatorWidth, setIndicatorWidth] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [nowStr, setNowStr] = useState('')
  useEffect(()=>{
    function calc() {
      const el = document.getElementById(`tab-${cur}`)
      const navEl = document.querySelector('.navbar') as HTMLElement | null
      if (!el || !navEl) return
      const r = el.getBoundingClientRect()
      const nr = navEl.getBoundingClientRect()
      const cs = window.getComputedStyle(el)
      const pl = parseFloat(cs.paddingLeft || '0')
      const pr = parseFloat(cs.paddingRight || '0')
      const w = r.width - pl - pr
      setIndicatorWidth(w + 8)
      setIndicatorLeft(r.left - nr.left + pl - 4)
    }
    calc()
    window.addEventListener('resize', calc)
    return ()=>window.removeEventListener('resize', calc)
  }, [cur])
  useEffect(()=>{
    function tick(){
      const d = new Date()
      const dStr = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d).replace(/\//g, '-')
      const wStr = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', weekday: 'long' }).format(d)
      const tStr = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(d)
      setNowStr(`${dStr} ${wStr} ${tStr}`)
    }
    tick()
    const t = setInterval(tick, 1000)
    return ()=>clearInterval(t)
  }, [])
  return (
    <div className="app min-h-full">
      <div className="navbar">
        <div className="nav-left">
          <div className="brand">浙江大学研究生艺术团管理系统</div>
          <div className="tabs-inline">
            <TabLink id="today" cur={cur} set={setCur} />
            <TabLink id="profile" cur={cur} set={setCur} />
            <TabLink id="members" cur={cur} set={setCur} />
            <TabLink id="attendance" cur={cur} set={setCur} />
            <TabLink id="performance" cur={cur} set={setCur} />
          </div>
        </div>
        <div className="tab-indicator" style={{ left: indicatorLeft, width: indicatorWidth }} />
        <div className="muted" style={{ marginRight: '12px' }}>{nowStr}</div>
        <div className="user-menu" onMouseEnter={()=>setMenuOpen(true)} onMouseLeave={()=>setMenuOpen(false)}>
          <div className="user">{me?.profile_photo_id ? (<img className="avatar-sm-img" src={api.imageUrl(me.profile_photo_id)} alt="头像" />) : (<span className="avatar-sm" />)}{me?.name || '未登录'}</div>
          {menuOpen && (
            <div className="user-dropdown">
              <button className="dropdown-item" onClick={()=>{ setMenuOpen(false); nav('/notfound') }}>个人设置</button>
              <button className="dropdown-item" onClick={()=>{ setMenuOpen(false); nav('/notfound') }}>帮助</button>
              <button className="dropdown-item" onClick={async()=>{ try { await api.logout(); } finally { nav('/login', { replace: true }) } }}>退出</button>
            </div>
          )}
        </div>
      </div>
      <div className="container">
        {cur==='today' && <Today />}
        {cur==='profile' && me && <Profile me={me} setMe={setMe} />}
        {cur==='members' && <Members isAdmin={isAdmin} />}
        {cur==='attendance' && <Attendance isAdmin={isAdmin} />}
        {cur==='performance' && <Performance isAdmin={isAdmin} />}
      </div>
    </div>
  )
}
