# SIRUS - Limpieza fuerte de residuos viejos
Write-Host "🔥 Eliminando residuos del proyecto anterior..." -ForegroundColor Yellow
$paths = @(
  "src\app\views\demand",
  "src\app\views",
  ".angular\cache",
  "dist"
)
foreach ($p in $paths) {
  if (Test-Path $p) {
    Write-Host "Eliminando $p"
    Remove-Item -Recurse -Force $p
  }
}
Write-Host "✅ Limpieza lista. Ahora ejecuta: npm install; ng serve --host localhost --port 4200" -ForegroundColor Green
