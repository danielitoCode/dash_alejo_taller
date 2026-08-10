# CI / CD — `dash_alejo_taller`

Complementa **Qodana** (calidad estática JetBrains) con comprobaciones de **tests, tipos y build**, y **despliegue Vercel**.

## Workflows

| Archivo | Trigger | Qué hace |
|---------|---------|----------|
| `qodana_code_quality.yml` | push/PR `master` | Análisis Qodana (existente) |
| `ci.yml` | push/PR `master` | `check` + `test:unit` + `build` + artifact `dist` |
| `ci-and-deploy.yml` | push/PR `master` | Quality gate **y luego** deploy Vercel (preview en PR, prod en `master`) |
| `deploy-vercel.yml` | push/PR `master` | Deploy Vercel standalone (opcional; preferir unificado) |

Recomendación: en **Branch protection** de `master` exigir:

- `CI / Check · Unit tests · Build` (job de `ci.yml`), **o**
- `CI and Deploy / Quality gate`

Qodana puede quedar como check informativo u obligatorio según tu plan.

## Secrets requeridos (Actions)

| Secret | Uso |
|--------|-----|
| `QODANA_TOKEN` | Ya usado por Qodana |
| `VERCEL_TOKEN` | Token de Vercel (Account → Tokens) |
| `VERCEL_ORG_ID` | Team/User id (`vercel link` / dashboard) |
| `VERCEL_PROJECT_ID` | Project id del dash |

### Variables de entorno de la app en Vercel

Configura en el **proyecto Vercel** (Production + Preview) las mismas claves que `.env.example` (`VITE_APPWRITE_*`, etc.). **No** pongas API keys de servidor en el frontend.

## Comandos locales (equivalente al gate)

```bash
npm ci
npm run check
npm run test:unit
npm run build
```

Opcional en `package.json`:

```bash
npm run ci
```

## Nota sobre workflows duplicados

Si activas **a la vez** `ci.yml` + `ci-and-deploy.yml` + `deploy-vercel.yml`, tendrás builds/deploy repetidos. Opciones:

1. **Solo** `ci-and-deploy.yml` + Qodana (recomendado), o  
2. `ci.yml` (required) + `deploy-vercel.yml` y desactivar el unificado.
