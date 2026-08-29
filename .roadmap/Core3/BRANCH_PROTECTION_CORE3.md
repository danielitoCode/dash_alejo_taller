# Protección de rama `Core3` (dash_alejo_taller)

## CI ya cableado

Workflows que corren en **push** y **pull_request** hacia `Core3`:

| Workflow | Job (nombre del check) |
|----------|-------------------------|
| `CI` | **Check · Unit tests · Build** |
| `CI and Deploy` | **Quality gate** (deploy solo en `master`) |

Tras el primer push a `Core3` con estos YAML, los checks aparecen en Actions.

## Branch protection (Settings → Branches)

La API de reglas no está disponible desde este agente; aplicar en la UI de GitHub:

1. Repo → **Settings** → **Branches** → **Add branch ruleset** (o classic Branch protection rule).
2. Pattern: `Core3`
3. Activar:
   - **Require a pull request before merging** (opcional en la propia Core3; recomendado si usas PRs internos)
   - **Require status checks to pass before merging**
   - Required checks (tras al menos un run exitoso):
     - `Check · Unit tests · Build` (workflow **CI**)
     - y/o `Quality gate` (workflow **CI and Deploy**)
   - **Do not allow bypassing the above settings** (salvo admins si quieres escape hatch)
4. Opcional: Require conversation resolution; Restrict who can push.

Para merge **Core3 → master**, la protección de **`master`** ya exige PR; asegúrate de que los mismos checks de quality estén required en `master`.

## Criterio de calidad Core 3

- `npm run check` (tipos)
- `npm run test:unit`
- `npm run build`

No mergear trabajo de Core 3 a `master` con CI rojo.
