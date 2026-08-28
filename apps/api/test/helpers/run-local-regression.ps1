param(
  [string]$PostgresHost = "localhost",
  [int]$PostgresPort = 5432,
  [string]$PostgresUser = "postgres"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($PostgresHost -notin @("localhost", "127.0.0.1", "::1")) {
  throw "A regressão aceita somente PostgreSQL local."
}

$regressionDatabase = "vavito_integration"
$regressionRoot = Resolve-Path (Join-Path $PSScriptRoot "../../../..")
$regressionSecurePassword = Read-Host "Senha do PostgreSQL local" -AsSecureString
$regressionCredential = [PSCredential]::new($PostgresUser, $regressionSecurePassword)
$regressionPassword = $regressionCredential.GetNetworkCredential().Password
$regressionEncodedUser = [Uri]::EscapeDataString($PostgresUser)
$regressionEncodedPassword = [Uri]::EscapeDataString($regressionPassword)
$regressionDatabaseUrl = "postgresql://${regressionEncodedUser}:${regressionEncodedPassword}@${PostgresHost}:${PostgresPort}/${regressionDatabase}"
$regressionLocationChanged = $false

function Assert-LastCommandSucceeded {
  param([string]$Message)

  if ($LASTEXITCODE -ne 0) {
    throw $Message
  }
}

try {
  Push-Location -LiteralPath $regressionRoot
  $regressionLocationChanged = $true
  $env:PGPASSWORD = $regressionPassword

  $regressionDatabaseExists = psql -w -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres -tAc `
    "SELECT 1 FROM pg_database WHERE datname = '${regressionDatabase}'"
  Assert-LastCommandSucceeded "Não foi possível consultar o PostgreSQL local."

  if (([string]$regressionDatabaseExists).Trim() -ne "1") {
    createdb -w -h $PostgresHost -p $PostgresPort -U $PostgresUser $regressionDatabase
    Assert-LastCommandSucceeded "Não foi possível criar o banco isolado de integração."
  }

  $env:DATABASE_URL = $regressionDatabaseUrl
  $env:DIRECT_URL = $regressionDatabaseUrl
  $env:INTEGRATION_DATABASE_URL = $regressionDatabaseUrl

  pnpm --filter @vavito/api test:integration:prepare
  Assert-LastCommandSucceeded "Falha ao preparar o fixture de auth."

  pnpm --filter @vavito/api prisma:migrate:deploy
  Assert-LastCommandSucceeded "Falha ao aplicar as migrations no banco isolado."

  pnpm test:regression:api
  Assert-LastCommandSucceeded "A suíte de regressão falhou."
}
finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:DIRECT_URL -ErrorAction SilentlyContinue
  Remove-Item Env:INTEGRATION_DATABASE_URL -ErrorAction SilentlyContinue

  $regressionDatabaseUrl = $null
  $regressionEncodedPassword = $null
  $regressionPassword = $null
  $regressionCredential = $null
  $regressionSecurePassword = $null

  if ($regressionLocationChanged) {
    Pop-Location
  }
}
