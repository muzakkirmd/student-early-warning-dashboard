const BASE = '/api'

export async function fetchStudents() {
  const res = await fetch(`${BASE}/students`)
  if (!res.ok) throw new Error('Failed to fetch students')
  return res.json()
}

export async function fetchStudent(id) {
  const res = await fetch(`${BASE}/students/${id}`)
  if (!res.ok) throw new Error('Failed to fetch student')
  return res.json()
}

export async function fetchHighRisk() {
  const res = await fetch(`${BASE}/risk-scores/high`)
  if (!res.ok) throw new Error('Failed to fetch high risk')
  return res.json()
}

export async function logMentorAction(data) {
  const res = await fetch(`${BASE}/mentor-actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to log action')
  return res.json()
}
