# RESTORE

Remote accidentally had PLACEHOLDER in NestedNav and ProductManagement.

Restore with:
```
git fetch origin
git checkout ec7bfc3 -- \
  src/core/infrastructure/presentation/navigation/NestedNavigationWrapper.svelte \
  src/core/feature/product/presentation/routes/ProductManagement.svelte
git add -A
git commit -m "fix: restore NestedNav + ProductManagement after PLACEHOLDER"
git push origin master
```
