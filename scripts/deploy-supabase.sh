#!/bin/bash
# =============================================================================
# DANIVISUAL SUPABASE DEPLOY SCRIPT - Unix/Mac/Linux
# =============================================================================
# Purpose: Deploy all SQL files to Supabase database
# Usage: ./scripts/deploy-supabase.sh
#
# Requirements:
#   1. PostgreSQL client (psql) must be installed
#   2. .env.local file with DATABASE_URL
#
# Installation (if psql not found):
#   - macOS: brew install postgresql
#   - Ubuntu/Debian: sudo apt install postgresql-client
#   - Fedora/RHEL: sudo dnf install postgresql
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SUPABASE_DIR="$PROJECT_DIR/supabase"

echo "================================================================================"
echo "Danivisual Supabase Database Deploy"
echo "================================================================================"
echo ""

# Check for .env.local file
if [ ! -f "$PROJECT_DIR/.env.local" ]; then
    echo -e "${RED}ERROR: .env.local file not found!${NC}"
    echo ""
    echo "Please create .env.local file with DATABASE_URL"
    echo "Example: DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
    echo ""
    echo "See docs/SUPABASE_DEPLOY.md for instructions."
    exit 1
fi

# Read DATABASE_URL from .env.local
DATABASE_URL=$(grep "^DATABASE_URL=" "$PROJECT_DIR/.env.local" | cut -d '=' -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

# Remove quotes if present
DATABASE_URL="${DATABASE_URL%\"}"
DATABASE_URL="${DATABASE_URL#\"}"

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL not found in .env.local${NC}"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}WARNING: psql not found in PATH${NC}"
    echo ""
    echo "Please install PostgreSQL client:"
    echo "  - macOS: brew install postgresql"
    echo "  - Ubuntu/Debian: sudo apt install postgresql-client"
    echo "  - Or use Supabase CLI: npx supabase db push"
    exit 1
fi

echo -e "${GREEN}Starting database deployment...${NC}"
echo ""

# Function to execute SQL file
ERROR_COUNT=0

execute_sql() {
    local LABEL="$1"
    local FILE="$2"

    if [ ! -f "$FILE" ]; then
        echo -e "${YELLOW}[SKIP]${NC} $LABEL: File not found"
        return 0
    fi

    echo "Executing $LABEL..."
    if psql "$DATABASE_URL" -f "$FILE" > /dev/null 2>&1; then
        echo -e "${GREEN}  [OK]${NC} $LABEL"
    else
        echo -e "${RED}  [ERROR]${NC} $LABEL"
        ((ERROR_COUNT++))
    fi
}

# STEP 1: Core Schema Files
echo -e "${BLUE}Applying Core Schema...${NC}"
execute_sql "Core Schema" "$SUPABASE_DIR/schema.sql"
execute_sql "Auth Schema" "$SUPABASE_DIR/schema-auth.sql"
execute_sql "Admin Schema" "$SUPABASE_DIR/schema-admin.sql"
execute_sql "Bookings Schema" "$SUPABASE_DIR/schema-bookings.sql"
execute_sql "Operational Schema" "$SUPABASE_DIR/schema-operational.sql"
execute_sql "Staff Management Schema" "$SUPABASE_DIR/schema-staff-management.sql"
execute_sql "Staff KPI Schema" "$SUPABASE_DIR/schema-staff-kpi.sql"

# STEP 2: Additional Schema Files
echo ""
echo -e "${BLUE}Applying Additional Schema...${NC}"
execute_sql "Inquiries Schema" "$SUPABASE_DIR/schema-inquiries.sql"
execute_sql "Payment Accounts Schema" "$SUPABASE_DIR/schema-payment-accounts.sql"

# STEP 3: RLS Policies
echo ""
echo -e "${BLUE}Applying RLS Policies...${NC}"
execute_sql "RLS Policies" "$SUPABASE_DIR/rls-policies.sql"

# STEP 4: Migrations
echo ""
echo -e "${BLUE}Running Migrations...${NC}"
execute_sql "Migration 002" "$SUPABASE_DIR/migrations/002_add_employee_user_linking.sql"
execute_sql "Migration 003" "$SUPABASE_DIR/migrations/003_attendance_settings.sql"
execute_sql "Migration 004" "$SUPABASE_DIR/migrations/004_align_staff_tasks_schema.sql"
execute_sql "Migration 005a" "$SUPABASE_DIR/migrations/005_add_employee_info_to_attendance_records.sql"
execute_sql "Migration 005b" "$SUPABASE_DIR/migrations/005_kpi_jobs.sql"
execute_sql "Migration 006" "$SUPABASE_DIR/migrations/006_customers_foundation.sql"
execute_sql "Migration 007" "$SUPABASE_DIR/migrations/007_inquiry_customer_conversion.sql"
execute_sql "Migration 008" "$SUPABASE_DIR/migrations/008_harden_finance_payments_rls.sql"
execute_sql "Migration 009" "$SUPABASE_DIR/migrations/009_bookings_archive_fields.sql"
execute_sql "Migration 010" "$SUPABASE_DIR/migrations/010_harden_bookings_rls.sql"
execute_sql "Migration 011" "$SUPABASE_DIR/migrations/011_harden_staff_tables_rls.sql"
execute_sql "Migration 012" "$SUPABASE_DIR/migrations/012_add_customers_auth_id_link.sql"
execute_sql "Migration 013" "$SUPABASE_DIR/migrations/013_harden_finance_and_staff_rls.sql"
execute_sql "Migration 014" "$SUPABASE_DIR/migrations/014_finance_customer_data_restriction.sql"
execute_sql "Migration 015a" "$SUPABASE_DIR/migrations/015_add_attendance_selfies_bucket.sql"
execute_sql "Migration 015b" "$SUPABASE_DIR/migrations/015_add_operational_staff_roles.sql"
execute_sql "Migration 016" "$SUPABASE_DIR/migrations/016_seed_production_users.sql"

# STEP 5: Seed Data (Optional)
echo ""
echo -e "${BLUE}Running Seed Data (Optional)...${NC}"
execute_sql "Seed Packages" "$SUPABASE_DIR/seed-packages.sql"
execute_sql "Seed Portfolio" "$SUPABASE_DIR/seed-portfolio.sql"
execute_sql "Seed FAQs" "$SUPABASE_DIR/seed-faqs-from-frontend.sql"
execute_sql "Seed Portfolio Frontend" "$SUPABASE_DIR/seed-portfolio-from-frontend.sql"

echo ""
echo "================================================================================"
if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}SUCCESS: All SQL files executed successfully!${NC}"
else
    echo -e "${YELLOW}WARNING: $ERROR_COUNT file(s) had errors. Check output above.${NC}"
fi
echo "================================================================================"
echo ""
echo "Next steps:"
echo "  1. Verify in Supabase Dashboard: https://supabase.com/dashboard"
echo "  2. Check table structure in SQL Editor"
echo "  3. Test the application"
echo ""

exit $ERROR_COUNT