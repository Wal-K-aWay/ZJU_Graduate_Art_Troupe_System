import React from 'react'
function TabLink({ id, cur, set }: { id: string; cur: string; set: (v: string)=>void }) {
  const label = ({today:'今日事项',profile:'个人资料',members:'团员信息',attendance:'考勤',performance:'演出'} as any)[id]
  const icon = {
    today: (<svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 3v3M17 3v3" stroke="currentColor" strokeWidth="2"/><rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M7 10h2M11 10h2M15 10h2" stroke="currentColor" strokeWidth="2"/></svg>),
    profile: (<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2"/></svg>),
    members: (
      <svg viewBox="0 0 24 24" width="16" height="16">
        <circle cx="8" cy="9" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="16" cy="8" r="2.5" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M3 20c0-3.2 3.6-5.4 6-5.4s6 2.2 6 5.4" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M12.5 20c.2-2.2 2.3-3.8 4.5-3.8s4.3 1.6 4.5 3.8" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
    attendance: (<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/></svg>),
    performance: (<svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 20h18M6 20V8l6-4 6 4v12" stroke="currentColor" strokeWidth="2" fill="none"/></svg>)
  } as any
  return <button id={`tab-${id}`} className={`tab-link ${cur===id?'active':''}`} onClick={()=>set(id)}><span className="tab-icon">{icon[id]}</span>{label}</button>
}
export default TabLink

