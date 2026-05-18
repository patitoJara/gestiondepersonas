# Corrección final: congelamiento al enviar postulación

Cambios aplicados en `postulation-form.component.ts/html`:

1. `submitPostulation()` ahora valida el `summary` directamente contra backend antes de enviar.
2. Ya no bloquea el submit por documentos precargados visualmente desde `summary.documents`.
3. `validateAll()` ahora considera documentos ya registrados en backend mediante `tieneArchivoObligatorio()`.
4. El botón final usa `guardarFinal($event)` con `preventDefault()` y `stopPropagation()`.
5. Se agregó `isFinalizing` para evitar doble click/doble submit.
6. Después de `submit` exitoso, la UI pasa inmediatamente a `currentStep = 11` y `isSubmitted = true`.
7. El refresco de `summary` queda en segundo plano, sin bloquear la pantalla.
8. Se ejecuta `dialog.closeAll()` antes y después del submit para evitar backdrops/diálogos pegados.

Validación esperada:

- Network debe mostrar `POST /api/v1/wellbeing/postulations/my/{id}/submit` con 200.
- MySQL debe mostrar `status = SUBMITTED`, `current_step = 11`, `submitted_at != NULL`.
- La pantalla debe pasar a Step 11 y quedar usable.
