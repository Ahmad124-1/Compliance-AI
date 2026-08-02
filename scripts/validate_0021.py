"""Validate 0021_carbon_ghg.sql with sqlglot PostgreSQL dialect parser."""
import sys
from pathlib import Path

import sqlglot

MIGRATION = Path(__file__).resolve().parents[1] / "apps/api/src/db/migrations/0021_carbon_ghg.sql"

sql = MIGRATION.read_text(encoding="utf-8")

errors = []
try:
    statements = sqlglot.parse(sql, read="postgres")
    for i, stmt in enumerate(statements, start=1):
        if stmt is None:
            errors.append(f"Statement #{i}: parsed as None (likely trailing SOF/EOF issue)")
except Exception as exc:  # noqa: BLE001
    errors.append(f"Parse failed: {exc}")

if errors:
    print("VALIDATION FAILED")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)

valid = [s for s in statements if s is not None]
print(f"VALIDATION PASSED: {len(valid)} statements parsed successfully with PostgreSQL dialect")

# Extra checks
lower = sql.lower()
checks = [
    ("table constraints with WHERE (MySQL-style partial UNIQUE)", r"unique\s*\([^)]*\)\s*where"),
    ("trailing commas before closing paren", r",\s*\)"),
    ("backtick identifiers (MySQL)", r"`"),
    ("AUTO_INCREMENT (MySQL)", r"auto_increment"),
    ("ENGINE= (MySQL)", r"\bengine\s*="),
    ("TINYINT/INT unsigned (MySQL)", r"\b(tinyint|int)\s+unsigned"),
    ("NVARCHAR (SQL Server)", r"\bnvarchar\b"),
    ("IDENTITY( (SQL Server)", r"\bidentity\s*\("),
    ("GO batch separator (SQL Server)", r"^\s*go\s*$"),
]
problem_found = False
for label, pattern in checks:
    import re
    if re.search(pattern, lower, re.IGNORECASE | re.MULTILINE):
        print(f"  WARNING: {label} pattern found")
        problem_found = True

if problem_found:
    print("WARNINGS DETECTED (see above)")
    sys.exit(2)

print("No MySQL / SQL Server / trailing-comma patterns found.")