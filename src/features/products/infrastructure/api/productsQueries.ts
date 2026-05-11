import { useQuery } from '@tanstack/react-query'
import type { Product } from '@/features/products/domain/models/Product'
import { ProductMapper } from '@/features/products/infrastructure/mappers/ProductMapper'
import { productsApi } from '@/features/products/infrastructure/api/productsApi'

const mapper = new ProductMapper()

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
}

export function useProductsQuery() {
  return useQuery({
    queryKey: productKeys.lists(),
    queryFn: async (): Promise<Product[]> => {
      const dtos = await productsApi.getAll()
      return dtos.map((dto) => mapper.toDomain(dto))
    },
  })
}
