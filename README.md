# Frontend DDD Architecture Rules with TypeScript and React

## Core Principles

1. **Feature-Based Organization**: Group all related code within feature folders
2. **Strict Layer Boundaries**: Each layer has specific responsibilities and dependencies flow in one direction
3. **TypeScript Throughout**: Ensure type safety across all layers
4. **Thin React Components**: Components only handle UI rendering
5. **Testable Domain Logic**: Business logic isolated from React for easy unit testing
6. **Server State Management**: TanStack Query handles all server state at the infrastructure boundary
7. **Tailwind for UI styling**: Presentation and shared UI use **Tailwind CSS** (utility-first). Styling stays out of domain, application, and infrastructure code.

## Tech stack — Tailwind CSS

This project treats **Tailwind CSS** as the standard for visual design and layout.

- **Where**: Use Tailwind utilities on `className` in `@/features/*/presentation/**` and `@/shared/presentation/**` (and app shell/layout components such as `@/app/**` when they only orchestrate UI).
- **`cn()` merges**: Prefer a single `cn(...)` helper (e.g. `clsx` plus `tailwind-merge`) under `@/shared/lib/` for conditional or overlapping classes instead of manual string concatenation.
- **Global CSS**: Keep root styles minimal: Tailwind entry (`@tailwind` directives or `@import "tailwindcss"` depending on Tailwind major version), optional design tokens (`@theme` / CSS variables), and document-level defaults only. Avoid large hand-written `.css` files per feature unless integrating a library that requires it.
- **`@apply`**: Use sparingly for repeated base primitives; default to utilities in JSX.
- **Documentation examples**: Older snippets in this rule file may show generic string `className` values (for example `"product-card"`). When implementing in **this** repo, express the same layouts and states with Tailwind utilities instead.

## Architecture Layers

### 1. Domain Layer (Frontend Business Logic)

**Path**: `@/features/{feature}/domain/`

**Responsibilities**:

- Frontend business rules and validation
- Data models with behaviors
- Value objects with immutable data
- Domain services for business logic
- **NO persistence logic** (backend API handles all data storage)

**Structure**:
domain/
├── models/ # Domain entities with behaviors
├── value-objects/ # Immutable objects with validation
└── services/ # Business logic services

**Example - Domain Model**:

```typescript
// @/features/products/domain/models/Product.ts
export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly price: number,
    public readonly stock: number,
    public readonly category: string,
    public readonly createdAt: Date,
  ) {}

  // Frontend business logic
  isInStock(): boolean {
    return this.stock > 0;
  }

  isLowStock(): boolean {
    return this.stock > 0 && this.stock <= 10;
  }

  getStockStatusLabel(): string {
    if (!this.isInStock()) return "Out of Stock";
    if (this.isLowStock()) return "Low Stock";
    return "In Stock";
  }

  canBePurchased(quantity: number): boolean {
    return this.isInStock() && this.stock >= quantity;
  }

  getDiscountedPrice(discountPercentage: number): number {
    return this.price * (1 - discountPercentage / 100);
  }
}
```

**Example - Value Object**:

```typescript
// @/features/products/domain/value-objects/Price.ts
export class Price {
  private constructor(private readonly amount: number) {
    if (amount < 0) {
      throw new Error("Price cannot be negative");
    }
  }

  static create(amount: number): Price {
    return new Price(amount);
  }

  getValue(): number {
    return this.amount;
  }

  format(currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(this.amount);
  }

  add(other: Price): Price {
    return new Price(this.amount + other.amount);
  }

  multiply(factor: number): Price {
    return new Price(this.amount * factor);
  }
}
```

**Example - Domain Service**:

```typescript
// @/features/products/domain/services/ProductValidationService.ts
import { Product } from "@/features/products/domain/models/Product";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export class ProductValidationService {
  validateCreateForm(data: {
    name: string;
    price: number;
    stock: number;
    category: string;
  }): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data.name || data.name.trim().length < 3) {
      errors.push({
        field: "name",
        message: "Product name must be at least 3 characters",
      });
    }

    if (data.price <= 0) {
      errors.push({
        field: "price",
        message: "Price must be greater than 0",
      });
    }

    if (data.stock < 0) {
      errors.push({
        field: "stock",
        message: "Stock cannot be negative",
      });
    }

    if (!data.category || data.category.trim().length === 0) {
      errors.push({
        field: "category",
        message: "Category is required",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateProduct(product: Product): ValidationResult {
    const errors: ValidationError[] = [];

    if (product.price <= 0) {
      errors.push({
        field: "price",
        message: "Invalid price",
      });
    }

    if (product.stock < 0) {
      errors.push({
        field: "stock",
        message: "Invalid stock quantity",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

**Example - Domain Service (Filtering)**:

```typescript
// @/features/products/domain/services/ProductFilterService.ts
import { Product } from "@/features/products/domain/models/Product";

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  searchTerm?: string;
}

export type SortOption = "name" | "price-asc" | "price-desc" | "newest";

export class ProductFilterService {
  filterProducts(products: Product[], filters: ProductFilters): Product[] {
    let filtered = [...products];

    if (filters.category) {
      filtered = filtered.filter((p) => p.category === filters.category);
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters.inStock !== undefined) {
      filtered = filtered.filter((p) => p.isInStock() === filters.inStock);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(term));
    }

    return filtered;
  }

  sortProducts(products: Product[], sortBy: SortOption): Product[] {
    const sorted = [...products];

    switch (sortBy) {
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "price-asc":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "newest":
        return sorted.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
      default:
        return sorted;
    }
  }
}
```

---

### 2. Application Layer (Orchestration)

**Path**: `@/features/{feature}/application/`

**Responsibilities**:

- Coordinate domain services and infrastructure
- Transform data between DTOs and Domain Models
- Implement use cases
- Handle application-level workflows

**Structure**:
application/
├── dto/ # Data Transfer Objects for API communication
├── use-cases/ # Application use cases
└── services/ # Application services (optional)

**Example - DTOs**:

```typescript
// @/features/products/application/dto/ProductDTO.ts
export interface ProductDTO {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  created_at: string; // API format
}

export interface CreateProductDTO {
  name: string;
  price: number;
  stock: number;
  category: string;
}

export interface UpdateProductDTO {
  name?: string;
  price?: number;
  stock?: number;
  category?: string;
}
```

**Example - Use Case**:

```typescript
// @/features/products/application/use-cases/GetProductsUseCase.ts
import { Product } from "@/features/products/domain/models/Product";
import { ProductsApi } from "@/features/products/infrastructure/api/productsApi";
import { ProductMapper } from "@/features/products/infrastructure/mappers/ProductMapper";

export class GetProductsUseCase {
  constructor(
    private readonly api: ProductsApi,
    private readonly mapper: ProductMapper,
  ) {}

  async execute(): Promise<Product[]> {
    const dtos = await this.api.getAll();
    return dtos.map((dto) => this.mapper.toDomain(dto));
  }
}
```

**Example - Use Case (Create)**:

```typescript
// @/features/products/application/use-cases/CreateProductUseCase.ts
import { Product } from "@/features/products/domain/models/Product";
import { CreateProductDTO } from "@/features/products/application/dto/ProductDTO";
import { ProductsApi } from "@/features/products/infrastructure/api/productsApi";
import { ProductMapper } from "@/features/products/infrastructure/mappers/ProductMapper";
import { ProductValidationService } from "@/features/products/domain/services/ProductValidationService";

export class CreateProductUseCase {
  constructor(
    private readonly api: ProductsApi,
    private readonly mapper: ProductMapper,
    private readonly validationService: ProductValidationService,
  ) {}

  async execute(dto: CreateProductDTO): Promise<Product> {
    // Validate before sending to API
    const validation = this.validationService.validateCreateForm(dto);

    if (!validation.isValid) {
      throw new Error(validation.errors.map((e) => e.message).join(", "));
    }

    const responseDto = await this.api.create(dto);
    return this.mapper.toDomain(responseDto);
  }
}
```

---

### 3. Infrastructure Layer (API Communication)

**Path**: `@/features/{feature}/infrastructure/`

**Responsibilities**:

- Communicate with external backend API
- Manage server state with TanStack Query
- Map between API DTOs and Domain Models
- Handle HTTP requests and responses

**Structure**:
infrastructure/
├── api/ # API client functions and TanStack Query hooks
└── mappers/ # DTO ↔ Domain Model mappers

**Example - API Client**:

```typescript
// @/features/products/infrastructure/api/productsApi.ts
import { apiClient } from "@/shared/infrastructure/api/apiClient";
import {
  ProductDTO,
  CreateProductDTO,
  UpdateProductDTO,
} from "@/features/products/application/dto/ProductDTO";

export const productsApi = {
  async getAll(): Promise<ProductDTO[]> {
    const response = await apiClient.get<ProductDTO[]>("/products");
    return response.data;
  },

  async getById(id: string): Promise<ProductDTO> {
    const response = await apiClient.get<ProductDTO>(`/products/${id}`);
    return response.data;
  },

  async create(data: CreateProductDTO): Promise<ProductDTO> {
    const response = await apiClient.post<ProductDTO>("/products", data);
    return response.data;
  },

  async update(id: string, data: UpdateProductDTO): Promise<ProductDTO> {
    const response = await apiClient.patch<ProductDTO>(`/products/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },
};
```

**Example - TanStack Query Hooks**:

```typescript
// @/features/products/infrastructure/api/productsQueries.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/features/products/infrastructure/api/productsApi";
import { ProductMapper } from "@/features/products/infrastructure/mappers/ProductMapper";
import { Product } from "@/features/products/domain/models/Product";
import {
  CreateProductDTO,
  UpdateProductDTO,
} from "@/features/products/application/dto/ProductDTO";

const mapper = new ProductMapper();

// Query Keys Factory
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: string) => [...productKeys.lists(), { filters }] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

// Queries
export function useProductsQuery() {
  return useQuery({
    queryKey: productKeys.lists(),
    queryFn: async () => {
      const apiData = await productsApi.getAll();
      return apiData.map((dto) => mapper.toDomain(dto));
    },
  });
}

export function useProductQuery(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const apiData = await productsApi.getById(id);
      return mapper.toDomain(apiData);
    },
    enabled: !!id,
  });
}

// Mutations
export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateProductDTO) => {
      const apiResponse = await productsApi.create(dto);
      return mapper.toDomain(apiResponse);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProductDTO;
    }) => {
      const apiResponse = await productsApi.update(id, data);
      return mapper.toDomain(apiResponse);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
```

**Example - Mapper**:

```typescript
// @/features/products/infrastructure/mappers/ProductMapper.ts
import { Product } from "@/features/products/domain/models/Product";
import { ProductDTO } from "@/features/products/application/dto/ProductDTO";

export class ProductMapper {
  toDomain(dto: ProductDTO): Product {
    return new Product(
      dto.id,
      dto.name,
      dto.price,
      dto.stock,
      dto.category,
      new Date(dto.created_at),
    );
  }

  toDTO(domain: Product): ProductDTO {
    return {
      id: domain.id,
      name: domain.name,
      price: domain.price,
      stock: domain.stock,
      category: domain.category,
      created_at: domain.createdAt.toISOString(),
    };
  }
}
```

---

### 4. Presentation Layer (React UI)

**Path**: `@/features/{feature}/presentation/`

**Responsibilities**:

- Render UI components
- Style with **Tailwind CSS** utilities (`className`); optionally shared `cn()` for variants
- Handle user interactions
- Manage local UI state
- Consume infrastructure queries through presentation hooks

**Structure**:
presentation/
├── components/
│ ├── ui/ # Pure presentational components
│ └── logic/ # Components with business logic orchestration
├── hooks/ # Custom presentation hooks
└── pages/ # Route-level components

**Example - Presentation Hook (Wrapping Infrastructure Query)**:

```typescript
// @/features/products/presentation/hooks/useProducts.ts
import { useMemo } from "react";
import { useProductsQuery } from "@/features/products/infrastructure/api/productsQueries";
import {
  ProductFilterService,
  ProductFilters,
} from "@/features/products/domain/services/ProductFilterService";

const filterService = new ProductFilterService();

export function useProducts(filters?: ProductFilters) {
  const { data: products = [], isLoading, error } = useProductsQuery();

  const filteredProducts = useMemo(() => {
    if (!filters) return products;
    return filterService.filterProducts(products, filters);
  }, [products, filters]);

  return {
    products: filteredProducts,
    isLoading,
    error,
    isEmpty: filteredProducts.length === 0,
  };
}
```

**Example - Presentation Hook (UI State Management)**:

```typescript
// @/features/products/presentation/hooks/useProductFilters.ts
import { useState, useMemo } from "react";
import { Product } from "@/features/products/domain/models/Product";
import {
  ProductFilterService,
  ProductFilters,
  SortOption,
} from "@/features/products/domain/services/ProductFilterService";

const filterService = new ProductFilterService();

export function useProductFilters(products: Product[]) {
  const [filters, setFilters] = useState<ProductFilters>({});
  const [sortBy, setSortBy] = useState<SortOption>("name");

  const filteredProducts = useMemo(() => {
    const filtered = filterService.filterProducts(products, filters);
    return filterService.sortProducts(filtered, sortBy);
  }, [products, filters, sortBy]);

  const updateFilter = (key: keyof ProductFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return {
    filters,
    sortBy,
    filteredProducts,
    updateFilter,
    setSortBy,
    clearFilters,
  };
}
```

**Example - Presentation Hook (Actions)**:

```typescript
// @/features/products/presentation/hooks/useProductActions.ts
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "@/features/products/infrastructure/api/productsQueries";
import {
  CreateProductDTO,
  UpdateProductDTO,
} from "@/features/products/application/dto/ProductDTO";
import { ProductValidationService } from "@/features/products/domain/services/ProductValidationService";

const validationService = new ProductValidationService();

export function useProductActions() {
  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();
  const deleteMutation = useDeleteProductMutation();

  const createProduct = async (dto: CreateProductDTO) => {
    const validation = validationService.validateCreateForm(dto);
    if (!validation.isValid) {
      throw new Error(validation.errors.map((e) => e.message).join(", "));
    }
    return createMutation.mutateAsync(dto);
  };

  const updateProduct = async (id: string, dto: UpdateProductDTO) => {
    return updateMutation.mutateAsync({ id, data: dto });
  };

  const deleteProduct = async (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

**Example - UI Component (Pure Presentational)**:

```typescript
// @/features/products/presentation/components/ui/ProductCard.tsx
import { Product } from '@/features/products/domain/models/Product';

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p className="price">${product.price.toFixed(2)}</p>
      <p className="category">{product.category}</p>
      <p className={`stock-status ${product.isInStock() ? 'in-stock' : 'out-of-stock'}`}>
        {product.getStockStatusLabel()}
      </p>
      <div className="actions">
        {onEdit && (
          <button onClick={() => onEdit(product)}>Edit</button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(product)}>Delete</button>
        )}
      </div>
    </div>
  );
}
```

**Example - UI Component (Grid)**:

```typescript
// @/features/products/presentation/components/ui/ProductGrid.tsx
import { Product } from '@/features/products/domain/models/Product';
import { ProductCard } from '@/features/products/presentation/components/ui/ProductCard';

interface ProductGridProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export function ProductGrid({ products, onEdit, onDelete }: ProductGridProps) {
  if (products.length === 0) {
    return <div className="empty-state">No products found</div>;
  }

  return (
    <div className="product-grid">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
```

**Example - Logic Component (Orchestration)**:

```typescript
// @/features/products/presentation/components/logic/ProductList.tsx
import { useState } from 'react';
import { useProducts } from '@/features/products/presentation/hooks/useProducts';
import { useProductFilters } from '@/features/products/presentation/hooks/useProductFilters';
import { useProductActions } from '@/features/products/presentation/hooks/useProductActions';
import { ProductGrid } from '@/features/products/presentation/components/ui/ProductGrid';
import { ProductFilters } from '@/features/products/presentation/components/ui/ProductFilters';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import { Product } from '@/features/products/domain/models/Product';

export function ProductList() {
  const { products, isLoading, error } = useProducts();
  const { filteredProducts, filters, sortBy, updateFilter, setSortBy, clearFilters } = useProductFilters(products);
  const { deleteProduct, isDeleting } = useProductActions();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleDelete = async (product: Product) => {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await deleteProduct(product.id);
      } catch (err) {
        alert('Failed to delete product');
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load products" />;
  }

  return (
    <div className="product-list">
      <ProductFilters
        filters={filters}
        sortBy={sortBy}
        onFilterChange={updateFilter}
        onSortChange={setSortBy}
        onClearFilters={clearFilters}
      />
      <ProductGrid
        products={filteredProducts}
        onEdit={setSelectedProduct}
        onDelete={handleDelete}
      />
    </div>
  );
}
```

**Example - Page Component**:

```typescript
// @/features/products/presentation/pages/ProductsPage.tsx
import { ProductList } from '@/features/products/presentation/components/logic/ProductList';
import { PageHeader } from '@/shared/components/ui/PageHeader';

export function ProductsPage() {
  return (
    <div className="products-page">
      <PageHeader title="Products" />
      <ProductList />
    </div>
  );
}
```

---

## Complete Project Structure

src/
├── features/
│ └── products/
│ ├── domain/
│ │ ├── models/
│ │ │ └── Product.ts
│ │ ├── value-objects/
│ │ │ └── Price.ts
│ │ └── services/
│ │ ├── ProductValidationService.ts
│ │ └── ProductFilterService.ts
│ ├── application/
│ │ ├── dto/
│ │ │ └── ProductDTO.ts
│ │ └── use-cases/
│ │ ├── GetProductsUseCase.ts
│ │ └── CreateProductUseCase.ts
│ ├── infrastructure/
│ │ ├── api/
│ │ │ ├── productsApi.ts
│ │ │ └── productsQueries.ts
│ │ └── mappers/
│ │ └── ProductMapper.ts
│ └── presentation/
│ ├── components/
│ │ ├── ui/
│ │ │ ├── ProductCard.tsx
│ │ │ ├── ProductGrid.tsx
│ │ │ └── ProductFilters.tsx
│ │ └── logic/
│ │ └── ProductList.tsx
│ ├── hooks/
│ │ ├── useProducts.ts
│ │ ├── useProductFilters.ts
│ │ └── useProductActions.ts
│ └── pages/
│ └── ProductsPage.tsx
└── shared/
├── components/
│ └── ui/
│ ├── LoadingSpinner.tsx
│ ├── ErrorMessage.tsx
│ └── PageHeader.tsx
└── infrastructure/
└── api/
└── apiClient.ts

---

## Dependency Flow Rules

Presentation Layer
↓ (can import from)
Infrastructure Layer
↓ (can import from)
Application Layer
↓ (can import from)
Domain Layer
↓ (imports nothing from features)

**Key Rules**:

1. **Domain Layer**: Imports nothing from other feature layers (only shared utilities)
2. **Application Layer**: Can import from Domain only
3. **Infrastructure Layer**: Can import from Domain and Application
4. **Presentation Layer**: Can import from all layers

---

## TanStack Query Integration Rules

1. **Query definitions live in Infrastructure layer** (`productsQueries.ts`)
2. **Data mapping happens immediately** after API fetch (DTO → Domain Model)
3. **Presentation hooks** wrap infrastructure queries and add UI-specific logic
4. **Domain services** are called in presentation hooks for filtering/sorting/validation
5. **Mutations** handle cache invalidation and optimistic updates
6. **Query keys** are centralized using a factory pattern
7. **Components** only consume presentation hooks, never infrastructure queries directly

---

## Alias Configuration

**TypeScript Configuration** (`tsconfig.json`):

````json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths"
```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "@/features/*": ["features/*"],
      "@/shared/*": ["shared/*"]
    }
  }
}
````

**Vite Configuration** (`vite.config.ts`):

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

---

# Clean Architecture Rules

## ✅ Allowed

```typescript
import { Product } from "@/features/products/domain/models/Product";

import { useProductsQuery } from "@/features/products/infrastructure/api/productsQueries";

import { ProductGrid } from "@/features/products/presentation/components/ui/ProductGrid";

import { apiClient } from "@/shared/infrastructure/api/apiClient";
```

---

## ❌ Forbidden

### Domain importing infrastructure

```typescript
// ❌ NOT ALLOWED
import { productsApi } from "@/features/products/infrastructure/api/productsApi";
```

### UI components calling API directly

```typescript
// ❌ NOT ALLOWED
const response = await fetch("/api/products");
```

### Components containing business logic

```typescript
// ❌ NOT ALLOWED
if (product.stock > 0 && product.stock <= 10) {
  return "Low Stock";
}
```

Move to:

```typescript
product.isLowStock();
```

### Infrastructure leaking DTOs into UI

```typescript
// ❌ NOT ALLOWED
const data: ProductDTO[] = await productsApi.getAll();
```

Always map:

```typescript
const products: Product[] = data.map(mapper.toDomain);
```

---

# Recommended Conventions

## Naming

### Models

```typescript
Product;
User;
Order;
```

### DTOs

```typescript
ProductDTO;
CreateProductDTO;
UpdateProductDTO;
```

### Services

```typescript
ProductValidationService;
ProductFilterService;
PriceCalculationService;
```

### Hooks

```typescript
useProducts;
useProductActions;
useProductFilters;
```

### Query Hooks

```typescript
useProductsQuery;
useCreateProductMutation;
useUpdateProductMutation;
```

---

# State Management Rules

## TanStack Query

Use for:

- Server state
- API caching
- Background refetching
- Mutations
- Loading/error states

## React State

Use for:

- Modal open/close
- Form inputs
- UI toggles
- Temporary UI state

## Domain Services

Use for:

- Filtering
- Sorting
- Validation
- Calculations
- Frontend business rules

---

# Testing Strategy (continued)

## Application Layer

Test use cases with mocked dependencies:

```typescript
// @/features/products/application/use-cases/__tests__/CreateProductUseCase.test.ts
import { CreateProductUseCase } from "../CreateProductUseCase";
import { ProductsApi } from "@/features/products/infrastructure/api/productsApi";
import { ProductMapper } from "@/features/products/infrastructure/mappers/ProductMapper";
import { ProductValidationService } from "@/features/products/domain/services/ProductValidationService";
import { CreateProductDTO } from "@/features/products/application/dto/ProductDTO";

describe("CreateProductUseCase", () => {
  let useCase: CreateProductUseCase;
  let mockApi: jest.Mocked<ProductsApi>;
  let mapper: ProductMapper;
  let validationService: ProductValidationService;

  beforeEach(() => {
    mockApi = {
      create: jest.fn(),
    } as any;
    mapper = new ProductMapper();
    validationService = new ProductValidationService();
    useCase = new CreateProductUseCase(mockApi, mapper, validationService);
  });

  it("should create product when validation passes", async () => {
    const dto: CreateProductDTO = {
      name: "Laptop",
      price: 1000,
      stock: 10,
      category: "electronics",
    };

    const apiResponse = {
      id: "1",
      ...dto,
      created_at: "2026-05-11T00:00:00Z",
    };

    mockApi.create.mockResolvedValue(apiResponse);

    const result = await useCase.execute(dto);

    expect(result.name).toBe("Laptop");
    expect(result.price).toBe(1000);
    expect(mockApi.create).toHaveBeenCalledWith(dto);
  });

  it("should throw error when validation fails", async () => {
    const invalidDto: CreateProductDTO = {
      name: "AB", // Too short
      price: -10, // Negative
      stock: -5, // Negative
      category: "",
    };

    await expect(useCase.execute(invalidDto)).rejects.toThrow();
    expect(mockApi.create).not.toHaveBeenCalled();
  });
});
```

## Presentation Layer

Component tests with React Testing Library:

```typescript
// @/features/products/presentation/components/ui/__tests__/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../ProductCard';
import { Product } from '@/features/products/domain/models/Product';

describe('ProductCard', () => {
  const mockProduct = new Product(
    '1',
    'Laptop',
    1000,
    5,
    'electronics',
    new Date('2026-05-11')
  );

  it('should render product information', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.getByText('$1000.00')).toBeInTheDocument();
    expect(screen.getByText('electronics')).toBeInTheDocument();
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<ProductCard product={mockProduct} onEdit={onEdit} />);

    fireEvent.click(screen.getByText('Edit'));

    expect(onEdit).toHaveBeenCalledWith(mockProduct);
  });

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();
    render(<ProductCard product={mockProduct} onDelete={onDelete} />);

    fireEvent.click(screen.getByText('Delete'));

    expect(onDelete).toHaveBeenCalledWith(mockProduct);
  });

  it('should show out of stock status', () => {
    const outOfStockProduct = new Product(
      '2',
      'Mouse',
      50,
      0,
      'electronics',
      new Date()
    );

    render(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });
});
```

## Hook Tests

Test custom hooks with React Testing Library:

```typescript
// @/features/products/presentation/hooks/__tests__/useProductFilters.test.ts
import { renderHook, act } from "@testing-library/react";
import { useProductFilters } from "../useProductFilters";
import { Product } from "@/features/products/domain/models/Product";

describe("useProductFilters", () => {
  const mockProducts = [
    new Product("1", "Laptop", 1000, 10, "electronics", new Date()),
    new Product("2", "Mouse", 50, 5, "electronics", new Date()),
    new Product("3", "Desk", 300, 0, "furniture", new Date()),
  ];

  it("should filter products by category", () => {
    const { result } = renderHook(() => useProductFilters(mockProducts));

    act(() => {
      result.current.updateFilter("category", "electronics");
    });

    expect(result.current.filteredProducts).toHaveLength(2);
    expect(result.current.filteredProducts[0].category).toBe("electronics");
  });

  it("should filter products by price range", () => {
    const { result } = renderHook(() => useProductFilters(mockProducts));

    act(() => {
      result.current.updateFilter("minPrice", 100);
      result.current.updateFilter("maxPrice", 500);
    });

    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].name).toBe("Desk");
  });

  it("should filter products by stock status", () => {
    const { result } = renderHook(() => useProductFilters(mockProducts));

    act(() => {
      result.current.updateFilter("inStock", true);
    });

    expect(result.current.filteredProducts).toHaveLength(2);
  });

  it("should sort products by price ascending", () => {
    const { result } = renderHook(() => useProductFilters(mockProducts));

    act(() => {
      result.current.setSortBy("price-asc");
    });

    expect(result.current.filteredProducts[0].price).toBe(50);
    expect(result.current.filteredProducts[2].price).toBe(1000);
  });

  it("should clear all filters", () => {
    const { result } = renderHook(() => useProductFilters(mockProducts));

    act(() => {
      result.current.updateFilter("category", "electronics");
      result.current.updateFilter("minPrice", 100);
    });

    expect(result.current.filters.category).toBe("electronics");

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({});
    expect(result.current.filteredProducts).toHaveLength(3);
  });
});
```

## Integration Tests

Test TanStack Query integration with MSW (Mock Service Worker):

```typescript
// @/features/products/infrastructure/api/__tests__/productsQueries.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { useProductsQuery, useCreateProductMutation } from '../productsQueries';
import { ProductDTO } from '@/features/products/application/dto/ProductDTO';

const server = setupServer(
  rest.get('/api/products', (req, res, ctx) => {
    return res(
      ctx.json<ProductDTO[]>([
        {
          id: '1',
          name: 'Laptop',
          price: 1000,
          stock: 10,
          category: 'electronics',
          created_at: '2026-05-11T00:00:00Z',
        },
      ])
    );
  }),

  rest.post('/api/products', (req, res, ctx) => {
    const body = req.body as any;
    return res(
      ctx.json<ProductDTO>({
        id: '2',
        ...body,
        created_at: new Date().toISOString(),
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('productsQueries', () => {
  it('should fetch products and map to domain models', async () => {
    const { result } = renderHook(() => useProductsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe('Laptop');
    expect(result.current.data![0].isInStock()).toBe(true);
  });

  it('should create product and invalidate cache', async () => {
    const { result } = renderHook(() => useCreateProductMutation(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      result.current.mutate({
        name: 'Mouse',
        price: 50,
        stock: 20,
        category: 'electronics',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.name).toBe('Mouse');
  });
});
```

---

# Advanced Patterns

## 1. Optimistic Updates

```typescript
// @/features/products/infrastructure/api/productsQueries.ts
export function useUpdateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProductDTO;
    }) => {
      const apiResponse = await productsApi.update(id, data);
      return mapper.toDomain(apiResponse);
    },

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productKeys.detail(id) });

      // Snapshot previous value
      const previousProduct = queryClient.getQueryData<Product>(
        productKeys.detail(id),
      );

      // Optimistically update
      if (previousProduct) {
        queryClient.setQueryData<Product>(
          productKeys.detail(id),
          new Product(
            previousProduct.id,
            data.name ?? previousProduct.name,
            data.price ?? previousProduct.price,
            data.stock ?? previousProduct.stock,
            data.category ?? previousProduct.category,
            previousProduct.createdAt,
          ),
        );
      }

      return { previousProduct };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(
          productKeys.detail(variables.id),
          context.previousProduct,
        );
      }
    },

    // Always refetch after error or success
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
    },
  });
}
```

## 2. Infinite Scroll / Pagination

```typescript
// @/features/products/infrastructure/api/productsQueries.ts
import { useInfiniteQuery } from "@tanstack/react-query";

interface PaginatedResponse {
  data: ProductDTO[];
  nextCursor?: string;
  hasMore: boolean;
}

export function useInfiniteProductsQuery(pageSize: number = 20) {
  return useInfiniteQuery({
    queryKey: [...productKeys.lists(), { pageSize }],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await productsApi.getPaginated(pageParam, pageSize);
      return {
        products: response.data.map((dto) => mapper.toDomain(dto)),
        nextCursor: response.nextCursor,
        hasMore: response.hasMore,
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: 0,
  });
}
```

```typescript
// @/features/products/presentation/hooks/useInfiniteProducts.ts
import { useInfiniteProductsQuery } from "@/features/products/infrastructure/api/productsQueries";
import { useMemo } from "react";

export function useInfiniteProducts(pageSize?: number) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteProductsQuery(pageSize);

  const products = useMemo(() => {
    return data?.pages.flatMap((page) => page.products) ?? [];
  }, [data]);

  return {
    products,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  };
}
```

```typescript
// @/features/products/presentation/components/logic/InfiniteProductList.tsx
import { useInfiniteProducts } from '@/features/products/presentation/hooks/useInfiniteProducts';
import { ProductGrid } from '@/features/products/presentation/components/ui/ProductGrid';
import { useEffect, useRef } from 'react';

export function InfiniteProductList() {
  const {
    products,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteProducts(20);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <ProductGrid products={products} />
      <div ref={observerTarget} className="load-more-trigger" />
      {isFetchingNextPage && <div>Loading more...</div>}
    </div>
  );
}
```

## 3. Complex Domain Logic with Multiple Services

```typescript
// @/features/cart/domain/models/Cart.ts
import { Product } from "@/features/products/domain/models/Product";

export interface CartItem {
  product: Product;
  quantity: number;
}

export class Cart {
  constructor(
    public readonly id: string,
    public readonly items: CartItem[],
    public readonly userId: string,
    public readonly createdAt: Date,
  ) {}

  getTotalItems(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotalPrice(): number {
    return this.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
  }

  hasProduct(productId: string): boolean {
    return this.items.some((item) => item.product.id === productId);
  }

  getItem(productId: string): CartItem | undefined {
    return this.items.find((item) => item.product.id === productId);
  }

  canAddProduct(product: Product, quantity: number): boolean {
    const existingItem = this.getItem(product.id);
    const totalQuantity = (existingItem?.quantity ?? 0) + quantity;
    return product.canBePurchased(totalQuantity);
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}
```

```typescript
// @/features/cart/domain/services/CartCalculationService.ts
import { Cart } from "@/features/cart/domain/models/Cart";

export interface DiscountRule {
  type: "percentage" | "fixed";
  value: number;
  minAmount?: number;
}

export class CartCalculationService {
  calculateSubtotal(cart: Cart): number {
    return cart.getTotalPrice();
  }

  calculateDiscount(cart: Cart, rule: DiscountRule): number {
    const subtotal = this.calculateSubtotal(cart);

    if (rule.minAmount && subtotal < rule.minAmount) {
      return 0;
    }

    if (rule.type === "percentage") {
      return subtotal * (rule.value / 100);
    }

    return rule.value;
  }

  calculateTax(amount: number, taxRate: number): number {
    return amount * (taxRate / 100);
  }

  calculateTotal(
    cart: Cart,
    discountRule?: DiscountRule,
    taxRate: number = 0,
  ): {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  } {
    const subtotal = this.calculateSubtotal(cart);
    const discount = discountRule
      ? this.calculateDiscount(cart, discountRule)
      : 0;
    const taxableAmount = subtotal - discount;
    const tax = this.calculateTax(taxableAmount, taxRate);
    const total = taxableAmount + tax;

    return { subtotal, discount, tax, total };
  }
}
```

```typescript
// @/features/cart/domain/services/CartValidationService.ts
import { Cart, CartItem } from "@/features/cart/domain/models/Cart";
import { Product } from "@/features/products/domain/models/Product";

export interface CartValidationError {
  type: "out_of_stock" | "insufficient_stock" | "invalid_quantity";
  productId: string;
  message: string;
}

export class CartValidationService {
  validateCart(cart: Cart): CartValidationError[] {
    const errors: CartValidationError[] = [];

    for (const item of cart.items) {
      const itemErrors = this.validateCartItem(item);
      errors.push(...itemErrors);
    }

    return errors;
  }

  validateCartItem(item: CartItem): CartValidationError[] {
    const errors: CartValidationError[] = [];
    const { product, quantity } = item;

    if (!product.isInStock()) {
      errors.push({
        type: "out_of_stock",
        productId: product.id,
        message: `${product.name} is out of stock`,
      });
    } else if (!product.canBePurchased(quantity)) {
      errors.push({
        type: "insufficient_stock",
        productId: product.id,
        message: `Only ${product.stock} units of ${product.name} available`,
      });
    }

    if (quantity <= 0) {
      errors.push({
        type: "invalid_quantity",
        productId: product.id,
        message: "Quantity must be greater than 0",
      });
    }

    return errors;
  }

  canCheckout(cart: Cart): { valid: boolean; errors: CartValidationError[] } {
    if (cart.isEmpty()) {
      return {
        valid: false,
        errors: [
          {
            type: "invalid_quantity",
            productId: "",
            message: "Cart is empty",
          },
        ],
      };
    }

    const errors = this.validateCart(cart);

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
```

```typescript
// @/features/cart/presentation/hooks/useCart.ts
import { useCartQuery } from "@/features/cart/infrastructure/api/cartQueries";
import { CartCalculationService } from "@/features/cart/domain/services/CartCalculationService";
import { CartValidationService } from "@/features/cart/domain/services/CartValidationService";
import { useMemo } from "react";

const calculationService = new CartCalculationService();
const validationService = new CartValidationService();

export function useCart(discountCode?: string, taxRate: number = 8.5) {
  const { data: cart, isLoading, error } = useCartQuery();

  const calculations = useMemo(() => {
    if (!cart) return null;

    // Apply discount rule based on code (simplified)
    const discountRule = discountCode
      ? { type: "percentage" as const, value: 10, minAmount: 50 }
      : undefined;

    return calculationService.calculateTotal(cart, discountRule, taxRate);
  }, [cart, discountCode, taxRate]);

  const validation = useMemo(() => {
    if (!cart) return null;
    return validationService.canCheckout(cart);
  }, [cart]);

  return {
    cart,
    calculations,
    validation,
    isLoading,
    error,
    isEmpty: cart?.isEmpty() ?? true,
    itemCount: cart?.getTotalItems() ?? 0,
  };
}
```

## 4. Form Handling with Domain Validation

```typescript
// @/features/products/presentation/components/logic/ProductForm.tsx
import { useState, FormEvent } from 'react';
import { useProductActions } from '@/features/products/presentation/hooks/useProductActions';
import { ProductValidationService } from '@/features/products/domain/services/ProductValidationService';
import { CreateProductDTO } from '@/features/products/application/dto/ProductDTO';

const validationService = new ProductValidationService();

interface ProductFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({ onSuccess, onCancel }: ProductFormProps) {
  const { createProduct, isCreating } = useProductActions();

  const [formData, setFormData] = useState<CreateProductDTO>({
    name: '',
    price: 0,
    stock: 0,
    category: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof CreateProductDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate using domain service
    const validation = validationService.validateCreateForm(formData);

    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return;
    }

    try {
      await createProduct(formData);
      onSuccess?.();
    } catch (err) {
      setErrors({ submit: 'Failed to create product' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <div className="form-field">
        <label htmlFor="name">Product Name</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className={errors.name ? 'error' : ''}
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="price">Price ($)</label>
        <input
          id="price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => handleChange('price', parseFloat(e.target.value))}
          className={errors.price ? 'error' : ''}
        />
        {errors.price && <span className="error-message">{errors.price}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="stock">Stock</label>
        <input
          id="stock"
          type="number"
          value={formData.stock}
          onChange={(e) => handleChange('stock', parseInt(e.target.value))}
          className={errors.stock ? 'error' : ''}
        />
        {errors.stock && <span className="error-message">{errors.stock}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="category">Category</label>
        <input
          id="category"
          type="text"
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className={errors.category ? 'error' : ''}
        />
        {errors.category && <span className="error-message">{errors.category}</span>}
      </div>

      {errors.submit && (
        <div className="error-message submit-error">{errors.submit}</div>
      )}

      <div className="form-actions">
        <button type="submit" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create Product'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
```

## 5. Error Handling Strategy

```typescript
// @/shared/domain/errors/DomainError.ts
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly errors: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
```

```typescript
// @/shared/infrastructure/errors/ApiError.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly response?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static fromResponse(error: any): ApiError {
    const statusCode = error.response?.status ?? 500;
    const message = error.response?.data?.message ?? error.message;
    return new ApiError(message, statusCode, error.response?.data);
  }
}
```

```typescript
// @/shared/infrastructure/api/apiClient.ts
import axios, { AxiosError } from "axios";
import { ApiError } from "@/shared/infrastructure/errors/ApiError";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    throw ApiError.fromResponse(error);
  },
);
```

````
```typescript
// @/shared/presentation/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);

    // Send to monitoring service
    // monitoringService.captureException(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>

          <button
            onClick={() =>
              this.setState({
                hasError: false,
                error: undefined,
              })
            }
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
````

```typescript
// @/features/products/presentation/components/logic/ProductPage.tsx
import { useProducts } from '@/features/products/presentation/hooks/useProducts';
import { ApiError } from '@/shared/infrastructure/errors/ApiError';

export function ProductPage() {
  const {
    products,
    isLoading,
    error,
    refetch,
  } = useProducts();

  if (isLoading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    if (error instanceof ApiError) {
      switch (error.statusCode) {
        case 401:
          return <div>Please login to view products</div>;

        case 403:
          return <div>You do not have permission to view products</div>;

        case 404:
          return <div>Products not found</div>;

        case 500:
          return (
            <div>
              <p>Server error occurred</p>
              <button onClick={() => refetch()}>
                Retry
              </button>
            </div>
          );

        default:
          return (
            <div>
              <p>{error.message}</p>
              <button onClick={() => refetch()}>
                Retry
              </button>
            </div>
          );
      }
    }

    return <div>An unexpected error occurred</div>;
  }

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

# Recommended Final Architecture

```text
src/
├── app/
│   ├── providers/
│   │   ├── QueryProvider.tsx
│   │   ├── RouterProvider.tsx
│   │   └── ThemeProvider.tsx
│   ├── routes/
│   └── App.tsx
│
├── features/
│   ├── products/
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   ├── value-objects/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── errors/
│   │   │
│   │   ├── application/
│   │   │   ├── dto/
│   │   │   ├── use-cases/
│   │   │   └── interfaces/
│   │   │
│   │   ├── infrastructure/
│   │   │   ├── api/
│   │   │   ├── mappers/
│   │   │   ├── queries/
│   │   │   └── repositories/
│   │   │
│   │   └── presentation/
│   │       ├── components/
│   │       │   ├── ui/
│   │       │   └── logic/
│   │       ├── hooks/
│   │       ├── pages/
│   │       └── state/
│   │
│   ├── cart/
│   └── auth/
│
├── shared/
│   ├── domain/
│   ├── infrastructure/
│   ├── presentation/
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   └── utils/
│
└── main.tsx
```

# Key Rules to Keep This Architecture Clean

## Domain Layer

Allowed:

- Validation
- Calculations
- Filtering
- Sorting
- Formatting business data
- Pure business rules

Forbidden:

- API calls
- React hooks
- Browser APIs
- Local storage
- TanStack Query
- Axios/fetch
- Tailwind, CSS modules, JSX, or any presentation markup

## Application Layer

Allowed:

- Orchestration
- DTO transformations
- Use cases
- Coordination logic

Forbidden:

- React UI logic
- JSX
- Direct DOM access
- Tailwind, CSS modules, or other styling artifacts

## Infrastructure Layer

Allowed:

- API communication
- TanStack Query
- Data persistence
- Mappers
- HTTP clients

Forbidden:

- UI rendering
- Business decisions
- Tailwind or feature-local stylesheets

## Presentation Layer

Allowed:

- React components
- UI state
- Event handlers
- Animation
- Rendering
- Tailwind CSS utility classes and shared presentation primitives

Forbidden:

- Raw API calls
- Complex business rules
- Direct DTO usage from backend
- Replacing Tailwind with large bespoke CSS files for routine feature layouts (utilities first)

# Most Important Principle

Your frontend domain layer exists to model:

- frontend business behavior
- frontend validation
- frontend calculations
- frontend interaction rules

It does NOT replace backend business logic.

The backend remains the source of truth for:

- persistence
- authorization
- transactional rules
- database integrity
- security
- final validation

Your frontend domain layer improves:

- maintainability
- testability
- scalability
- separation of concerns
- UI consistency
- developer experience
- reusable business behavior
