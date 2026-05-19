# Correcciones Sirus — Postulación Bienestar Step 8 al Step 11

Se corrigió el proyecto para alinear el flujo de postulación con la documentación del backend enterprise.

## Archivos modificados

- `postulation-form.component.ts`
- `services/wellbeing-postulation.service.ts`
- `services/wellbeing-workflow.service.ts`
- `services/wellbeing-documents.service.ts`
- `models/health-record-request.model.ts`
- `models/housing-request.model.ts`

## Correcciones principales

- Step 8 Salud:
  - Usa `POST /my/{id}/health-records` por cada antecedente.
  - Usa `personName`, no `name`.
  - Usa `backendId` del familiar, no el id local Angular.
  - No envía registros vacíos.

- Step 8 Vivienda:
  - Usa `PUT /my/{id}/housing`.
  - Payload corregido a `typeHousingId` y `typePropertyId`.

- Step 9 Documentos:
  - Servicios corregidos a rutas `/my/...`.
  - Se agregó `createDocument()` y `deleteDocument()` según documentación.

- Step 10 Resumen:
  - Usa `GET /my/{id}/summary`.

- Step 11 Envío:
  - Usa `POST /my/{id}/submit`.

## Validación realizada

Se ejecutó validación TypeScript con:

```bash
node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit
```

Resultado: sin errores TypeScript.

No se pudo ejecutar `ng build` dentro del contenedor Linux porque el ZIP trae `node_modules` instalado para Windows (`@esbuild/win32-x64`). En Windows debería ejecutar normalmente.
