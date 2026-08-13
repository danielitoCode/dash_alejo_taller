# Core 7 — Hardening y Plataforma

## Objetivo

Llevar los Cores funcionales a un nivel de operación robusta, segura y mantenible.

## Alcance

- RBAC y permisos definitivos.
- Reglas de seguridad Appwrite.
- Auditoría de operaciones sensibles.
- CI y quality gates.
- Tests E2E.
- Gestión de secrets y configuración.
- Observabilidad y logs.
- Validación de concurrencia.
- Functions transaccionales donde el dominio lo requiera.
- Reconciliación de datos.
- Preparación de despliegue/producción.

## Function transaccional

Cuando las operaciones involucren varias escrituras que deban ser indivisibles, consolidarlas en una Function transaccional, por ejemplo:

```text
confirmSale
  ├── validar Sale
  ├── actualizar Sale
  ├── actualizar stock
  ├── registrar movement
  └── registrar finance event
```

Debe ser atómica, idempotente y segura ante reintentos.

## Definition of Done

- [ ] Matriz RBAC validada.
- [ ] Permisos Appwrite revisados.
- [ ] CI ejecuta tests y quality gates.
- [ ] Flujos críticos cubiertos por E2E.
- [ ] Secrets fuera del código.
- [ ] Logs/auditoría operativos.
- [ ] Concurrencia probada.
- [ ] Functions transaccionales donde sean necesarias.
- [ ] Reconciliación disponible para detectar inconsistencias.
- [ ] Checklist de producción completado.

## Dependencias

Cores funcionales 1–6.

## Resultado

Sistema preparado para operación real y evolución posterior.
