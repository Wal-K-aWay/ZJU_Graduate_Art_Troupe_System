const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'
async function j(r: Response) { const x = await r.json(); if (!r.ok) throw new Error(x.message || '请求失败'); return x }
export const api = {
  login: (student_no: string, password: string) => fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ student_no, password }) }).then(j),
  register: (data: FormData) => fetch(`${BASE}/auth/register`, { method: 'POST', credentials: 'include', body: data }).then(j),
  me: () => fetch(`${BASE}/auth/me`, { credentials: 'include' }).then(r => r.json()),
  updateMe: (id: number, body: any) => fetch(`${BASE}/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) }).then(j),
  uploadAvatar: (id: number, file: File) => { const d = new FormData(); d.append('avatar', file); return fetch(`${BASE}/users/${id}/avatar`, { method: 'POST', credentials: 'include', body: d }).then(j) },
  userGroups: (id: number) => fetch(`${BASE}/users/${id}/groups`, { credentials: 'include' }).then(r => r.json()),
  listUsers: (params: URLSearchParams) => fetch(`${BASE}/users?${params.toString()}`, { credentials: 'include' }).then(j),
  exportUsersUrl: (params: URLSearchParams) => `${BASE}/users/export?${params.toString()}`,
  colleges: () => fetch(`${BASE}/dict/colleges`, { credentials: 'include' }).then(r => r.json()),
  groups: () => fetch(`${BASE}/dict/groups`, { credentials: 'include' }).then(r => r.json()),
  deleteUser: (id: number) => fetch(`${BASE}/users/${id}`, { method: 'DELETE', credentials: 'include' }).then(j)
  ,logout: () => fetch(`${BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).then(j)
  ,imageUrl: (id: number) => `${BASE}/images/${id}`
  ,todayBirthdays: () => fetch(`${BASE}/stats/today_birthdays`, { credentials: 'include' }).then(r => r.json())
  ,createAttendanceProject: (body: { title: string, location: string, start_time: string, end_time: string }) => fetch(`${BASE}/attendance/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) }).then(j)
  ,listAttendanceProjects: () => fetch(`${BASE}/attendance/projects`, { credentials: 'include' }).then(r => r.json())
  ,listMyAttendances: () => fetch(`${BASE}/attendance/my`, { credentials: 'include' }).then(r => r.json())
  ,updateAttendanceProject: (id: number, body: { title: string, location: string, start_time: string, end_time: string, status?: string }) => fetch(`${BASE}/attendance/projects/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) }).then(j)
  ,deleteAttendanceProject: (id: number) => fetch(`${BASE}/attendance/projects/${id}`, { method: 'DELETE', credentials: 'include' }).then(j)
  ,assignAttendanceParticipants: (id: number, user_ids: number[]) => fetch(`${BASE}/attendance/projects/${id}/participants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ user_ids }) }).then(j)
  ,getAttendanceParticipants: (id: number) => fetch(`${BASE}/attendance/projects/${id}/participants`, { credentials: 'include' }).then(r => r.json())
  ,replaceAttendanceParticipants: (id: number, user_ids: number[]) => fetch(`${BASE}/attendance/projects/${id}/participants`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ user_ids }) }).then(j)
  ,changePassword: (current_password: string, new_password: string) => fetch(`${BASE}/auth/change_password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ current_password, new_password }) }).then(j)
}
