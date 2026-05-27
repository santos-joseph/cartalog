export interface PaginationParams {
  page?: number
  perPage?: number
}

export interface PaginationMeta {
  total: number
  page: number
  perPage: number
  lastPage: number
}

export function getPaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page ?? 1)
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 12))
  const skip = (page - 1) * perPage
  return { page, perPage, skip, take: perPage }
}

export function buildMeta(total: number, page: number, perPage: number): PaginationMeta {
  return {
    total,
    page,
    perPage,
    lastPage: Math.ceil(total / perPage),
  }
}
