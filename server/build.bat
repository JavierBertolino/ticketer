@echo off

REM Set your variables
set LAMBDA_FUNCTION_NAME=ticketer
set ZIP_FILE=lambda_code.zip
set AWS_PROFILE=berto


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
@REM aws lambda update-function-code --function-name %LAMBDA_FUNCTION_NAME% --zip-file fileb://%ZIP_FILE%

@REM REM Check if the upload was successful
@REM if %ERRORLEVEL% neq 0 (
@REM     echo Failed to upload to AWS Lambda.
@REM     exit /b 1
@REM )

@REM echo Lambda function updated successfully.
@REM exit /b 0
