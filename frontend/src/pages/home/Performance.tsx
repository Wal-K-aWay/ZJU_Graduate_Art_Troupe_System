export default function Performance({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="content">
      <div className="hero-box">
        <div className="title-wrap title-gap-lg"><span className="performance-icon"/><div className="title-md">演出</div></div>
        <div className="sub-sections">
          <div className="block">
            <div className="section-head"><div className="section-header"><span className="section-icon icon-play-a"></span> 我的演出</div><a className="btn-link" href="#">查看全部</a></div>
            <div className="empty-box"><span className="empty-icon"/>暂无演出安排</div>
          </div>
          {isAdmin && (
            <div className="block">
              <div className="section-head"><div className="section-header"><span className="section-icon icon-play-b"></span> 演出管理</div><a className="btn-link" href="#">查看全部</a></div>
              <div className="empty-box"><span className="empty-icon"/>暂无管理事项</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

