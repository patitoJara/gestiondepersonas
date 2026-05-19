# SIRUS — Ajuste PATCH currentStep

Se corrigieron los métodos `updateCurrentStep` en:

- `wellbeing-postulation.service.ts`
- `wellbeing-workflow.service.ts`

Ambos ahora envían el body exactamente como exige la documentación:

```json
{
  "currentStep": 2
}
```

Además se fuerza `Number(currentStep)` para evitar que Angular envíe un string por accidente.

Endpoint usado:

```txt
PATCH /api/v1/wellbeing/postulations/my/{id}/step
```

Para validar:

```powershell
npm install
ng serve --host localhost --port 4200
```
