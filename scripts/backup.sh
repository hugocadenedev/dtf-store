#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# DTF Store — Database Backup Script
# Creates timestamped backups of the SQLite database
# Keeps the last 30 backups (rotation)
# Usage: bash scripts/backup.sh
# ═══════════════════════════════════════════════════════════════════
set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB_FILE="$APP_DIR/data/production.db"
BACKUP_DIR="$APP_DIR/backups"
MAX_BACKUPS=30

# ─── 1. Check if DB exists ───────────────────────────────────────
if [ ! -f "$DB_FILE" ]; then
    echo "⚠️  No database found at $DB_FILE — nothing to backup."
    exit 0
fi

# ─── 2. Create backup directory ──────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ─── 3. Create timestamped backup ────────────────────────────────
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/production_${TIMESTAMP}.db"

# Use SQLite .backup command for a safe copy (no corruption risk)
if command -v sqlite3 &>/dev/null; then
    sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"
else
    # Fallback: simple copy (safe if app is stopped or using WAL mode)
    cp "$DB_FILE" "$BACKUP_FILE"
fi

# Also backup WAL and SHM files if they exist
[ -f "${DB_FILE}-wal" ] && cp "${DB_FILE}-wal" "${BACKUP_FILE}-wal"
[ -f "${DB_FILE}-shm" ] && cp "${DB_FILE}-shm" "${BACKUP_FILE}-shm"

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Backup created: $BACKUP_FILE ($SIZE)"

# ─── 4. Rotate old backups (keep last N) ─────────────────────────
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/production_*.db 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    REMOVE_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
    echo "🔄 Removing $REMOVE_COUNT old backup(s)..."
    ls -1t "$BACKUP_DIR"/production_*.db | tail -n "$REMOVE_COUNT" | while read f; do
        rm -f "$f" "${f}-wal" "${f}-shm"
        echo "   Removed: $(basename "$f")"
    done
fi

echo "📦 Total backups: $(ls -1 "$BACKUP_DIR"/production_*.db 2>/dev/null | wc -l)/$MAX_BACKUPS"
