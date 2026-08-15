# SUPPORT_POLICY — Mensajería soporte ↔ usuario (Core 1 closure)

**Estado:** Aprobado para implementación (cierre funcional Core 1)  
**Alcance:** `dash_alejo_taller` (gobierno) + `AlejoTaller` web (cliente)  
**Android:** parity diferida documentada (no bloquea demo Core 1 web+panel)  
**Transporte:** Appwrite Database + Appwrite Realtime (sustituye Pulse/Pusher para support)

---

## 1. Objetivo de producto

Canal de **ayuda operativa** entre el cliente autenticado y el staff del taller:

1. El usuario abre un **hilo** (ticket) con motivo + asunto + primer mensaje.
2. El staff ve el hilo en **Mensajes**, responde y cambia estado.
3. Ambos lados reciben altas/cambios por **Appwrite Realtime** (< ~2 s en condiciones normales).
4. El usuario **solo** ve sus hilos; el staff ve todos (según rol).

No es un chat social ni un CRM completo. Es soporte de negocio para la demo y operación diaria.

---

## 2. Modelo de datos (Appwrite)

Dos colecciones en el mismo `databaseId` del proyecto.

### 2.1 `support_threads`

| Atributo | Tipo | Requerido | Notas |
|----------|------|-----------|--------|
| `userId` | string | sí | `$id` del usuario Appwrite dueño |
| `userName` | string | sí | snapshot al crear |
| `userEmail` | string | sí | snapshot al crear |
| `reason` | string (enum) | sí | `soporte` \| `pregunta_tecnica` \| `facturacion` \| `otro` |
| `subject` | string | sí | máx. ~120 chars recomendado |
| `status` | string (enum) | sí | `nuevo` \| `en_proceso` \| `resuelto` \| `cerrado` |
| `lastMessageAt` | string (ISO) | sí | orden del inbox |
| `lastPreview` | string | sí | preview lista (recortado) |
| `lastSenderRole` | string | sí | `user` \| `staff` |
| `unreadStaff` | integer | sí | default 1 al crear |
| `unreadUser` | integer | sí | default 0 al crear |

**Índices sugeridos:** `userId`, `status`, `lastMessageAt` (DESC).

### 2.2 `support_messages`

| Atributo | Tipo | Requerido | Notas |
|----------|------|-----------|--------|
| `threadId` | string | sí | `$id` del thread |
| `senderRole` | string | sí | `user` \| `staff` |
| `senderId` | string | sí | userId o staff userId |
| `senderName` | string | sí | snapshot UI |
| `body` | string | sí | texto plano (MVP sin markdown rico) |
| `createdAtIso` | string (ISO) | sí | orden cronológico |

**Índices sugeridos:** `threadId`, `createdAtIso`.

### 2.3 Compatibilidad con el modelo legacy

El código actual modela un **único** `SupportMessage` con `subject`+`body`+`status` (inbox plano vía Pulse).

**Migración conceptual:**
- 1 documento legacy ≈ 1 `support_threads` + 1 `support_messages` (primer mensaje del user).
- Nuevas respuestas = nuevos `support_messages`; el thread actualiza `status`, `last*`, unread.

Si no hay datos reales en Pulse en producción, se puede **arrancar en frío** solo con Appwrite (recomendado para demo).

---

## 3. Permisos Appwrite (MVP)

| Rol | `support_threads` | `support_messages` |
|-----|-------------------|--------------------|
| Usuario autenticado | create propios; read/update propios | create en threads propios; read de sus threads |
| Staff (`admin` / `sales` / roles de panel) | read/update todos | create/read en cualquier thread |
| Guest / anónimo | **denegado** | **denegado** |

**Regla de producto:** soporte solo con sesión real (no visitante).

---

## 4. Realtime

| Cliente | Canal / filtro |
|---------|----------------|
| Panel | subscribe colección `support_threads` + `support_messages` |
| Usuario web | threads donde `userId == yo` y mensajes de esos threads |

Patrón igual que promos/ventas: debounce corto, merge en store.

---

## 5. Flujos UX

### Usuario: Perfil → Soporte → lista / nueva consulta / detail chat + RT.
### Staff: Mensajes → threads + timeline + Responder + estados.

---

## 6. Dominio

Entidades: `SupportThread`, `SupportMessage` (línea).  
Use cases: CreateThread, List*, PostMessage, UpdateThreadStatus, MarkThreadRead, SubscribeSupport.  
Repo: `SupportAppwriteRepository` (default; Pulse deprecado).

---

## 7. Fuera de alcance Core 1

Adjuntos, plantillas, asignación agente, push/email, CSAT, Android nativo, edición de mensajes enviados.

---

## 8. DoD soporte Core 1

1. Usuario crea → panel < 3 s.  
2. Staff responde → usuario < 3 s.  
3. Aislamiento por userId.  
4. Status reflejado en ambos.  
5. Sin Pulse/Pusher en camino feliz.  
6. QA 15 min PASS.

---

## 9. Relación con Core 2

Support no entra en finanzas. Cerrar aquí evita deuda en Core 2.
