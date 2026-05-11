import type { ProductDTO } from '@/features/products/application/dto/ProductDTO'
import { Product } from '@/features/products/domain/models/Product'

export class ProductMapper {
  toDomain(dto: ProductDTO): Product {
    return new Product(
      dto.id,
      dto.name,
      dto.price,
      dto.stock,
      dto.category,
      new Date(dto.created_at),
    )
  }
}
