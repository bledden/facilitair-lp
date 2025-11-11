#!/bin/bash

# ============================================================================
# BETA SYSTEM INSTALLATION SCRIPT
# ============================================================================
# This script automatically integrates the beta password system into server.js
# Usage: bash install-beta-system.sh
# ============================================================================

set -e  # Exit on error

echo "🚀 Beta System Installation Script"
echo "===================================="
echo ""

# Check if server.js exists
if [ ! -f "server.js" ]; then
    echo "❌ ERROR: server.js not found in current directory"
    echo "   Please run this script from the facilitair-lp directory"
    exit 1
fi

# Check if required files exist
echo "📋 Checking required files..."
REQUIRED_FILES=("beta-system.js" "beta-endpoints.js" "BETA_SETUP_GUIDE.md")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ ERROR: $file not found"
        exit 1
    fi
    echo "   ✅ $file"
done

# Check if .env exists
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  WARNING: .env file not found"
    echo "   Creating .env from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "   ✅ Created .env"
    else
        echo "   ❌ ERROR: .env.example not found either"
        exit 1
    fi
fi

# Check if BETA_ADMIN_PASSWORD is set
if ! grep -q "BETA_ADMIN_PASSWORD=" .env; then
    echo ""
    echo "⚠️  BETA_ADMIN_PASSWORD not found in .env"
    echo "   Generating secure password..."

    # Generate secure random password
    BETA_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    echo "BETA_ADMIN_PASSWORD=$BETA_PASS" >> .env

    echo "   ✅ Generated and saved BETA_ADMIN_PASSWORD"
    echo "   📝 Your admin password: $BETA_PASS"
    echo "   ⚠️  Save this password securely!"
    echo ""
fi

# Create backup of server.js
echo ""
echo "💾 Creating backup of server.js..."
BACKUP_FILE="server.js.backup.$(date +%Y%m%d_%H%M%S)"
cp server.js "$BACKUP_FILE"
echo "   ✅ Backup saved as: $BACKUP_FILE"

# Check if beta system is already integrated
if grep -q "beta-system" server.js; then
    echo ""
    echo "⚠️  Beta system appears to already be integrated in server.js"
    read -p "   Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "   ❌ Installation cancelled"
        exit 1
    fi
fi

echo ""
echo "🔧 Modifying server.js..."

# Create temporary file for modifications
TMP_FILE="server.js.tmp"
cp server.js "$TMP_FILE"

# Find the line number for database initialization
DB_LINE=$(grep -n "const db = new Database" "$TMP_FILE" | head -1 | cut -d: -f1)

if [ -z "$DB_LINE" ]; then
    echo "   ❌ ERROR: Could not find database initialization line"
    echo "      Looking for: const db = new Database"
    rm "$TMP_FILE"
    exit 1
fi

echo "   ✅ Found database initialization at line $DB_LINE"

# Insert beta system initialization after database line
BETA_INIT="
// Initialize beta system
const BetaPasswordSystem = require('./beta-system');
const { setupBetaEndpoints } = require('./beta-endpoints');
const betaSystem = new BetaPasswordSystem(db);

// Cleanup expired beta sessions every hour
setInterval(() => {
    try {
        betaSystem.cleanupExpiredSessions();
        console.log('[Beta System] Cleaned up expired sessions');
    } catch (error) {
        console.error('[Beta System] Error cleaning up sessions:', error);
    }
}, 60 * 60 * 1000);
"

# Insert after database line
awk -v line="$DB_LINE" -v text="$BETA_INIT" '
    NR == line { print; print text; next }
    { print }
' "$TMP_FILE" > "${TMP_FILE}.2"
mv "${TMP_FILE}.2" "$TMP_FILE"

echo "   ✅ Added beta system initialization"

# Find line for HTML serving routes
HTML_LINE=$(grep -n "// Serve HTML pages\|app.get('/', " "$TMP_FILE" | head -1 | cut -d: -f1)

if [ -z "$HTML_LINE" ]; then
    echo "   ⚠️  WARNING: Could not find HTML serving section"
    echo "      You'll need to manually add setupBetaEndpoints(app, betaSystem);"
    echo "      Add it before your HTML serving routes"
else
    echo "   ✅ Found HTML serving section at line $HTML_LINE"

    # Insert beta endpoints before HTML serving
    BETA_ENDPOINTS="
// ==================== BETA ACCESS SYSTEM ====================

setupBetaEndpoints(app, betaSystem);
console.log('[Beta System] API endpoints registered');
console.log('  POST /api/beta/verify');
console.log('  POST /api/beta/verify-session');
console.log('  POST /api/beta/admin/auth');
console.log('  POST /api/beta/admin/generate');
console.log('  GET  /api/beta/admin/list');
console.log('  POST /api/beta/admin/revoke');

"

    # Insert before HTML serving line
    awk -v line="$HTML_LINE" -v text="$BETA_ENDPOINTS" '
        NR == line { print text; print; next }
        { print }
    ' "$TMP_FILE" > "${TMP_FILE}.2"
    mv "${TMP_FILE}.2" "$TMP_FILE"

    echo "   ✅ Added beta endpoint registration"
fi

# Replace original server.js
mv "$TMP_FILE" server.js
chmod 644 server.js

echo ""
echo "✅ Beta system integration complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Review the changes in server.js"
echo "   2. Check .env for BETA_ADMIN_PASSWORD"
echo "   3. Start server: npm start"
echo "   4. Navigate to http://localhost:3000/beta-admin.html"
echo "   5. Login with your BETA_ADMIN_PASSWORD"
echo "   6. Generate beta passwords for users"
echo ""
echo "🔐 Your admin password is in .env file"
echo ""
echo "📚 For detailed documentation, see BETA_SETUP_GUIDE.md"
echo ""

# Optional: Test if server.js has valid syntax
if command -v node &> /dev/null; then
    echo "🧪 Testing server.js syntax..."
    if node -c server.js 2>/dev/null; then
        echo "   ✅ Syntax check passed"
    else
        echo "   ⚠️  Syntax errors detected"
        echo "   Run: node -c server.js"
        echo "   To restore backup: mv $BACKUP_FILE server.js"
    fi
fi

echo ""
echo "💾 Backup saved as: $BACKUP_FILE"
echo "   To restore: mv $BACKUP_FILE server.js"
echo ""
