@echo off
call pnpm run build
if %ERRORLEVEL% neq 0 (
    echo Build failed.
    exit /b %ERRORLEVEL%
)

aws s3 sync dist/ s3://ticketer-ad5c5fe4-d288-4c49-b916-125663c09ed2/
if %ERRORLEVEL% neq 0 (
    echo S3 sync failed.
    exit /b %ERRORLEVEL%
)

aws cloudfront create-invalidation --distribution-id E2EW8ECXU3IXL7 --paths "/*"
if %ERRORLEVEL% neq 0 (
    echo CloudFront invalidation failed.
    exit /b %ERRORLEVEL%
)
