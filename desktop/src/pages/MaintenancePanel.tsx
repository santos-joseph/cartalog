import { useEffect, useState } from 'react'
import { Construction, Save } from 'lucide-react'
import type { MaintenanceSettings } from '../types'
import { Button, errorText, Spinner, Switch, TextArea } from '../ui'

type Notify = (text: string, kind?: 'success' | 'error') => void

export function MaintenancePanel({ notify }: { notify: Notify }) {
  const [saved, setSaved] = useState<MaintenanceSettings | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    window.cartalog.maintenance.get()
      .then((settings) => {
        if (!active) return
        setSaved(settings)
        setEnabled(settings.maintenanceEnabled)
        setMessage(settings.maintenanceMessage ?? '')
      })
      .catch((cause) => { if (active) setError(errorText(cause)) })
    return () => { active = false }
  }, [])

  async function apply() {
    setSaving(true)
    setError('')
    try {
      const result = await window.cartalog.maintenance.save({ enabled, message: message.trim() || null })
      setSaved(result)
      setEnabled(result.maintenanceEnabled)
      setMessage(result.maintenanceMessage ?? '')
      notify(result.maintenanceEnabled ? 'Site colocado em manutenção.' : 'Site público reativado.')
    } catch (cause) {
      setError(errorText(cause))
    } finally {
      setSaving(false)
    }
  }

  return <section className="panel settings-section">
    <div className="section-title"><span className="section-icon"><Construction size={22} /></span><div><span className="eyebrow">CONTROLE DO DONO</span><h2>Manutenção do site</h2><p>Pause o catálogo público enquanto prepara alterações. O desktop, a equipe e os leads já recebidos continuam acessíveis.</p></div></div>
    {saved ? <>
      <Switch label="Colocar site em manutenção" description="Visitantes verão apenas a mensagem abaixo e não poderão enviar novos leads." checked={enabled} onChange={setEnabled} />
      <TextArea label="Mensagem para visitantes" rows={3} maxLength={500} placeholder="Voltamos em breve com novidades." value={message} onChange={(event) => setMessage(event.target.value)} />
      <div className="settings-save"><span>{saved.maintenanceUpdatedAt ? `Última alteração: ${new Date(saved.maintenanceUpdatedAt).toLocaleString('pt-BR')}` : 'Ainda não alterado.'}</span><Button type="button" onClick={() => void apply()} disabled={saving || (enabled === saved.maintenanceEnabled && message.trim() === (saved.maintenanceMessage ?? '').trim())}><Save size={17} /> {saving ? 'Salvando...' : 'Aplicar manutenção'}</Button></div>
    </> : !error ? <Spinner text="Carregando estado do site" /> : null}
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>
}
