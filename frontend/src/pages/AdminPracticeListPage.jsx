import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import { getMembershipStatus, MEMBERSHIP_STATUS } from '../utils/membershipStatus'
import {
  listOfficialPractices,
  publishOfficialPractice,
  unpublishOfficialPractice,
  archiveOfficialPractice
} from '../state/officialPracticeStore'

const STATUS_LABEL = {
  draft: '草稿',
  published: '已發布',
  archived: '已下架'
}

// Admin Official Practice management (Phase 6C). Route-level gate only
// (redirects a non-admin away) -- not the real security boundary. The
// real boundary is Supabase RLS (supabase/schema_practices.sql,
// verified live in Phase 6A/6B): listOfficialPractices() below always
// runs through the normal anon-key client, so a non-admin who somehow
// reached this page would still only ever see published rows back.
function AdminPracticeListPage() {
  const { loading, user, profile } = useAuth()
  const [practices, setPractices] = useState([])
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [actionError, setActionError] = useState(null)

  const isAdmin = getMembershipStatus(profile) === MEMBERSHIP_STATUS.ADMIN

  useEffect(() => {
    if (!isAdmin) return

    listOfficialPractices().then((data) => {
      setPractices(data)
      setIsLoadingList(false)
    })
  }, [isAdmin])

  // profile can legitimately still be null for a moment after `loading`
  // has already flipped to false -- AuthProvider.jsx's loadProfile() is
  // fire-and-forget (not awaited before setLoading(false)), so a direct
  // load/refresh of this route can otherwise misjudge a real admin as
  // non-admin during that gap. Wait for profile before deciding, rather
  // than redirecting away on a false negative.
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return null
  if (!isAdmin) return <Navigate to="/" replace />

  async function refresh() {
    setIsLoadingList(true)
    const data = await listOfficialPractices()
    setPractices(data)
    setIsLoadingList(false)
  }

  // action: one of publishOfficialPractice / unpublishOfficialPractice /
  // archiveOfficialPractice (Phase 6B) -- all three are thin wrappers
  // over the same validated update path, so this one handler covers
  // every status transition on this page.
  async function handleStatusAction(action, id) {
    setActionError(null)

    const { error } = await action(id)

    if (error) {
      setActionError(error.message)
      return
    }

    refresh()
  }

  return (
    <div className="admin-practice-list-page">
      <h1>Official Practice 管理</h1>

      <Link to="/admin/practices/new" className="button">
        ＋ 建立新 Practice
      </Link>

      {actionError && <p className="builder-errors">{actionError}</p>}

      {isLoadingList ? (
        <p>載入中…</p>
      ) : practices.length === 0 ? (
        <p>目前沒有任何 Official Practice。</p>
      ) : (
        <ul className="admin-practice-list">
          {practices.map((practice) => (
            <li key={practice.id} className="admin-practice-row">
              <span className="admin-practice-row-id">{practice.id}</span>
              <span>{practice.chineseTitle}</span>
              <span className="admin-practice-row-status">{STATUS_LABEL[practice.status] || practice.status}</span>

              <div className="admin-practice-row-actions">
                <Link to={`/admin/practices/${practice.id}/edit`}>編輯</Link>

                {practice.status === 'draft' && (
                  <button type="button" className="link-button" onClick={() => handleStatusAction(publishOfficialPractice, practice.id)}>
                    發布
                  </button>
                )}

                {practice.status === 'published' && (
                  <>
                    <button type="button" className="link-button" onClick={() => handleStatusAction(unpublishOfficialPractice, practice.id)}>
                      轉回草稿
                    </button>
                    <button type="button" className="link-button" onClick={() => handleStatusAction(archiveOfficialPractice, practice.id)}>
                      下架
                    </button>
                  </>
                )}

                {practice.status === 'archived' && (
                  <button type="button" className="link-button" onClick={() => handleStatusAction(publishOfficialPractice, practice.id)}>
                    重新發布
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AdminPracticeListPage
