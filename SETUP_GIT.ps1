# =========================================================================
#  SETUP_GIT.ps1 — Configuração inicial do repositório GitHub
#  Execute este script UMA VEZ após criar o repositório no GitHub.
#  Depois disso o collect_pages.ps1 fará o push automático todo dia.
# =========================================================================

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  Mine Agência Digital — Setup GitHub Pages" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# --- PREENCHA AQUI antes de rodar ---
$githubUser = "agenciamine"  
$repoName   = "minedigital-site"
# ------------------------------------

if ($githubUser -eq "SEU_USUARIO_GITHUB") {
  Write-Host "ERRO: Edite este arquivo e preencha seu usuario GitHub e nome do repositorio." -ForegroundColor Red
  Write-Host "Abra SETUP_GIT.ps1 no Bloco de Notas, preencha as variaveis e rode novamente." -ForegroundColor Yellow
  pause; exit 1
}

$siteDir = $PSScriptRoot
$remote  = "https://github.com/$githubUser/$repoName.git"

Write-Host "Inicializando repositório git em:" -ForegroundColor Yellow
Write-Host "  $siteDir" -ForegroundColor White
Write-Host ""

Set-Location $siteDir
git init
git branch -M main
git remote add origin $remote
git add .
git commit -m "Publicacao inicial do painel Mine Agência Digital"

Write-Host ""
Write-Host "Fazendo push para GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  Pronto! Arquivos enviados ao GitHub." -ForegroundColor Green
Write-Host "  Agora ative o GitHub Pages nas configuracoes" -ForegroundColor Green
Write-Host "  do repositorio (instrucoes no guia)." -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
pause
