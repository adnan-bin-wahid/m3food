$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "======================================================="
Write-Host " EFFY GROWTH COMMERCE TEMPLATE"
Write-Host " Niyamah Attires storefront"
Write-Host "======================================================="
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js পাওয়া যায়নি। আগে Node.js LTS ইনস্টল করুন।"
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm পাওয়া যায়নি। Node.js LTS ইনস্টলেশন যাচাই করুন।"
}

if (-not (Test-Path -LiteralPath (Join-Path (Get-Location) "package.json"))) {
    throw "package.json পাওয়া যায়নি। PowerShell-টি project root folder থেকে চালান।"
}

if (-not (Test-Path -LiteralPath (Join-Path (Get-Location) ".env.local"))) {
    Write-Warning ".env.local পাওয়া যায়নি। .env.example copy করে environment configure করুন।"
}

Write-Host "[1/2] Dependency install হচ্ছে..."
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install ব্যর্থ হয়েছে।" }

Write-Host ""
Write-Host "[2/2] Development server চালু হচ্ছে..."
Write-Host "Browser: http://localhost:3000"
Write-Host ""
npm run dev
