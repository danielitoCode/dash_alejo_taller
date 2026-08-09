# Core 1 — Estado MVP Back-office

**Última actualización:** 2026-08-09  
**Veredicto desarrollo:** Fase 1–2 catálogo + **tests unitarios de políticas**.

## Tests (fases 1–2)

| Suite | Política |
|-------|----------|
| `Product.stock.unit.test.ts` | available = existence − reserved; createProduct invariantes |
| `product.mappers.unit.test.ts` | reserved en lectura; catalog write **sin** reserved |
| `SaveProductCaseUse.unit.test.ts` | 2.1 alta reserved=0 |
| `UpdateProductCatalogCaseUse.unit.test.ts` | 2.2 existence≥reserved; 2.3 no muta reserved |

```bash
npm run test:unit
# o
npm test -- --project unit
```

## Fase 0–2

| Área | Estado |
|------|--------|
| 0.1–0.3 | **Hecho** |
| 1.x reserved + mapper | **Hecho** + tests |
| 2.1–2.3 catálogo | **Hecho** + tests |
| 2.4 roles | Fase 3 |

## Siguiente

**Fase 3** — gates de roles.
