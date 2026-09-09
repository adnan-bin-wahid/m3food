Fixes TypeScript failure:

src/lib/security/otp-delivery.test.ts
Property 'to'/'message'/'token' does not exist on type 'never'.

The test capture variable was too loosely typed. This hotfix gives it the required shape.

Run:
powershell -ExecutionPolicy Bypass -File APPLY-OTP-DELIVERY-TYPECHECK-HOTFIX.ps1 -Repo "D:\work\Repositories\m3 food\website-code"
