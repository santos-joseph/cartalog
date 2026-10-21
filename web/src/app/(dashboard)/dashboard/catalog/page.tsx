import { redirect } from 'next/navigation'

export default function DesktopOnlyPage() {
  redirect('/dashboard')
}
