import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to overview - no separate landing page
  redirect('/overview')
}
