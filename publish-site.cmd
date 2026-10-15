@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "FEATURE_BRANCH=feature/roa-site-redesign"
set "DEPLOY_BRANCH=main"
set "COMMIT_MESSAGE=%~1"

if not defined COMMIT_MESSAGE set "COMMIT_MESSAGE=Update LOA site"

echo.
echo [1/8] Checking repository...
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 goto not_repository

echo [2/8] Updating remote information...
git fetch origin
if errorlevel 1 goto failed

echo [3/8] Preparing %FEATURE_BRANCH%...
git switch "%FEATURE_BRANCH%"
if errorlevel 1 goto failed

echo [4/8] Checking JavaScript and changed files...
node --check script.js
if errorlevel 1 goto failed
git diff --check
if errorlevel 1 goto failed

git add -A
git diff --cached --quiet
if errorlevel 1 (
    git commit -m "%COMMIT_MESSAGE%"
    if errorlevel 1 goto failed
) else (
    echo No uncommitted changes were found.
)

echo [5/8] Pushing %FEATURE_BRANCH%...
git push -u origin "%FEATURE_BRANCH%"
if errorlevel 1 goto failed

echo [6/8] Updating %DEPLOY_BRANCH%...
git switch "%DEPLOY_BRANCH%"
if errorlevel 1 goto failed
git pull --ff-only origin "%DEPLOY_BRANCH%"
if errorlevel 1 goto main_update_failed

echo [7/8] Merging the approved redesign...
git merge --no-ff "%FEATURE_BRANCH%" -m "Deploy LOA site update"
if errorlevel 1 goto merge_failed

echo [8/8] Publishing to GitHub Pages...
git push origin "%DEPLOY_BRANCH%"
if errorlevel 1 goto push_failed

git switch "%FEATURE_BRANCH%"
echo.
echo ===============================================
echo  Published successfully.
echo  https://kan-official.com/roa_site/
echo ===============================================
echo GitHub Pages may take a few minutes to refresh.
exit /b 0

:not_repository
echo ERROR: This script is not inside the ROA Git repository.
goto end_failed

:main_update_failed
echo ERROR: main could not be updated with a fast-forward pull.
echo No deployment push was performed.
git switch "%FEATURE_BRANCH%" >nul 2>&1
goto end_failed

:merge_failed
echo ERROR: The merge stopped because of a conflict.
echo No deployment push was performed. Resolve or abort the merge manually.
goto end_failed

:push_failed
echo ERROR: The merge completed locally, but pushing main failed.
echo Check your GitHub authentication and network, then run:
echo   git push origin main
goto end_failed

:failed
echo ERROR: The command failed. No new main deployment push was performed.

:end_failed
echo.
echo Deployment was not completed.
exit /b 1
