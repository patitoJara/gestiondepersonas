# Corrección final botón Enviar postulación

## Problema detectado
El backend funcionaba correctamente: `POST /api/v1/wellbeing/postulations/my/{id}/submit` cambiaba la postulación a `SUBMITTED`, `currentStep = 11` y guardaba `submittedAt`.

El problema estaba en el frontend: el botón del Step 10 llamaba a `guardarFinal()`, y ese método llamaba al método antiguo `enviar()`, que solo mostraba un mensaje local y no ejecutaba el endpoint real de submit.

## Corrección aplicada
Archivo:

`src/app/modules/gestion-personas/beneficios/postulacion-estudios/postulation-form.component.ts`

Antes:

```ts
guardarFinal() {
  this.enviar();
}
```

Ahora:

```ts
async guardarFinal() {
  await this.submitPostulation();
}
```

Además, el botón quedó deshabilitado mientras se envía:

```html
<button
  mat-raised-button
  class="btn-primary"
  [disabled]="isSaving"
  (click)="guardarFinal()"
>
  {{ isSaving ? "Enviando..." : "Enviar postulación" }}
</button>
```

## Validación esperada
Al presionar el botón final debe ejecutarse:

`POST /api/v1/wellbeing/postulations/my/{id}/submit`

Luego en MySQL:

```sql
SELECT id, user_id, status, current_step, submitted_at, deleted_at
FROM wellbeing_postulations
WHERE id = TU_ID;
```

Debe quedar:

- `status = SUBMITTED`
- `current_step = 11`
- `submitted_at != NULL`
- `deleted_at = NULL`
