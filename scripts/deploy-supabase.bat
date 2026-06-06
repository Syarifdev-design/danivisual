@echo off
REM =============================================================================
REM DANIVISUAL SUPABASE DEPLOY SCRIPT - Windows
REM =============================================================================
REM Purpose: Deploy all SQL files to Supabase database
REM Usage: Run this script from project root
REM
REM Requirements:
REM   1. PostgreSQL client (psql) must be installed
REM   2. .env.local file with DATABASE_URL
REM
REM Installation (if psql not found):
REM   - Download from https://www.postgresql.org/download/windows/
REM   - Or use: choco install postgresql
REM =============================================================================

setlocal enabledelayedexpansion

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%"
set "SUPABASE_DIR=%PROJECT_DIR%supabase"

REM Color codes for output
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

echo ================================================================================
echo Danivisual Supabase Database Deploy
echo ================================================================================
echo.

REM Check for .env.local file
if not exist "%PROJECT_DIR%.env.local" (
    echo %RED%ERROR: .env.local file not found!%NC%
    echo.
    echo Please create .env.local file with DATABASE_URL
    echo Example: DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
    echo.
    echo See docs/SUPABASE_DEPLOY.md for instructions.
    echo.
    pause
    exit /b 1
)

REM Read DATABASE_URL from .env.local
set "DATABASE_URL="
for /f "usebackq tokens=1,* delims==" %%a in ("%PROJECT_DIR%.env.local") do (
    if "%%a"=="DATABASE_URL" set "DATABASE_URL=%%b"
)

REM Remove quotes if present
set "DATABASE_URL=%DATABASE_URL:"=%"

if "%DATABASE_URL%"=="" (
    echo %RED%ERROR: DATABASE_URL not found in .env.local%NC%
    pause
    exit /b 1
)

REM Check if psql is available
where psql >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %YELLOW%WARNING: psql not found in PATH%NC%
    echo.
    echo Please install PostgreSQL client:
    echo   - Download from https://www.postgresql.org/download/windows/
    echo   - Or run: choco install postgresql
    echo.
    echo Or use Supabase CLI:
    echo   - Run: npx supabase db push
    echo.
    pause
    exit /b 1
)

echo %GREEN%Starting database deployment...%NC%
echo.

REM Function to execute SQL file
set "ERROR_COUNT=0"

call :execute_sql "Core Schema" "%SUPABASE_DIR%\schema.sql"
call :execute_sql "Auth Schema" "%SUPABASE_DIR%\schema-auth.sql"
call :execute_sql "Admin Schema" "%SUPABASE_DIR%\schema-admin.sql"
call :execute_sql "Bookings Schema" "%SUPABASE_DIR%\schema-bookings.sql"
call :execute_sql "Operational Schema" "%SUPABASE_DIR%\schema-operational.sql"
call :execute_sql "Staff Management Schema" "%SUPABASE_DIR%\schema-staff-management.sql"
call :execute_sql "Staff KPI Schema" "%SUPABASE_DIR%\schema-staff-kpi.sql"
call :execute_sql "Inquiries Schema" "%SUPABASE_DIR%\schema-inquiries.sql"
call :execute_sql "Payment Accounts Schema" "%SUPABASE_DIR%\schema-payment-accounts.sql"

echo.
echo %BLUE%Applying RLS Policies...%NC%
call :execute_sql "RLS Policies" "%SUPABASE_DIR%\rls-policies.sql"

echo.
echo %BLUE%Running Migrations...%NC%
call :execute_sql "Migration 002" "%SUPABASE_DIR%\migrations\002_add_employee_user_linking.sql"
call :execute_sql "Migration 003" "%SUPABASE_DIR%\migrations\003_attendance_settings.sql"
call :execute_sql "Migration 004" "%SUPABASE_DIR%\migrations\004_align_staff_tasks_schema.sql"
call :execute_sql "Migration 005a" "%SUPABASE_DIR%\migrations\005_add_employee_info_to_attendance_records.sql"
call :execute_sql "Migration 005b" "%SUPABASE_DIR%\migrations\005_kpi_jobs.sql"
call :execute_sql "Migration 006" "%SUPABASE_DIR%\migrations\006_customers_foundation.sql"
call :execute_sql "Migration 007" "%SUPABASE_DIR%\migrations\007_inquiry_customer_conversion.sql"
call :execute_sql "Migration 008" "%SUPABASE_DIR%\migrations\008_harden_finance_payments_rls.sql"
call :execute_sql "Migration 009" "%SUPABASE_DIR%\migrations\009_bookings_archive_fields.sql"
call :execute_sql "Migration 010" "%SUPABASE_DIR%\migrations\010_harden_bookings_rls.sql"
call :execute_sql "Migration 011" "%SUPABASE_DIR%\migrations\011_harden_staff_tables_rls.sql"
call :execute_sql "Migration 012" "%SUPABASE_DIR%\migrations\012_add_customers_auth_id_link.sql"
call :execute_sql "Migration 013" "%SUPABASE_DIR%\migrations\013_harden_finance_and_staff_rls.sql"
call :execute_sql "Migration 014" "%SUPABASE_DIR%\migrations\014_finance_customer_data_restriction.sql"
call :execute_sql "Migration 015a" "%SUPABASE_DIR%\migrations\015_add_attendance_selfies_bucket.sql"
call :execute_sql "Migration 015b" "%SUPABASE_DIR%\migrations\015_add_operational_staff_roles.sql"
call :execute_sql "Migration 016" "%SUPABASE_DIR%\migrations\016_seed_production_users.sql"

echo.
echo %BLUE%Running Seed Data (Optional)...%NC%
call :execute_sql "Seed Packages" "%SUPABASE_DIR%\seed-packages.sql"
call :execute_sql "Seed Portfolio" "%SUPABASE_DIR%\seed-portfolio.sql"
call :execute_sql "Seed FAQs" "%SUPABASE_DIR%\seed-faqs-from-frontend.sql"
call :execute_sql "Seed Portfolio Frontend" "%SUPABASE_DIR%\seed-portfolio-from-frontend.sql"

echo.
echo ================================================================================
if %ERROR_COUNT% equ 0 (
    echo %GREEN%SUCCESS: All SQL files executed successfully!%NC%
) else (
    echo %YELLOW%WARNING: %ERROR_COUNT% file(s) had errors. Check output above.%NC%
)
echo ================================================================================
echo.
echo Next steps:
echo   1. Verify in Supabase Dashboard: https://supabase.com/dashboard
echo   2. Check table structure in SQL Editor
echo   3. Test the application
echo.
pause
exit /b %ERROR_COUNT%

:end

REM Function to execute SQL file
:execute_sql
set "LABEL=%~1"
set "FILE=%~2"

if not exist "%FILE%" (
    echo %YELLOW%[SKIP] %LABEL%: File not found%NC%
    goto :eof
)

echo Executing %LABEL%...
psql "%DATABASE_URL%" -f "%FILE%" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo %GREEN%  [OK] %LABEL%%NC%
) else (
    echo %RED%  [ERROR] %LABEL%%NC%
    set /a ERROR_COUNT+=1
)
goto :eof