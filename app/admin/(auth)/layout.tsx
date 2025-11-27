export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth pages (login) have no sidebar/header
  return <>{children}</>
}

