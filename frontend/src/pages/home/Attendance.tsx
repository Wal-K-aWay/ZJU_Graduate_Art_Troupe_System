export default function Attendance({ isAdmin }: { isAdmin: boolean }) {
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
              <div className="section-head"><div className="section-header"><span className="section-icon icon-clock-b"></span> 考勤管理</div><a className="btn-link" href="#">查看全部</a></div>
              <div className="empty-box"><span className="empty-icon"/>暂无管理事项</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

