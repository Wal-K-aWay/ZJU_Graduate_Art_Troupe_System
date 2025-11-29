import { useEffect, useState } from 'react'
import { api } from '../../api'
export default function Today() {
  const [todayBirthdays, setTodayBirthdays] = useState<any[]>([])
  const [myAttendances, setMyAttendances] = useState<any[]>([])
  useEffect(()=>{ (async()=>{ try { const bs = await api.todayBirthdays(); setTodayBirthdays(Array.isArray(bs)?bs:[]) } catch { setTodayBirthdays([]) } })() },[])
  useEffect(()=>{ (async()=>{ try { const list = await api.listMyAttendances(); const arr = Array.isArray(list)?list:[]; function parseUtcFromBj(s: string) { if (typeof s !== 'string' || !s) return null as number|null; const [d, t] = s.split(' '); if (!t) return null; const [y, m, day] = d.split('-').map((x)=>Number(x)); const [hh, mm] = t.split(':').map((x)=>Number(x)); return Date.UTC(y, (m||1)-1, day||1, (hh||0)-8, mm||0) } function computeStatus(start: string, end: string) { const st = parseUtcFromBj(start); const et = parseUtcFromBj(end); const utcNow = Date.now(); if (st != null && utcNow < st) return '未开始'; if (st != null && et != null && utcNow >= st && utcNow <= et) return '进行中'; if (et != null && utcNow > et) return '已结束'; if (st != null && et == null && utcNow >= st) return '进行中'; return '' } const filt = arr.filter((r:any)=>{ const s = computeStatus(r.start_time, r.end_time) || r.time_status || r.status; return s === '未开始' || s === '进行中' }).slice(0,5); setMyAttendances(filt) } catch { setMyAttendances([]) } })() },[])
  return (
    <div className="content">
      <div className="hero-box">
        <div className="title-wrap title-gap-lg"><span className="calendar-icon"/><div className="title-md">今日事项</div></div>
        <div className="sub-sections">
          <div className="block">
            <div className="section-head"><div className="section-header"><span className="section-icon icon-gift"></span> 今日生日</div></div>
            <div className="section-content">
              {todayBirthdays && todayBirthdays.length ? (
                <div className="chips">
                  {todayBirthdays.map((p:any)=> <span key={p.id} className="badge">{p.name}</span>)}
                </div>
              ) : (
                <div className="empty-box"><span className="empty-icon"/>今天无人生日</div>
              )}
            </div>
          </div>
          <div className="block">
            <div className="section-head"><div className="section-header"><span className="section-icon icon-play"></span> 近期演出</div></div>
            <div className="section-content">
              <div className="empty-box"><span className="empty-icon"/>暂无演出安排</div>
            </div>
          </div>
          <div className="block">
            <div className="section-head"><div className="section-header"><span className="section-icon icon-clock"></span> 近期考勤</div></div>
            <div className="section-content">
              {myAttendances && myAttendances.length ? (
                <table className="table">
                  <colgroup><col style={{width:'28%'}}/><col style={{width:'28%'}}/><col style={{width:'34%'}}/><col style={{width:'10%'}}/></colgroup>
                  <thead><tr><th>时间</th><th>地点</th><th>内容</th><th>状态</th></tr></thead>
                  <tbody>
                    {myAttendances.map((r:any)=> (
                      <tr key={r.id}>
                        <td>{r.end_time ? `${r.start_time} - ${r.end_time}` : r.start_time}</td>
                        <td>{r.location}</td>
                        <td>{r.title}</td>
                        <td><span className="badge">{r.time_status || r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-box"><span className="empty-icon"/>今天暂无考勤事项</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
