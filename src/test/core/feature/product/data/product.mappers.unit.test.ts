import { describe, it, expect } from "vitest"
import {
    productFromDTO,
    productToDTO,
    productToCatalogWriteDTO,
} from "../../../../../core/feature/product/data/mapper/Mappers"
import type { ProductDTO } from "../../../../../core/feature/product/data/dto/ProductDTO"
import type { Product } from "../../../../../core/feature/product/domain/entity/Product"

function dto(overrides: Partial<ProductDTO> = {}): ProductDTO {
    return {
        $id: "p-x",
        $createdAt: "",
        $updatedAt: "",
        $permissions: [],
        $collectionId: "product",
        $databaseId: "db",
        id: "p-x",
        name: "N",
        description: "D",
        existence: 8,
        reserved: 3,
        price: 12,
        photo_url: "https://example.com/a.jpg",
        category_id: "cat",
        status: "active",
        ...overrides,
    } as ProductDTO
}

function domain(overrides: Partial<Product> = {}): Product {
    return {
        id: "p-x",
        name: "N",
        description: "D",
        existence: 8,
        reserved: 3,
        price: 12,
        photoUrl: "https://example.com/a.jpg",
        categoryId: "cat",
        status: "active",
        rating: 0,
        ...overrides,
    }
}

describe("Product mappers (Core1 fase 1.2 — no pisar soft-hold)", () => {
    it("productFromDTO mapea reserved", () => {
        const p = productFromDTO(dto({ reserved: 5, existence: 9 }))
        expect(p.reserved).toBe(5)
        expect(p.existence).toBe(9)
        expect(p.id).toBe("p-x")
        expect(p.categoryId).toBe("cat")
    })

    it("productFromDTO: reserved ausente → 0 (docs legacy)", () => {
        const raw = dto()
        delete raw.reserved
        expect(productFromDTO(raw).reserved).toBe(0)
    })

    it("productFromDTO: reserved inválido → 0", () => {
        expect(productFromDTO(dto({ reserved: -2 as unknown as number })).reserved).toBe(0)
    })

    it("productToDTO incluye reserved (create / full write)", () => {
        const w = productToDTO(domain({ reserved: 4 }))
        expect(w.reserved).toBe(4)
        expect(w.existence).toBe(8)
        expect(w.photo_url).toBeDefined()
        expect(w.category_id).toBe("cat")
    })

    it("productToCatalogWriteDTO NO incluye reserved (política 2.3 panel)", () => {
        const catalog = productToCatalogWriteDTO(domain({ reserved: 99 }))
        expect(catalog).not.toHaveProperty("reserved")
        expect(catalog.existence).toBe(8)
        expect(catalog.name).toBe("N")
    })
})
