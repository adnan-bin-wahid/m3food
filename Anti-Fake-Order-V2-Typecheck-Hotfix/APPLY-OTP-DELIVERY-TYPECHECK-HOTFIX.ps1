param(
    [Parameter(Mandatory=$true)]
    [string]$Repo
)

$ErrorActionPreference = "Stop"

$file = Join-Path $Repo "src/lib/security/otp-delivery.test.ts"

if (-not (Test-Path -LiteralPath $file)) {
    throw "Missing file: $file"
}

$content = Get-Content -LiteralPath $file -Raw

$old = "let requestBody: unknown;"
$new = "let requestBody: { to?: string; message?: string; token?: string } | undefined;"

if (-not $content.Contains($old)) {
    throw "Expected requestBody anchor not found."
}

$content = $content.Replace($old, $new)

Set-Content -LiteralPath $file -Value $content -Encoding utf8

Write-Host "OTP DELIVERY TYPECHECK HOTFIX APPLIED"
