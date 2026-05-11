export class Product {
  public readonly id: string
  public readonly name: string
  public readonly price: number
  public readonly stock: number
  public readonly category: string
  public readonly createdAt: Date

  constructor(
    id: string,
    name: string,
    price: number,
    stock: number,
    category: string,
    createdAt: Date,
  ) {
    this.id = id
    this.name = name
    this.price = price
    this.stock = stock
    this.category = category
    this.createdAt = createdAt
  }

  isInStock(): boolean {
    return this.stock > 0
  }

  isLowStock(): boolean {
    return this.stock > 0 && this.stock <= 10
  }

  getStockStatusLabel(): string {
    if (!this.isInStock()) return 'Out of Stock'
    if (this.isLowStock()) return 'Low Stock'
    return 'In Stock'
  }

  canBePurchased(quantity: number): boolean {
    return this.isInStock() && this.stock >= quantity
  }

  getDiscountedPrice(discountPercentage: number): number {
    return this.price * (1 - discountPercentage / 100)
  }
}
