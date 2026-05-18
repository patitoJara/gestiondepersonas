# Corrección frontend — Precarga de documentos guardados

Se corrigió el Step 9 para que los documentos ya registrados en backend desde `GET /api/v1/wellbeing/postulations/my/{id}/summary` se muestren visualmente en la pantalla de documentos.

## Cambios aplicados

- Se agregó `uploadedDocumentsByKey` para mapear documentos ya guardados por `documentTypeCode`.
- Se agregó `restoreDocumentsFromSummary(summary)`.
- Se agregó `getBackendDocumentsForKey(key)` y `hasBackendDocumentsForKey(key)`.
- `tieneArchivoObligatorio()` ahora considera archivos nuevos y documentos ya registrados en backend.
- `getTotalObligatoriosCargados()` ahora cuenta documentos backend.
- `saveStep9Documents()` permite avanzar si ya existen todos los documentos obligatorios en backend, aunque no haya archivos nuevos seleccionados.
- El HTML del Step 9 ahora muestra los documentos ya registrados como “Documento ya registrado”.
- Se evita duplicar documentos ya registrados al volver a guardar el Step 9.

## Validación realizada

Se ejecutó:

```bash
./node_modules/.bin/tsc -p tsconfig.app.json --noEmit
npm run build
```

Resultado: compilación OK.

## Validación funcional esperada

Al retomar una postulación desde `summary`:

- Step 9 muestra los archivos ya guardados.
- El contador de documentos obligatorios muestra `7 / 7` si ya están registrados.
- El Step 10 muestra documentos completos.
- Si el usuario no selecciona archivos nuevos, puede continuar si los obligatorios ya existen en backend.
