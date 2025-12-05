import { redirect } from 'next/navigation'

// Old dashboard route - redirect to new helpdesk route
export default function DashboardPage() {
  redirect('/helpdesk/dashboard')
}