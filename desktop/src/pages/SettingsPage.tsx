import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { ArrowRight, ImagePlus, Info, Palette, Save, Store, UploadCloud, Construction } from 'lucide-react'
import type { Company, StoreSettings, MaintenanceSettings } from '../types'
import { Button, errorText, Field, imageUrl, PageHeading, Spinner, Switch, TextArea } from '../ui'

export function SettingsPage({ apiOrigin, notify }: { apiOrigin: string; notify: (text: string, kind?: 'success' | 'error') => void }) {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [maintenance, setMaintenance] = useState<MaintenanceSettings | null>(null)
  const [savingMaintenance, setSavingMaintenance] = useState(false)

  useEffect(() => {
    Promise.all([window.cartalog.settings.get(), window.cartalog.company.get()])
      .then(([nextSettings, nextCompany]) => { setSettings(nextSettings); setCompany(nextCompany) })
      .catch((error) => notify(errorText(error), 'error'))
  }, [notify])

  useEffect(() => { window.cartalog.maintenance.get().then(setMaintenance).catch((error) => notify(errorText(error), 'error')) }, [notify])

  async function saveMaintenance() {
    if (!maintenance) return
    setSavingMaintenance(true)
    try {
      setMaintenance(await window.cartalog.maintenance.save({ enabled: maintenance.maintenanceEnabled, message: maintenance.maintenanceMessage }))
      notify(maintenance.maintenanceEnabled ? 'Site colocado em manutenção.' : 'Site público reativado.')
    } catch (error) { notify(errorText(error), 'error') }
    finally { setSavingMaintenance(false) }
  }

  function change<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setSettings((current) => current ? { ...current, [key]: value } : current)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!settings) return
    setSaving(true)
    try { setSettings(await window.cartalog.settings.save(settings)); notify('Configurações da loja salvas.') }
    catch (error) { notify(errorText(error), 'error') }
    finally { setSaving(false) }
  }

  async function uploadLogo() {
    setUploading(true)
    try {
      const result = await window.cartalog.settings.uploadLogo()
      if (result) { setCompany(await window.cartalog.company.get()); notify('Logo da loja atualizado.') }
    } catch (error) { notify(errorText(error), 'error') }
    finally { setUploading(false) }
  }

  return <>
    <PageHeading eyebrow="IDENTIDADE E CONFIGURAÇÕES" title="A sua loja, do seu jeito." description="Defina a marca, os contatos e as informações do catálogo público." />
    {!settings || !company ? <Spinner text="Carregando configurações" /> : <form onSubmit={save} className="settings-layout"><div className="settings-main">
      <section className="panel settings-section"><div className="section-title"><span className="section-icon"><Palette size={22} /></span><div><span className="eyebrow">IDENTIDADE VISUAL</span><h2>Marca da loja</h2><p>O vermelho Cartalog é o padrão. Você pode escolher as cores da sua loja.</p></div></div><div className="logo-row"><div className="logo-preview">{company.logoUrl ? <img src={imageUrl(company.logoUrl, apiOrigin)} alt={`Logo ${company.name}`} /> : <Store size={38} />}</div><div><strong>Logo da empresa</strong><p>PNG, JPG, WEBP ou SVG · até 2 MB</p><Button type="button" variant="secondary" onClick={uploadLogo} disabled={uploading}><UploadCloud size={17} /> {uploading ? 'Enviando...' : company.logoUrl ? 'Trocar logo' : 'Enviar logo'}</Button></div></div><div className="color-grid"><label className="field"><span className="field-label">Cor principal</span><div className="color-input"><input type="color" value={settings.primaryColor} onChange={(e) => change('primaryColor', e.target.value)} aria-label="Selecionar cor principal" /><input type="text" pattern="#[0-9a-fA-F]{6}" maxLength={7} value={settings.primaryColor} onChange={(e) => change('primaryColor', e.target.value)} aria-label="Código da cor principal" /></div></label><label className="field"><span className="field-label">Cor secundária</span><div className="color-input"><input type="color" value={settings.secondaryColor} onChange={(e) => change('secondaryColor', e.target.value)} aria-label="Selecionar cor secundária" /><input type="text" pattern="#[0-9a-fA-F]{6}" maxLength={7} value={settings.secondaryColor} onChange={(e) => change('secondaryColor', e.target.value)} aria-label="Código da cor secundária" /></div></label></div></section>
      <section className="panel settings-section"><div className="section-title"><span className="section-icon"><Palette size={22} /></span><div><span className="eyebrow">EXPERIÊNCIA DO CATÁLOGO</span><h2>Estilo e página inicial</h2><p>Escolha o fundo, a tipografia e a mensagem principal do site público.</p></div></div><div className="field-grid"><label className="field"><span className="field-label">Cor de fundo</span><div className="color-input"><input type="color" value={settings.backgroundColor} onChange={(e) => change('backgroundColor', e.target.value)} aria-label="Selecionar cor de fundo" /><input type="text" pattern="#[0-9a-fA-F]{6}" maxLength={7} value={settings.backgroundColor} onChange={(e) => change('backgroundColor', e.target.value)} aria-label="Código da cor de fundo" /></div></label><label className="field"><span className="field-label">Tipografia</span><select value={settings.fontFamily} onChange={(e) => change('fontFamily', e.target.value as StoreSettings['fontFamily'])}><option value="sans">Moderna</option><option value="serif">Editorial</option><option value="rounded">Arredondada</option></select></label></div><Field label="Título da página inicial" maxLength={180} placeholder="O próximo capítulo começa ao volante." value={settings.homeHeadline ?? ''} onChange={(e) => change('homeHeadline', e.target.value)} /><TextArea label="Descrição da página inicial" rows={3} maxLength={500} value={settings.homeSubheadline ?? ''} onChange={(e) => change('homeSubheadline', e.target.value)} /><Switch label="Mostrar números do estoque" description="Exibe o bloco com a quantidade de veículos e benefícios na página inicial." checked={settings.showHomeStats} onChange={(value) => change('showHomeStats', value)} /></section>      <section className="panel settings-section"><div className="section-title"><span className="section-icon"><Store size={22} /></span><div><span className="eyebrow">CONTATO</span><h2>Dados comerciais</h2><p>Informações para seus clientes encontrarem a loja.</p></div></div><div className="field-grid"><Field label="E-mail da loja" type="email" value={settings.email ?? ''} onChange={(e) => change('email', e.target.value)} /><Field label="Telefone" type="tel" value={settings.phone ?? ''} onChange={(e) => change('phone', e.target.value)} /></div><Field label="WhatsApp" type="tel" placeholder="5511999999999" hint="Informe com DDI e DDD, apenas números." value={settings.whatsapp ?? ''} onChange={(e) => change('whatsapp', e.target.value)} /><Field label="Endereço" value={settings.address ?? ''} onChange={(e) => change('address', e.target.value)} /><div className="field-grid field-grid-three"><Field label="Cidade" value={settings.city ?? ''} onChange={(e) => change('city', e.target.value)} /><Field label="UF" maxLength={2} value={settings.state ?? ''} onChange={(e) => change('state', e.target.value.toUpperCase())} /><Field label="CEP" value={settings.zipCode ?? ''} onChange={(e) => change('zipCode', e.target.value)} /></div></section>
      <section className="panel settings-section"><div className="section-title"><span className="section-icon"><ImagePlus size={22} /></span><div><span className="eyebrow">CATÁLOGO PÚBLICO</span><h2>Como os veículos aparecem</h2><p>Controle o que o visitante vê no site.</p></div></div><div className="switch-list"><Switch label="Mostrar preços" description="Exibe o valor dos veículos no catálogo." checked={settings.showPrices} onChange={(value) => change('showPrices', value)} /><Switch label="Botão do WhatsApp" description="Mostra o atalho de contato quando há um número configurado." checked={settings.showWhatsappButton} onChange={(value) => change('showWhatsappButton', value)} /></div></section>
      <section className="panel settings-section"><div className="section-title"><span className="section-icon"><Info size={22} /></span><div><span className="eyebrow">BUSCA</span><h2>Informações do site</h2><p>Título e descrição exibidos no catálogo e nos mecanismos de busca.</p></div></div><Field label="Título do site" maxLength={200} placeholder={`${company.name} · Veículos selecionados`} value={settings.siteTitle ?? ''} onChange={(e) => change('siteTitle', e.target.value)} /><TextArea label="Descrição" rows={3} maxLength={500} value={settings.siteDescription ?? ''} onChange={(e) => change('siteDescription', e.target.value)} /><Field label="Palavras-chave" maxLength={500} placeholder="carros, seminovos, veículos" value={settings.siteKeywords ?? ''} onChange={(e) => change('siteKeywords', e.target.value)} /></section>
      <section className="panel settings-section"><div className="section-title"><span className="section-icon"><Construction size={22} /></span><div><span className="eyebrow">CONTROLE DO DONO</span><h2>Manutenção do site</h2><p>Pause o catálogo público enquanto prepara alterações. O desktop, a equipe e os leads já recebidos continuam acessíveis.</p></div></div>{maintenance ? <><Switch label="Colocar site em manutenção" description="Visitantes verão apenas a mensagem abaixo e não poderão enviar novos leads." checked={maintenance.maintenanceEnabled} onChange={(value) => setMaintenance((current) => current ? { ...current, maintenanceEnabled: value } : current)} /><TextArea label="Mensagem para visitantes" rows={3} maxLength={500} placeholder="Voltamos em breve com novidades." value={maintenance.maintenanceMessage ?? ''} onChange={(event) => setMaintenance((current) => current ? { ...current, maintenanceMessage: event.target.value } : current)} /><div className="settings-save"><span>{maintenance.maintenanceUpdatedAt ? `Última alteração: ${new Date(maintenance.maintenanceUpdatedAt).toLocaleString('pt-BR')}` : 'Ainda não alterado.'}</span><Button type="button" onClick={saveMaintenance} disabled={savingMaintenance}><Save size={17} /> {savingMaintenance ? 'Salvando...' : 'Aplicar manutenção'}</Button></div></> : <Spinner text="Carregando estado do site" />}</section>
      <div className="settings-save"><span>As alterações passam a valer no catálogo depois de salvar.</span><Button type="submit" disabled={saving}><Save size={17} /> {saving ? 'Salvando...' : 'Salvar configurações'}</Button></div>
    </div><aside className="settings-aside"><div className="sticky-preview"><span className="eyebrow">PRÉVIA DA MARCA</span><div className="store-preview" style={{ '--store-primary': settings.primaryColor, '--store-secondary': settings.secondaryColor, backgroundColor: settings.backgroundColor, fontFamily: settings.fontFamily === 'serif' ? 'Georgia, serif' : settings.fontFamily === 'rounded' ? 'Trebuchet MS, sans-serif' : 'Inter, Segoe UI, sans-serif' } as CSSProperties}><div className="store-preview-top"><span className="store-preview-mark">{company.logoUrl ? <img src={imageUrl(company.logoUrl, apiOrigin)} alt="" /> : <Store size={22} />}</span><strong>{company.name}</strong></div><div className="store-preview-photo"><Store size={44} /></div><div className="store-preview-body"><small>SELEÇÃO DA LOJA</small><strong>{settings.homeHeadline?.trim() || 'Seu próximo carro começa aqui.'}</strong><span>{settings.homeSubheadline?.trim() || 'Veículos escolhidos para a sua próxima viagem.'}</span><b>Explorar veículos <ArrowRight size={14} /></b></div></div><div className="preview-note">Prévia ilustrativa. O catálogo final usa seus veículos, banners e páginas cadastrados.</div></div></aside></form>}
  </>
}
