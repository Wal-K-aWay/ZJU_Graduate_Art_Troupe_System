import MembersAdmin from './MembersAdmin'
export default function Members({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="content">
      <div className="hero-box">
        <div className="title-wrap title-gap-lg"><span className="members-icon"/><div className="title-md">团员信息</div></div>
        <div className="sub-sections">
          <MembersAdmin isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  )
}

