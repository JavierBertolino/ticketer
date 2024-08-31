@echo off

REM Set your variables
set LAMBDA_FUNCTION_NAME=ticketer
set ZIP_FILE=lambda_code.zip


REM Remove any existing zip file
if exist %ZIP_FILE% del %ZIP_FILE%

REM Zip the lambda code
echo Zipping lambda code...
powershell -command "Compress-Archive -Path * -DestinationPath %ZIP_FILE%"

REM Check if the zip file was created successfully
if not exist %ZIP_FILE% (
    echo Failed to create zip file.
    exit /b 1
)

@REM REM Upload the zip file to AWS Lambda
@REM echo Uploading zip file to AWS Lambda...
aws lambda update-function-code --function-name ticketer --zip-file fileb://lambda_code.zip

REM Check if the upload was successful
if %ERRORLEVEL% neq 0 (
    echo Failed to upload to AWS Lambda.
    exit /b 1
)

echo Lambda function updated successfully.
exit /b 0
