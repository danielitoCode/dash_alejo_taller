# CI / CD — `dash_alejo_taller`

Quality gate con typecheck, tests unitarios, build y deploy a **Vercel**.

## Workflows activos

| Workflow | Cuándo | Qué hace |
|----------|--------|----------|
| **CI** | push/PR `master` | `check` + `test:unit` + `build` |
| **CI and Deploy** | push/PR `master` | Mismo quality gate → Vercel (prod en `master`, preview en PR) |
| **Deploy Vercel (manual)** | solo `workflow_dispatch` | Redeploy bajo demanda |

> Qodana se eliminó: exige `QODANA_TOKEN` / Qodana Cloud y no aportaba valor frente al quality gate actual.

### Branch protection (recomendado)

En GitHub → Settings → Branches → `master`:

- Require status checks:
  - `CI / Check · Unit tests · Build` **o** `CI and Deploy / Quality gate`
- Require PR before merge (si trabajas con PRs)

## Secrets de Actions

| Secret | Obligatorio para |
|--------|------------------|
| `VERCEL_TOKEN` | Deploy |
| `VERCEL_ORG_ID` | Deploy |
| `VERCEL_PROJECT_ID` | Deploy |

Sin `VERCEL_*`, el **Quality gate sigue en verde** y el job de deploy se omite con warning.

### Cómo obtener IDs Vercel

```bash
npm i -g vercel
vercel login
vercel link   # en la raíz del repo
# Lee .vercel/project.json → orgId, projectId
```

Token: Vercel Dashboard → Account Settings → Tokens.

### Env de la app en Vercel

En el proyecto Vercel (Production + Preview), define las `VITE_*` de `.env.example`. Nunca API keys de servidor en el frontend.

## Local (mismo gate)

```bash
npm run ci
# equivalente a: check && test:unit && build
```
