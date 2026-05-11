import type { ProductDTO } from '@/features/products/application/dto/ProductDTO'

const MOCK_PRODUCTS: ProductDTO[] = [
  {
    id: '1',
    name: 'Laptop Pro',
    price: 1599,
    stock: 4,
    category: 'electronics',
    created_at: '2026-04-02T12:00:00.000Z',
  },
  {
    id: '2',
    name: 'Wireless Mouse',
    price: 39,
    stock: 120,
    category: 'electronics',
    created_at: '2026-04-10T09:30:00.000Z',
  },
  {
    id: '3',
    name: 'Desk Lamp',
    price: 45,
    stock: 0,
    category: 'furniture',
    created_at: '2026-04-28T14:15:00.000Z',
  },
  {
    id: '4',
    name: 'Standing Desk',
    price: 499,
    stock: 8,
    category: 'furniture',
    created_at: '2026-05-01T10:00:00.000Z',
  },
  {
    id: '5',
    name: 'USB-C Cable',
    price: 18,
    stock: 200,
    category: 'electronics',
    created_at: '2026-05-08T08:45:00.000Z',
  },
]

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export const productsApi = {
  async getAll(): Promise<ProductDTO[]> {
    await delay(450)
    return [...MOCK_PRODUCTS]
  },
}
