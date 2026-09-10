'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'

export default function AdminSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSetup() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/setup-admin', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 403) {
          setError('There is already an admin in the system.')
        } else {
          setError(data.error ?? 'Something went wrong')
        }
        return
      }

      toast.success('You are now an admin!')
      router.push('/admin')
      router.refresh()
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield size={24} className="text-primary" />
          </div>
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>
            No admin has been set up yet. Would you like to become the first
            administrator?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm text-center">
              {error}
            </div>
          )}
          <Button
            onClick={handleSetup}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Setting up...' : 'Become the First Admin'}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="w-full"
          >
            Go Home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
