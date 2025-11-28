import { useEffect, useState } from 'react'
import { api } from '../../api'
export default function Today() {
  const [todayBirthdays, setTodayBirthdays] = useState<any[]>([])
  useEffect(()=>{ (async()=>{ try { const bs = await api.todayBirthdays(); setTodayBirthdays(Array.isArray(bs)?bs:[]) } catch { setTodayBirthdays([]) } })() },[])
  return (
    <div className="content">
      <div className="hero-box">
        <div className="title-wrap"><span className="calendar-icon"/><div className="title-md">今日事项</div></div>
        <div className="date-sub">{new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric', weekday:'long' })}</div>
        <div className="sub-sections">
          <div className="block">
            <div className="section-head"><div className="section-header"><span className="section-icon icon-gift"></span> 今日生日</div><a className="btn-link" href="#">查看全部</a></div>
            {todayBirthdays && todayBirthdays.length ? (
              <div className="chips">
                {todayBirthdays.map((p:any)=> <span key={p.id} className="badge">{p.name}</span>)}
              </div>
            ) : (
              <div className="empty-box"><span className="empty-icon"/>今天无人生日</div>
            )}
          </div>
          <div className="block">
            <div className="section-head"><div className="section-header"><span className="section-icon icon-play"></span> 近期演出</div><a className="btn-link" href="#">查看全部</a></div>
            <div className="empty-box"><span className="empty-icon"/>暂无演出安排</div>
          </div>
          <div className="block">
            <div className="section-head"><div className="section-header"><span className="section-icon icon-clock"></span> 近期考勤</div><a className="btn-link" href="#">查看全部</a></div>
            <div className="empty-box"><span className="empty-icon"/>今天暂无考勤事项</div>
          </div>
        </div>
      </div>
    </div>
  )
}

