param(
    [Parameter(Mandatory=$true)]
    [string]$Repo
)

$ErrorActionPreference = "Stop"

$file = Join-Path $Repo "src/lib/security/otp-delivery.test.ts"

if (!(Test-Path $file)) {
    throw "File not found: $file"
}

$content = Get-Content -LiteralPath $file -Raw

$old = "let requestBody: unknown;"
$new = "let requestBody: { to?: string; message?: string; token?: string } | undefined;"

if ($content.Contains($old)) {
    $content = $content.Replace($old, $new)
}
else {
    # fallback: replace the first declaration containing requestBody
    $content = [regex]::Replace(
        $content,
        "let\s+requestBody\s*:[^;]+;",
        $new,
        1
    )
}

Set-Content -LiteralPath $file -Value $content -Encoding utf8

Write-Host "OTP DELIVERY TYPECHECK FIX APPLIED"
