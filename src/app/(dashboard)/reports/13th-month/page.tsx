import { redirect } from 'next/navigation'

export default function ThirteenthMonthRedirect() {
  const currentYear = new Date().getFullYear()
  redirect(`/reports/13th-month/${currentYear}`)
}
