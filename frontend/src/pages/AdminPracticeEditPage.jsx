import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import { getMembershipStatus, MEMBERSHIP_STATUS } from '../utils/membershipStatus'
import { getOfficialPractice, createOfficialPractice, updateOfficialPractice } from '../state/officialPracticeStore'
import PracticeBuilder from '../components/PracticeBuilder'

// Admin Official Practice create/edit (Phase 6C). Reuses PracticeBuilder
// unchanged (see that component's own Phase 6C comment) -- this page's
// only job is: gate access, fetch the existing row for edit mode (async,
// so it happens here rather than inside PracticeBuilder, which stays a
// synchronous-initial-state component for both modes), and decide
// create vs. update when PracticeBuilder's Save calls back.
//
// Editing an already-archived Practice works the same as any other --
// updateOfficialPractice (Phase 6B) preserves whatever status the row
// already had unless a separate publish/unpublish/archive action changes
// it (see AdminPracticeListPage), so saving an edited archived Practice
// keeps it archived, re-validated, never silently republishing it.
function AdminPracticeEditPage() {
  const { loading, user, profile } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)

  const [practice, setPractice] = useState(null)
  const [isLoadingPractice, setIsLoadingPractice] = useState(isEditMode)
  const [notFound, setNotFound] = useState(false)

  const isAdmin = getMembershipStatus(profile) === MEMBERSHIP_STATUS.ADMIN

  useEffect(() => {
    if (!isAdmin || !isEditMode) return

    getOfficialPractice(id).then((data) => {
      if (!data) {
        setNotFound(true)
      } else {
        setPractice(data)
      }

      setIsLoadingPractice(false)
    })
  }, [isAdmin, isEditMode, id])

  // See AdminPracticeListPage.jsx's identical comment: profile can
  // legitimately still be null for a moment after `loading` has already
  // flipped to false (AuthProvider.jsx's loadProfile() is fire-and-forget).
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return null
  if (!isAdmin) return <Navigate to="/" replace />
  if (isLoadingPractice) return null
  if (notFound) return <p>找不到這個 Practice，或沒有讀取權限。</p>

  async function handleSave(payload) {
    if (isEditMode) {
      const { error } = await updateOfficialPractice(id, {
        slug: payload.slug,
        title: payload.title,
        chineseTitle: payload.chineseTitle,
        description: payload.description,
        difficulty: payload.difficulty,
        modules: payload.modules
      })

      if (error) return error

      navigate('/admin/practices')
      return null
    }

    const { error } = await createOfficialPractice(payload)

    if (error) return error

    navigate('/admin/practices')
    return null
  }

  return (
    <PracticeBuilder
      initialPractice={practice}
      onSave={handleSave}
      heading={isEditMode ? '編輯 Official Practice' : '建立 Official Practice'}
      saveLabel="儲存"
    />
  )
}

export default AdminPracticeEditPage
