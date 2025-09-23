import AuthForm from '@/components/auth/AuthForm'

export default function SignUp() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <AuthForm mode="signup" />
    </div>
  )
}