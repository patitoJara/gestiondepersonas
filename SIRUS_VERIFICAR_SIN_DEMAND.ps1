# Verifica que no exista el módulo viejo demand
if (Test-Path "src\app\views\demand\demand.component.ts") {
  Write-Host "❌ Aún existe src/app/views/demand/demand.component.ts" -ForegroundColor Red
  exit 1
}
Write-Host "✅ Proyecto limpio: no existe src/app/views/demand/demand.component.ts" -ForegroundColor Green
