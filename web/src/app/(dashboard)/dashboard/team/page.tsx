'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  lastLoginAt: string | null
  createdAt: string
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Gerente',
  SELLER: 'Vendedor',
}

export default function TeamPage() {
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'SELLER' })
  const [formError, setFormError] = useState('')

  const { data: members = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ['team'],
    queryFn: () => api.get('/users').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/users', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] })
      setShowForm(false)
      setForm({ name: '', email: '', password: '', role: 'SELLER' })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } }
      setFormError(e?.response?.data?.error ?? 'Erro ao criar usuário')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  })

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
          <p className="text-gray-500 mt-1">{members.length} membros</p>
        </div>
        {currentUser?.role === 'ADMIN' && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} />
            Novo membro
          </Button>
        )}
      </div>

      {/* Form de criação */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Adicionar membro da equipe</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nome" value={form.name} onChange={set('name')} required />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
            <Input label="Senha" type="password" value={form.password} onChange={set('password')} required helper="Mínimo 8 caracteres, 1 maiúscula e 1 número" />
            <div>
              <label className="text-sm font-medium text-gray-700">Função</label>
              <select value={form.role} onChange={set('role')} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="SELLER">Vendedor</option>
                <option value="MANAGER">Gerente</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate(form)}>Criar</Button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Nenhum membro além de você</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Membro</th>
                <th className="px-4 py-3">Função</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Último acesso</th>
                <th className="px-4 py-3">Desde</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={m.role === 'ADMIN' ? 'default' : m.role === 'MANAGER' ? 'warning' : 'gray'}>
                      {roleLabels[m.role] ?? m.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={m.active ? 'success' : 'danger'}>{m.active ? 'Ativo' : 'Inativo'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {m.lastLoginAt ? formatDate(m.lastLoginAt) : 'Nunca'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(m.createdAt)}</td>
                  <td className="px-4 py-3">
                    {currentUser?.role === 'ADMIN' && m.id !== currentUser.id && (
                      <button
                        onClick={() => {
                          if (confirm(`Remover ${m.name}?`)) deleteMutation.mutate(m.id)
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
