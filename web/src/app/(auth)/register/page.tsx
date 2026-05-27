'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [form, setForm] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    userName: '',
    userEmail: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authService.register(form)
      setAuth(data)
      router.push('/dashboard')
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string; details?: unknown } } }
      setError(apiError?.response?.data?.error ?? 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Cartalog</h1>
          <p className="text-gray-500 mt-1">Crie seu catálogo de veículos</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Criar nova empresa</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dados da empresa</p>

            <Input label="Nome da empresa" placeholder="Ex: Auto Silva" value={form.companyName} onChange={set('companyName')} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Email da empresa" type="email" placeholder="contato@empresa.com" value={form.companyEmail} onChange={set('companyEmail')} required />
              <Input label="Telefone" type="tel" placeholder="(11) 99999-9999" value={form.companyPhone} onChange={set('companyPhone')} />
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Seu acesso de administrador</p>

            <Input label="Seu nome" placeholder="João Silva" value={form.userName} onChange={set('userName')} required />
            <Input label="Seu email" type="email" placeholder="joao@empresa.com" value={form.userEmail} onChange={set('userEmail')} required />
            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={set('password')}
              required
              helper="Mínimo 8 caracteres, 1 maiúscula e 1 número"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Criar conta grátis
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem conta?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
