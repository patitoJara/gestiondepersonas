# Frontend Teletrabajo/Bienestar listo para validar

## Cambios principales

1. El flujo de Bienestar ya no debe seguir usando `postulationId` antiguos guardados si la postulación fue eliminada lógicamente.
2. Al ingresar al módulo se consulta `GET /api/v1/wellbeing/postulations/my-drafts` y solo se usan borradores activos.
3. Si no existe borrador activo, el frontend crea una nueva postulación con `POST /start`.
4. Se agregó protección en el componente para validar la postulación activa antes de guardar datos críticos.
5. Si el `postulationId` activo está eliminado/inválido, se limpia localStorage y se crea un nuevo borrador.
6. Step 2 guarda `isSingleParentHome` mediante `PATCH /my/{id}/family-group`.
7. Step 2 usa `POST /my/{id}/family-members` o `PUT /my/family-members/{familyMemberId}` si ya existe backendId.
8. Step 7 usa `PUT /my/{id}/fixed-expenses` para gastos base.
9. Step 7 usa `POST /my/{id}/other-expenses` para otros gastos dinámicos.
10. Después de guardar gastos, se recarga el resumen desde backend para evitar mostrar solo datos locales.

## Compilación

No incluir `node_modules` al subir al servidor. En el servidor o equipo de compilación ejecutar:

```bash
rm -rf node_modules
npm ci
npm run build
```

## Despliegue Apache

Copiar el contenido de `dist/` al DocumentRoot correspondiente del frontend.

## Validación funcional mínima

1. Login.
2. Entrar a Bienestar.
3. Confirmar que llama `GET /my-drafts`.
4. Si no hay borrador activo, confirmar `POST /start`.
5. Guardar Step 1 afiliado.
6. Guardar Step 2 grupo familiar.
7. Guardar Step 7 gastos.
8. Validar en MySQL:

```sql
SELECT *
FROM wellbeing_family_expenses
WHERE postulation_id = ID_ACTIVO
ORDER BY id DESC;
```

9. Revisar resumen con `GET /my/{id}/summary`.

## Nota importante

Si una postulación tiene `deleted_at` informado, el frontend ya no debe seguir usando ese ID. Se limpia la sesión local y se genera o selecciona un borrador activo.
