# Corrección Frontend — Documentos Bienestar

## Diagnóstico confirmado

Se validó por Postman que el backend sí registra documentos en MySQL mediante:

```http
POST /api/v1/wellbeing/postulations/my/{id}/documents
```

La tabla donde se valida es:

```sql
wellbeing_postulation_documents
```

Por lo tanto, la falla estaba en el frontend: el Step 9 solo dejaba los archivos seleccionados en memoria y avanzaba de paso, pero no registraba la metadata en el backend.

## Corrección aplicada

Se corrigió `postulation-form.component.ts` para que `saveStep9Documents()`:

1. Valide/obtenga una postulación activa.
2. Recoja archivos obligatorios y opcionales.
3. Mapee cada archivo a su `documentTypeId` real usando el catálogo `/document-types`.
4. Envíe un POST por cada archivo a:

```http
POST /api/v1/wellbeing/postulations/my/{id}/documents
```

5. Envíe el JSON que espera el backend:

```json
{
  "documentTypeId": 1,
  "originalFilename": "certificado.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 250000,
  "storagePath": "/uploads/bienestar/23/cedula/certificado.pdf",
  "checksum": "23-cedula-certificado.pdf-250000-1710000000"
}
```

6. Recargue el resumen desde backend después de guardar.
7. Evite duplicar documentos dentro de la misma sesión.

## Archivos modificados

```text
src/app/modules/gestion-personas/beneficios/postulacion-estudios/postulation-form.component.ts
src/app/modules/gestion-personas/beneficios/postulacion-estudios/services/wellbeing-documents.service.ts
src/app/modules/gestion-personas/beneficios/postulacion-estudios/models/document-type-response.model.ts
src/app/modules/gestion-personas/beneficios/postulacion-estudios/models/document-response.model.ts
angular.json
```

## Validación realizada

Se ejecutó:

```bash
./node_modules/.bin/tsc -p tsconfig.app.json --noEmit
npm run build
```

Resultado:

```text
TypeScript OK
Build OK
```

El build queda en:

```text
dist/gestion-personas
```

## Nota importante

Este flujo registra metadata del documento en la base de datos. No sube físicamente el archivo PDF al servidor. Para guardar el archivo real se requiere un endpoint multipart, por ejemplo:

```http
POST /api/v1/wellbeing/postulations/my/{id}/documents/upload
Content-Type: multipart/form-data
```

Con campos:

```text
file
documentTypeId
```

