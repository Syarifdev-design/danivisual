#!/bin/bash

# ================================================================================
# DaniVisual - Hostinger Deployment Script
# ================================================================================
# Usage: ./scripts/deploy-hostinger.sh
# ================================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HOSTINGER_HOST="${HOSTINGER_HOST:-your-hostinger.com}"
HOSTINGER_USER="${HOSTINGER_USER:-your_username}"
HOSTINGER_PASS="${HOSTINGER_PASS:-your_password}"
HOSTINGER_PATH="${HOSTINGER_PATH:-public_html}"
SSH_PORT="${SSH_PORT:-22}"

# Default values
BUILD_DIR="dist"
API_DIR="api"
HTACCESS_ROOT=".htaccess"
HTACCESS_API="api/.htaccess"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  DaniVisual - Hostinger Deployment Script${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Check if lftp is installed
check_lftp() {
    if ! command -v lftp &> /dev/null; then
        print_warning "lftp not found. Installing..."
        if command -v brew &> /dev/null; then
            brew install lftp
        elif command -v apt-get &> /dev/null; then
            sudo apt-get install lftp
        else
            print_error "Please install lftp manually"
            exit 1
        fi
    fi
}

# Build the project
build_project() {
    print_info "Building project..."
    npm run build
    if [ -d "$BUILD_DIR" ]; then
        print_status "Build completed: $BUILD_DIR/"
    else
        print_error "Build failed - dist/ directory not found"
        exit 1
    fi
}

# Deploy to Hostinger using lftp
deploy_lftp() {
    print_info "Deploying to Hostinger..."

    # Create lftp script
    LFTP_SCRIPT=$(mktemp)

    cat > "$LFTP_SCRIPT" << EOF
set ftp:ssl-allow no
set ssl:verify-certificate no
set xfer:log yes
set xfer:log-file /tmp/lftp.log

open -u $HOSTINGER_USER,$HOSTINGER_PASS ftp://$HOSTINGER_HOST:$SSH_PORT

# Change to target directory
lcd $BUILD_DIR
cd $HOSTINGER_PATH

# Upload all files
mirror --reverse --verbose --delete --overwrite --no-perms

# Upload .htaccess
cd $HOSTINGER_PATH
put -O ./ ./.htaccess

# Upload API directory
cd $HOSTINGER_PATH
mkdir -p api
cd api
lcd $API_DIR
mirror --reverse --verbose --delete --overwrite --no-perms

# Upload api/.htaccess
cd $HOSTINGER_PATH/api
put -O ./ ./.htaccess

bye
EOF

    # Execute lftp
    lftp -f "$LFTP_SCRIPT"

    # Cleanup
    rm -f "$LFTP_SCRIPT"

    print_status "Deployment completed!"
}

# Deploy using SCP (alternative)
deploy_scp() {
    print_info "Deploying using SCP..."

    # Upload dist files
    print_info "Uploading frontend files..."
    scp -r $BUILD_DIR/* $HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH/

    # Upload .htaccess
    print_info "Uploading root .htaccess..."
    scp .htaccess $HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH/

    # Upload API directory
    print_info "Uploading API files..."
    scp -r $API_DIR $HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH/

    print_status "Deployment completed!"
}

# Deploy using rsync (alternative)
deploy_rsync() {
    print_info "Deploying using rsync..."

    rsync -avz --delete \
        -e "ssh -p $SSH_PORT" \
        $BUILD_DIR/ \
        $HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH/

    rsync -avz --delete \
        -e "ssh -p $SSH_PORT" \
        .htaccess \
        $HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH/

    rsync -avz --delete \
        -e "ssh -p $SSH_PORT" \
        $API_DIR/ \
        $HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH/api/

    print_status "Deployment completed!"
}

# Verify deployment
verify_deployment() {
    print_info "Verifying deployment..."

    # Test if site is accessible
    if command -v curl &> /dev/null; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$HOSTINGER_HOST/2>/dev/null || echo "000")

        if [ "$HTTP_CODE" = "200" ]; then
            print_status "Site is accessible (HTTP $HTTP_CODE)"
        else
            print_warning "Site returned HTTP $HTTP_CODE - please verify manually"
        fi
    else
        print_warning "curl not found - skipping verification"
    fi
}

# Show help
show_help() {
    echo "Usage: ./scripts/deploy-hostinger.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --build         Build the project before deploying"
    echo "  --method METHOD Deployment method: lftp, scp, or rsync (default: lftp)"
    echo "  --verify Verify deployment after upload"
    echo "  --help          Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  HOSTINGER_HOST    Hostname (e.g., danivisual.com)"
    echo "  HOSTINGER_USER    FTP/SFTP username"
    echo "  HOSTINGER_PASS    FTP/SFTP password"
    echo "  HOSTINGER_PATH    Remote path (default: public_html)"
    echo "  SSH_PORT         SSH port (default: 22)"
    echo ""
    echo "Examples:"
    echo "  HOSTINGER_HOST=danivisual.com HOSTINGER_USER=admin ./scripts/deploy-hostinger.sh --build --verify"
    echo "  ./scripts/deploy-hostinger.sh --method rsync --build"
    echo ""
}

# Main script
main() {
    BUILD_FLAG=false
    VERIFY_FLAG=false
    METHOD="lftp"

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --build)
                BUILD_FLAG=true
                shift
                ;;
            --method)
                METHOD="$2"
                shift 2
                ;;
            --verify)
                VERIFY_FLAG=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Build if requested
    if [ "$BUILD_FLAG" = true ]; then
        build_project
    fi

    # Check if dist exists
    if [ ! -d "$BUILD_DIR" ]; then
        print_error "Build directory not found. Run with --build or npm run build first."
        exit 1
    fi

    # Deploy based on method
    case $METHOD in
        lftp)
            check_lftp
            deploy_lftp
            ;;
        scp)
            deploy_scp
            ;;
        rsync)
            deploy_rsync
            ;;
        *)
            print_error "Unknown deployment method: $METHOD"
            exit 1
            ;;
    esac

    # Verify if requested
    if [ "$VERIFY_FLAG" = true ]; then
        verify_deployment
    fi

    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  Deployment Complete!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    print_info "Don't forget to:"
    print_info "1. Set environment variables in Hostinger dashboard"
    print_info "2. Run database migrations if using PHP backend"
    print_info "3. Test the application"
}

# Run main function
main "$@"
