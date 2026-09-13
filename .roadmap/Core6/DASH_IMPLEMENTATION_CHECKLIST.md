# Core 6 — Checklist de implementación · **dash_alejo_taller**

**Rama:** `Core6` · **Actualizado:** 2026-09-13  
**Objetivo:** Agenda y reservas de taller (`Appointment ≠ Sale`).  
**Release mínimo:** B0 + B1 + B2 + B3 + B6. **Completo:** + B4 + B5.

---

## B0 — Baseline (modelo + Appwrite)

- [ ] Política corta Core 6 aceptada (o sección en `.policies/` si aplica)
- [ ] Colección(es) Appwrite: citas (+ servicios/clientes taller si no reutilizan entidades existentes)
- [ ] Campos mínimos: cliente, servicio, `startsAt`, `endsAt`/duración, técnico?, notas, `status`
- [ ] Estados: `REQUESTED` | `CONFIRMED` | `COMPLETED` | `CANCELLED`
- [ ] Permisos staff (owner/admin/sales o rol taller); cliente **no** escribe staff fields
- [ ] Documentar que **no** escribe `Sale` / `sale_finance_event` / stock de producto

---

## B1 — Dominio + datos

- [ ] Entidad `Appointment` (y enums de estado)
- [ ] DTO ↔ domain mappers
- [ ] Repository (remoto + offline-first si el resto del panel lo usa)
- [ ] Case uses: list / get / create / updateStatus / assignTechnician
- [ ] Tests unitarios de transiciones de estado válidas/inválidas

---

## B2 — CRUD y máquina de estados (panel)

- [ ] Crear cita (REQUESTED o CONFIRMED según flujo staff)
- [ ] Confirmar / completar / cancelar con reglas (no saltar estados ilegales)
- [ ] Editar notas, horario, técnico en estados permitidos
- [ ] Listado filtrable por estado y rango de fechas
- [ ] Idempotencia razonable en cambios de estado (reintentos UI)

---

## B3 — Agenda UI

- [ ] Vista agenda operativa (día y/o semana; listado por hora aceptable en MVP)
- [ ] Detalle de cita
- [ ] Acciones rápidas de estado desde listado/detalle
- [ ] Empty / loading / error coherentes con el resto del panel
- [ ] Navegación desde menú / home del dashboard

---

## B4 — Asociaciones (completo)

- [ ] Selector de cliente (taller) y alta mínima si no existe
- [ ] Catálogo/selector de **servicios** (independiente de productos de venta)
- [ ] Asignación de técnico (staff)
- [ ] Validación: servicio + slot horario requeridos para CONFIRMED

---

## B5 — Validaciones, RT, calidad

- [ ] Validar solapes básicos (mismo técnico, misma franja) o documentar deferido
- [ ] Realtime/invalidación de agenda si hay suscripción Appwrite (opcional MVP)
- [ ] Tests de case uses + smoke manual agenda
- [ ] CI: incluir rama `Core6` en `ci.yml` / unit relevantes

---

## B6 — Cierre

- [ ] Roles de lectura/escritura documentados
- [ ] Smoke: crear → confirmar → completar; crear → cancelar
- [ ] STATUS + checklist actualizados
- [ ] PR `Core6` → `master` con CI verde

---

## Orden

```text
B0 → B1 → B2 → B3 → B4 → B5 → B6 → merge
```

## Registro

| Fecha | Nota |
|-------|------|
| 2026-09-13 | Apertura rama + checklist |
