'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesService } from '@/services/companies.service'
import { Plus, Pencil, Trash2, Image as ImageIcon, FileText, Tag, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'

interface Banner {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string
  buttonText: string | null
  buttonLink: string | null
  position: number
  isActive: boolean
}

interface Page {
  id: string
  title: string
  slug: string
  content: string
  isPublished: boolean
}

interface Category {
  id: string
  name: string
  slug: string
  _count: { vehicles: number }
}

// ── Banner form ───────────────────────────────────────────────────────────────

function BannerForm({ banner, onClose }: { banner?: Banner | null; onClose: () => void }) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string>(banner?.imageUrl ?? '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    title: banner?.title ?? '',
    subtitle: banner?.subtitle ?? '',
    imageUrl: banner?.imageUrl ?? '',
    buttonText: banner?.buttonText ?? '',
    buttonLink: banner?.buttonLink ?? '',
    position: banner?.position ?? 0,
    isActive: banner?.isActive ?? true,
  })

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      let bannerId = banner?.id
      if (!bannerId) {
        const res = await companiesService.createBanner({ ...data, imageUrl: data.imageUrl || 'placeholder' })
        bannerId = res.data.id
      } else {
        await companiesService.updateBanner(bannerId, data)
      }
      if (imageFile && bannerId) {
        await companiesService.uploadBannerImage(bannerId, imageFile)
      }
      return bannerId
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['banners'] })
      onClose()
    },
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setForm((f) => ({ ...f, imageUrl: '' }))
  }

  const previewSrc = imagePreview.startsWith('blob:')
    ? imagePreview
    : imagePreview.startsWith('/uploads/')
      ? `${API_URL}${imagePreview}`
      : imagePreview

  return (
    <>
      <DialogHeader>
        <DialogTitle>{banner ? 'Editar Banner' : 'Novo Banner'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <Input
          label="Título *"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Ex: Promoção de Janeiro"
        />
        <Input
          label="Subtítulo"
          value={form.subtitle}
          onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
          placeholder="Ex: Condições especiais neste mês"
        />

        {/* Image upload */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Imagem</label>
          <div
            className="relative w-full h-32 rounded-lg border-2 border-dashed border-border bg-muted/40 overflow-hidden cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewSrc ? (
              <img src={previewSrc} alt="preview" className="w-full h-full object-cover absolute inset-0" />
            ) : null}
            <div className={cn(
              'flex flex-col items-center gap-1 text-muted-foreground',
              previewSrc && 'absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center',
            )}>
              <Upload size={18} />
              <span className="text-xs font-medium">{previewSrc ? 'Trocar imagem' : 'Clique para fazer upload'}</span>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <p className="text-xs text-muted-foreground">ou informe uma URL:</p>
          <Input
            value={form.imageUrl}
            onChange={(e) => {
              setForm((f) => ({ ...f, imageUrl: e.target.value }))
              setImagePreview(e.target.value)
              setImageFile(null)
            }}
            placeholder="https://exemplo.com/banner.jpg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Texto do botão"
            value={form.buttonText}
            onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))}
            placeholder="Ver oferta"
          />
          <Input
            label="Link do botão"
            value={form.buttonLink}
            onChange={(e) => setForm((f) => ({ ...f, buttonLink: e.target.value }))}
            placeholder="/veiculos"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="w-4 h-4 rounded border-input text-primary"
          />
          <span className="text-sm text-foreground">Banner ativo no catálogo</span>
        </label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button variant="gradient" loading={mutation.isPending} onClick={() => mutation.mutate(form)}>
          {banner ? 'Salvar' : 'Criar banner'}
        </Button>
      </DialogFooter>
    </>
  )
}

// ── Page form ─────────────────────────────────────────────────────────────────

function PageForm({ page, onClose }: { page?: Page | null; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title: page?.title ?? '',
    slug: page?.slug ?? '',
    content: page?.content ?? '',
    isPublished: page?.isPublished ?? false,
  })

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      page
        ? companiesService.updatePage(page.id, data)
        : companiesService.createPage(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog-pages'] })
      onClose()
    },
  })

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value
    setForm((f) => ({
      ...f,
      title,
      slug: page
        ? f.slug
        : title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }))
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{page ? 'Editar Página' : 'Nova Página'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <Input label="Título *" value={form.title} onChange={handleTitleChange} placeholder="Sobre Nós" />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Slug (URL) *</label>
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-lg px-3 h-10 flex items-center select-none">
              /
            </span>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="sobre-nos"
              className="flex-1 h-10 px-3 rounded-r-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors font-mono"
            />
          </div>
        </div>
        <RichTextEditor
          label="Conteúdo *"
          value={form.content}
          onChange={(v) => setForm((f) => ({ ...f, content: v }))}
          placeholder="Escreva o conteúdo da página aqui..."
          rows={10}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
            className="w-4 h-4 rounded border-input text-primary"
          />
          <span className="text-sm text-foreground">Publicar página no catálogo</span>
        </label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button variant="gradient" loading={mutation.isPending} onClick={() => mutation.mutate(form)}>
          {page ? 'Salvar' : 'Criar página'}
        </Button>
      </DialogFooter>
    </>
  )
}

// ── Category form ─────────────────────────────────────────────────────────────

function CategoryForm({ category, onClose }: { category?: Category | null; onClose: () => void }) {
  const qc = useQueryClient()
  const [name, setName] = useState(category?.name ?? '')

  const mutation = useMutation({
    mutationFn: () =>
      category
        ? companiesService.updateCategory(category.id, name)
        : companiesService.createCategory(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      onClose()
    },
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle>{category ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
      </DialogHeader>
      <div className="py-2">
        <Input
          label="Nome *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: SUV, Sedan, Pickup..."
          onKeyDown={(e) => e.key === 'Enter' && mutation.mutate()}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button variant="gradient" loading={mutation.isPending} onClick={() => mutation.mutate()}>
          {category ? 'Salvar' : 'Criar categoria'}
        </Button>
      </DialogFooter>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'banners' | 'pages' | 'categories'

export default function CatalogManagementPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('banners')
  const [bannerDialog, setBannerDialog] = useState<{ open: boolean; banner?: Banner | null }>({ open: false })
  const [pageDialog, setPageDialog] = useState<{ open: boolean; page?: Page | null }>({ open: false })
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; category?: Category | null }>({ open: false })

  const { data: banners = [], isLoading: bannersLoading } = useQuery<Banner[]>({
    queryKey: ['banners'],
    queryFn: () => companiesService.getBanners().then((r) => r.data),
  })

  const { data: pages = [], isLoading: pagesLoading } = useQuery<Page[]>({
    queryKey: ['catalog-pages'],
    queryFn: () => companiesService.getPages().then((r) => r.data),
  })

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => companiesService.getCategories().then((r) => r.data),
  })

  const deleteBannerMutation = useMutation({
    mutationFn: (id: string) => companiesService.deleteBanner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners'] }),
  })

  const deletePageMutation = useMutation({
    mutationFn: (id: string) => companiesService.deletePage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog-pages'] }),
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => companiesService.deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'banners', label: 'Banners', icon: ImageIcon },
    { key: 'pages', label: 'Páginas', icon: FileText },
    { key: 'categories', label: 'Categorias', icon: Tag },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catálogo</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gerencie banners, páginas e categorias do seu site público</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              tab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Banners ── */}
      {tab === 'banners' && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Banners</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Aparecem na página inicial do catálogo público</p>
            </div>
            <Button variant="gradient" size="sm" onClick={() => setBannerDialog({ open: true, banner: null })}>
              <Plus size={15} />
              Novo banner
            </Button>
          </CardHeader>
          <CardContent>
            {bannersLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
              </div>
            ) : banners.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon size={36} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm font-medium">Nenhum banner cadastrado</p>
                <p className="text-muted-foreground text-xs mt-1">Banners aparecem no topo do seu catálogo público</p>
              </div>
            ) : (
              <div className="space-y-3">
                {banners.map((banner) => {
                  const imgSrc = banner.imageUrl.startsWith('/uploads/')
                    ? `${API_URL}${banner.imageUrl}`
                    : banner.imageUrl
                  return (
                    <div key={banner.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-muted/30">
                      <div className="w-20 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-border">
                        {imgSrc && <img src={imgSrc} alt={banner.title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{banner.title}</p>
                        {banner.subtitle && <p className="text-xs text-muted-foreground truncate">{banner.subtitle}</p>}
                      </div>
                      <Badge variant={banner.isActive ? 'success' : 'muted'}>
                        {banner.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon-sm" onClick={() => setBannerDialog({ open: true, banner })}>
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost" size="icon-sm"
                          className="hover:bg-destructive/10 hover:text-destructive"
                          loading={deleteBannerMutation.isPending}
                          onClick={() => deleteBannerMutation.mutate(banner.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Pages ── */}
      {tab === 'pages' && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Páginas</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Páginas personalizadas acessíveis no catálogo (Sobre, Termos, etc.)
              </p>
            </div>
            <Button variant="gradient" size="sm" onClick={() => setPageDialog({ open: true, page: null })}>
              <Plus size={15} />
              Nova página
            </Button>
          </CardHeader>
          <CardContent>
            {pagesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
              </div>
            ) : pages.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={36} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm font-medium">Nenhuma página cadastrada</p>
                <p className="text-muted-foreground text-xs mt-1">Crie páginas como "Sobre a loja", "Termos de uso", etc.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pages.map((page) => (
                  <div key={page.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-muted/30">
                    <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{page.title}</p>
                      <p className="text-xs text-muted-foreground font-mono">/{page.slug}</p>
                    </div>
                    <Badge variant={page.isPublished ? 'success' : 'muted'}>
                      {page.isPublished ? 'Publicada' : 'Rascunho'}
                    </Badge>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon-sm" onClick={() => setPageDialog({ open: true, page })}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost" size="icon-sm"
                        className="hover:bg-destructive/10 hover:text-destructive"
                        loading={deletePageMutation.isPending}
                        onClick={() => deletePageMutation.mutate(page.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Categories ── */}
      {tab === 'categories' && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Categorias</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Organize seus veículos por categoria (SUV, Sedan, Pickup...)
              </p>
            </div>
            <Button variant="gradient" size="sm" onClick={() => setCategoryDialog({ open: true, category: null })}>
              <Plus size={15} />
              Nova categoria
            </Button>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12">
                <Tag size={36} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm font-medium">Nenhuma categoria cadastrada</p>
                <p className="text-muted-foreground text-xs mt-1">Categorias ajudam a filtrar veículos no catálogo</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-muted/30">
                    <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                      <Tag size={15} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{cat._count.vehicles} veículo{cat._count.vehicles !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon-sm" onClick={() => setCategoryDialog({ open: true, category: cat })}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost" size="icon-sm"
                        className="hover:bg-destructive/10 hover:text-destructive"
                        loading={deleteCategoryMutation.isPending}
                        onClick={() => deleteCategoryMutation.mutate(cat.id)}
                        title={cat._count.vehicles > 0 ? 'Há veículos nesta categoria' : 'Excluir'}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Banner dialog */}
      <Dialog open={bannerDialog.open} onOpenChange={(open) => !open && setBannerDialog({ open: false })}>
        <DialogContent className="sm:max-w-lg">
          <BannerForm banner={bannerDialog.banner} onClose={() => setBannerDialog({ open: false })} />
        </DialogContent>
      </Dialog>

      {/* Page dialog */}
      <Dialog open={pageDialog.open} onOpenChange={(open) => !open && setPageDialog({ open: false })}>
        <DialogContent className="sm:max-w-2xl">
          <PageForm page={pageDialog.page} onClose={() => setPageDialog({ open: false })} />
        </DialogContent>
      </Dialog>

      {/* Category dialog */}
      <Dialog open={categoryDialog.open} onOpenChange={(open) => !open && setCategoryDialog({ open: false })}>
        <DialogContent className="sm:max-w-sm">
          <CategoryForm category={categoryDialog.category} onClose={() => setCategoryDialog({ open: false })} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
