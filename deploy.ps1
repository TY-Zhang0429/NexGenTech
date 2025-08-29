# ----- config -----
$Bucket = "nexgen-test"            
$DistId = "E2F8N1U924RXMT"         

# ----- build the project -----
Write-Host " Building..." -ForegroundColor Cyan
npm ci
npm run build

# ----- upload: longcache（exclude index.html）-----
Write-Host "  Uploading static assets (long cache)..." -ForegroundColor Cyan
aws s3 sync dist "s3://$Bucket" `
  --delete `
  --exclude index.html `
  --cache-control "public,max-age=31536000,immutable"

# ----- upload: shortcache-----
Write-Host " Uploading index.html (no-cache)..." -ForegroundColor Cyan
aws s3 cp dist/index.html "s3://$Bucket/index.html" `
  --cache-control "no-cache, no-store, must-revalidate" `
  --content-type "text/html; charset=utf-8"

# ----- CloudFront invalidation -----
Write-Host " Creating CloudFront invalidation..." -ForegroundColor Cyan
aws cloudfront create-invalidation `
  --distribution-id $DistId `
  --paths "/index.html" | Out-Null

Write-Host " Deploy done: https://www.nexgentech.me" -ForegroundColor Green
