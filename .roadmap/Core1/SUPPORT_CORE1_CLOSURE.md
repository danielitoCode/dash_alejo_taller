# Support — Cierre funcional Core 1

**Política:** `.policies/support/SUPPORT_POLICY.md`  
**Repos:** `dash_alejo_taller` + `AlejoTaller` (web)

## Fase S0 — Alineación
- [x] Política SUPPORT_POLICY
- [x] Este checklist
- [ ] Crear colecciones en Appwrite (operador)
- [ ] Arranque en frío Appwrite (recomendado)

## Fase S1 — Appwrite + dominio
- [ ] Colecciones `support_threads` + `support_messages`
- [ ] Permissions MVP
- [ ] Entidades Thread + Message, DTOs, mappers
- [ ] `SupportAppwriteRepository` + subscribe RT
- [ ] Use cases Create/List/Post/Status/MarkRead/Subscribe
- [ ] ENV collection IDs; DI sin Pulse por defecto

## Fase S2 — Backoffice
- [ ] Inbox threads + badge unread
- [ ] Detail timeline + composer Responder
- [ ] RT + filtros status

## Fase S3 — Cliente web
- [ ] Rutas montadas; entrada Perfil → Soporte
- [ ] Lista / nueva consulta / chat + RT
- [ ] Guest → login

## Fase S4 — QA
- [ ] QA 15 min PASS; docs; Android fuera DoD; Pulse deprecado

## Orden
1. Colecciones Appwrite  
2. S1 dash  
3. S1+S3 web  
4. S2 composer  
5. S4 cierre formal  
