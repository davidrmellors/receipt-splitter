import AuthForm from '@/components/auth/AuthForm'

export default function SignIn() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <AuthForm mode="signin" />
    </div>
  )
}