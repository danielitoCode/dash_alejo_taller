# dash_alejo_taller

<p align="center">
  <img src="https://img.shields.io/badge/Status-MVP%20Activo-0A7C66?style=for-the-badge" alt="MVP Activo" />
  <img src="https://img.shields.io/badge/Architecture-Offline--First-FF9F1C?style=for-the-badge" alt="Offline First" />
  <img src="https://img.shields.io/badge/Backend-Appwrite-E53935?style=for-the-badge" alt="Appwrite" />
  <img src="https://img.shields.io/badge/Realtime-Pusher-0D6EFD?style=for-the-badge" alt="Pusher" />
</p>

<p align="center">
  <strong>panel de administracion completa de Taller Alejo.</strong><br/>
   Un mismo producto, multiples roles, una sola estrategia tecnica: persistencia local, sincronizacion remota y eventos en tiempo real.
</p>

---

## Vision

**dash_alejo_taller** es un panel de gestion de ventas y administacion de productos y usuarios del negocio AlejoTaller, una tienda de productos de electronica en crecimiento

El objetivo del producto es claro:

- Gestionar compras y reservaciones con experiencia consistente
- soportar operacion con conectividad inestable
- sincronizar con Appwrite como fuente remota
- propagar cambios relevantes por Pusher en tiempo real

Este repositorio representa un **MVP serio**, ya con decisiones de arquitectura, separacion por capas, modulos compartidos y una estrategia clara de evolucion hacia cores posteriores.

---

## Tabla De Contenidos

- [Enlaces utiles](#enlaces-utiles)
- [Arquitectura](#arquitectura)
- [Stack Tecnico](#stack-tecnico)
- [Patrones Y Tecnicas Programaticas](#patrones-y-tecnicas-programaticas)
- [Fortalezas Del MVP](#fortalezas-del-mvp)
- [Deuda Tecnica Conocida](#deuda-tecnica-conocida)
- [Roadmap Por Cores](#roadmap-por-cores)
- [Puesta En Marcha](#puesta-en-marcha)
- [Criterio De Calidad](#criterio-de-calidad)

---

## Enlaces utiles

- Web desplegada de cliente en Render: [https://alejotaller.onrender.com/](https://alejotaller.onrender.com/)
- Repo de cliente: [https://github.com/danielitoCode/AlejoTaller](https://github.com/danielitoCode/AlejoTaller)
  
---

## Arquitectura

### Enfoque general

El repositorio sigue una arquitectura **modular, por feature y por capas**:

- `data`
- `domain`
- `presentation`

Cada feature implementa el mismo lenguaje arquitectonico, tanto en Android como en la capa web equivalente.

### Forma de trabajo por feature

```text
feature/{feature}/
|- data/
|  |- dao/
|  |- dto/
|  |- mapper/
|  \- repository/
|- domain/
|  |- caseuse/
|  |- entity/
|  \- repository/
|- presentation/
|  |- model/
|  |- screen/
|  \- viewmodel/
\- di/
```

### Principio rector

La fuente de verdad no es solamente la nube.  
El sistema opera con una mentalidad **offline-first con reconciliacion**:

- guarda local primero cuando el flujo lo requiere
- sincroniza con Appwrite cuando la conectividad lo permite
- conserva la coherencia mediante repositorios especializados
- consume realtime para reducir latencia perceptiva entre actores

---

## Stack Tecnico

### Web

- Svelte
- Vite
- TypeScript
- Dexie
- Appwrite Web SDK
- Pusher JS
- M3 Svelte

### Infraestructura Y Servicios

- Appwrite
- Pusher
- Render
- GitHub Releases

---

## Patrones Y Tecnicas Programaticas

### 1. Offline-First Reconciliation

Se prioriza persistencia local y posterior reconciliacion remota.  
Esto permite:

- operar sin depender de red estable
- recuperar pendientes locales
- reintentar pushes remotos
- fusionar remoto y local sin perder contexto del usuario

### 2. Repository Pattern

Los repositorios separan claramente:

- acceso local
- acceso remoto
- reglas de sincronizacion
- traduccion entre DTOs y entidades de dominio

### 3. Use Case Per Action

La logica del negocio no se concentra en UI ni en repositorios gigantes.  
Cada accion importante se encapsula en casos de uso concretos.

Ejemplos del dominio:

- autenticar usuario
- registrar nueva venta
- interpretar evento realtime
- sincronizar pendientes del operador
- enriquecer productos tras escaneo QR

### 4. Shared Domain Modules

Buena parte de la logica critica no vive duplicada por app.  
Los modulos `shared-*` concentran:

- entidades de negocio
- autenticacion compartida
- contratos de repositorio
- mappers y repositorios de soporte
- casos de uso reutilizables

### 5. Event-Driven Feedback

La verificacion de ventas no depende solo de polling.

Se utiliza una estrategia dirigida por eventos:

- Appwrite persiste el cambio
- la operadora verifica el estado remoto
- la function publica a Pusher
- cliente Android y web reaccionan al evento

---

## Fortalezas Del MVP

### Base arquitectonica consistente

La mayor fortaleza del proyecto es que ya existe una estructura tecnica coherente y reutilizable, no un conjunto de pantallas aisladas.

### Multiplataforma con dominio compartido

La coexistencia de web cliente sobre modulos compartidos reduce divergencias funcionales.

### Operacion real con conectividad imperfecta

El producto no depende ingenuamente de conectividad perfecta.  
Tiene persistencia local, sync y manejo de pendientes como parte del diseño, no como agregado tardio.

### Flujo operativo completo

El rol operador ya resuelve un problema real de negocio:

- captura
- validacion
- confirmacion
- rechazo
- historial
- sincronizacion de pendientes

### Evolucion ordenada

El repo ya tiene forma de plataforma:

- apps
- modulos compartidos
- servicio auxiliar

---

## Deuda Tecnica Conocida

Estas deudas no invalidan el MVP, pero deben considerarse para una fase posterior:

- la seguridad del `publisher` aun usa una API key simple de MVP
- Appwrite sigue siendo accedido desde clientes en varias operaciones sensibles
- el esquema remoto arrastra decisiones de modelado mejorables como `products` serializado como string
- falta endurecer mejor politicas de conflicto y reconciliacion para todos los features
- todavia hay espacio para mas homogeneidad visual entre todas las superficies
- la cobertura automatizada aun no es uniforme en todas las capas y apps
- hay flows donde conviene mover mas logica sensible a backend o functions

---

## Roadmap Por Cores

### Core MVP

Objetivo:

- estabilizar compra, reserva, verificacion y realtime
- cerrar consistencia entre Android, web y operadora
- asegurar deploys y releases trazables

### Core V2

Objetivo:

- endurecer seguridad y backends auxiliares
- reducir responsabilidad sensible en frontend

Pendientes naturales:

- auth mas robusta entre apps y roles
- API key temporal o firma mejorada para functions
- mas operaciones mediadas por backend
- mejoras de observabilidad y monitoreo

### Core V3

Objetivo:

- escalar operacion y analitica

Pendientes naturales:

- dashboards mas avanzados
- reportes y metricas de negocio
- auditoria operativa mas completa
- mayor automatizacion de conciliacion y alertas

---

## Puesta En Marcha

### Web

```bash
cd web
pnpm install
pnpm dev
```

### Configuracion esperada

El repositorio utiliza variables o propiedades para:

- Appwrite endpoint y project id
- credenciales de Pusher
- URL del publisher
- URLs de releases APK
- claves de Telegram

---

## Criterio De Calidad

El repositorio se considera sano cuando conserva estas propiedades:

- compilacion estable por modulo
- reglas de dominio compartidas entre superficies
- sincronizacion local/remota verificable
- realtime alineado entre emisor y suscriptores
- pantallas resilientes a contenido largo y estados de red

### Señales de madurez ya presentes

- estructura por feature clara
- separacion de responsabilidades
- modulos compartidos reales
- test unitarios en modulos clave
- flows criticos ya instrumentados con logs y verificacion de estado remoto

---

## Estado Actual Del Proyecto

**TallerAlejo no es un prototipo visual suelto.**  
Es un MVP funcional con base arquitectonica seria, pensado para seguir creciendo por iteraciones sin rehacerse desde cero.

El foco actual del repositorio es:

- consolidar la estabilidad del flujo comercial
- mantener coherencia entre plataformas
- endurecer progresivamente los tramos sensibles

---

## Licencia Y Uso

Repositorio privado de trabajo para el ecosistema **dash_alejo_taller**.  
Su estructura, modulos y despliegues responden al producto y a sus necesidades operativas reales.
