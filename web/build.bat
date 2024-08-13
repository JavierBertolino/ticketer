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
