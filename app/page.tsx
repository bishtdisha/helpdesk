import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  // Check for session token server-side
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session-token')

  // If authenticated, redirect to helpdesk
  if (sessionToken) {
    redirect('/helpdesk/dashboard')
  }

  // If not authenticated, redirect to login
  redirect('/login')
}
