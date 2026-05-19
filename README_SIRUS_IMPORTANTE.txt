Proyecto corregido por Sirus — Bienestar/Postulación Steps 8 al 11

IMPORTANTE:
Este ZIP NO contiene el módulo antiguo src/app/views/demand.
Si lo descomprimes encima de una carpeta antigua, Windows puede dejar archivos viejos que el ZIP no trae.

Forma recomendada:
1) Descomprime este ZIP en una carpeta NUEVA.
2) Ejecuta:
   npm install
   ng serve --host localhost --port 4200

Si decides copiarlo sobre una carpeta vieja, ejecuta antes o después:
   powershell -ExecutionPolicy Bypass -File .\SIRUS_LIMPIAR_RESIDUOS_Y_EJECUTAR.ps1

Correcciones incluidas:
- Step 7: fixed-expenses por PUT /my/{id}/fixed-expenses.
- Step 7: other-expenses por POST /my/{id}/other-expenses.
- Step 8: health-records por POST individual /my/{id}/health-records usando personName y backendId del familiar.
- Step 8: housing por PUT /my/{id}/housing usando typeHousingId y typePropertyId.
- Step 10: summary por GET /my/{id}/summary.
- Step 11: submit por POST /my/{id}/submit.
- Eliminadas referencias a endpoints antiguos family-expenses/family-incomes del flujo actual.
- Validado TypeScript con tsc usando node_modules del proyecto original.
