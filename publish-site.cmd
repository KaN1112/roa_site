@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "FEATURE_BRANCH=feature/roa-site-redesign"
set "DEPLOY_BRANCH=main"
set "COMMIT_MESSAGE=%~1"
if not defined COMMIT_MESSAGE set "COMMIT_MESSAGE=Update LOA site"

echo.
echo [1/7] Checking repository and branch...
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 goto not_repository

git switch "%FEATURE_BRANCH%"
if errorlevel 1 goto failed

echo [2/7] Checking JavaScript and changed files...
node --check script.js
if errorlevel 1 goto failed
git diff --check
if errorlevel 1 goto failed

echo [3/7] Committing local changes...
git add -A
git diff --cached --quiet
if errorlevel 1 (
    git commit -m "%COMMIT_MESSAGE%"
    if errorlevel 1 goto failed
) else (
    echo No uncommitted changes were found.
)

echo [4/7] Updating remote information...
git fetch origin
if errorlevel 1 goto failed

echo [5/7] Checking that main can be updated safely...
git merge-base --is-ancestor "origin/%DEPLOY_BRANCH%" "%FEATURE_BRANCH%"
if errorlevel 1 goto not_fast_forward

echo [6/7] Pushing %FEATURE_BRANCH%...
git push -u origin "%FEATURE_BRANCH%"
if errorlevel 1 goto failed

echo [7/7] Publishing %FEATURE_BRANCH% to %DEPLOY_BRANCH%...
git push origin "%FEATURE_BRANCH%:%DEPLOY_BRANCH%"
if errorlevel 1 goto push_failed

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

:not_fast_forward
echo ERROR: origin/main contains changes not present in the feature branch.
echo No deployment push was performed. Merge origin/main into the feature branch first.
goto end_failed

:push_failed
echo ERROR: Publishing main failed.
echo Check GitHub authentication, branch protection, and network access.
goto end_failed

:failed
echo ERROR: The command failed. No new main deployment push was performed.

:end_failed
echo.
echo Deployment was not completed.
exit /b 1
