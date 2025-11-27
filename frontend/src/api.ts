const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8090'
async function j(r: Response) { const x = await r.json(); if (!r.ok) throw new Error(x.message || '请求失败'); return x }
export const api = {
  login: (student_no: string, password: string) => fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ student_no, password }) }).then(j),
  register: (data: FormData) => fetch(`${BASE}/auth/register`, { method: 'POST', credentials: 'include', body: data }).then(j),
  me: () => fetch(`${BASE}/auth/me`, { credentials: 'include' }).then(r => r.json()),
  updateMe: (id: number, body: any) => fetch(`${BASE}/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) }).then(j),
  listUsers: (params: URLSearchParams) => fetch(`${BASE}/users?${params.toString()}`, { credentials: 'include' }).then(r => r.json()),
  exportUsersUrl: (params: URLSearchParams) => `${BASE}/users/export?${params.toString()}`
}
