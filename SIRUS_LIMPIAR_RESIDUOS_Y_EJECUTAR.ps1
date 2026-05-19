# Limpieza de residuos de proyectos antiguos antes de levantar Angular
# Ejecutar desde la raíz del proyecto:
#   powershell -ExecutionPolicy Bypass -File .\SIRUS_LIMPIAR_RESIDUOS_Y_EJECUTAR.ps1

Write-Host "🧹 Limpiando residuos de proyectos anteriores..." -ForegroundColor Cyan

$pathsToRemove = @(
  "src/app/views/demand",
  "src/app/views"
)

foreach ($path in $pathsToRemove) {
  if (Test-Path $path) {
    Write-Host "Eliminando $path" -ForegroundColor Yellow
    Remove-Item -Recurse -Force $path
  }
}

if (Test-Path ".angular") {
  Write-Host "Eliminando caché .angular" -ForegroundColor Yellow
  Remove-Item -Recurse -Force ".angular"
}

if (Test-Path "dist") {
  Write-Host "Eliminando dist" -ForegroundColor Yellow
  Remove-Item -Recurse -Force "dist"
}

Write-Host "✅ Limpieza lista." -ForegroundColor Green
Write-Host "Ahora ejecuta:" -ForegroundColor Cyan
Write-Host "npm install" -ForegroundColor White
Write-Host "ng serve --host localhost --port 4200" -ForegroundColor White
