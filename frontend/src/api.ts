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
}
