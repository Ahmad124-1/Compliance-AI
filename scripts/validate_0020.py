import re, sys
from pathlib import Path

raw = Path("apps/api/src/db/migrations/0020_sustainability.sql").read_text(encoding="utf-8")
# Strip line comments so prose in headers cannot false-positive
sql = "\n".join(line.split("--", 1)[0] for line in raw.splitlines())

BASE = {"organizations", "users", "departments", "sites"}
created = set(BASE)
fails = []

# Pass 1: table creation order + FK references + idempotency
order = []
for st in sql.split(";"):
    m = re.search(r"CREATE TABLE (IF NOT EXISTS )?(\w+)", st, re.I)
    if not m:
        continue
    n = m.group(2).lower()
    order.append(n)
    for r in re.findall(r"REFERENCES (\w+)", st, re.I):
        r = r.lower()
        if r not in created:
            fails.append(n + ": REFERENCES " + r + " before creation")
    if not m.group(1):
        fails.append(n + ": missing IF NOT EXISTS")
    created.add(n)

# Pass 2: every CREATE INDEX references an existing table + idempotent
for st in sql.split(";"):
    for m in re.finditer(r"CREATE INDEX (IF NOT EXISTS )?(\w+) ON (\w+)", st, re.I):
        tbl = m.group(3).lower()
        if tbl not in created:
            fails.append("Index " + m.group(2) + ": table " + tbl + " missing")
        if not m.group(1):
            fails.append("Index " + m.group(2) + ": missing IF NOT EXISTS")

# Pass 3: balanced parens (sanity for CHECK/UNIQUE constraints)
d = 0
for ch in sql:
    if ch == "(":
        d += 1
    elif ch == ")":
        d -= 1
if d:
    fails.append("Unbalanced parens: " + str(d))

# Pass 4: exact expected creation order
expected = [
    "sustainability_programs", "esg_goals", "sustainability_initiatives",
    "sustainability_kpis", "kpi_measurements", "initiative_milestones",
    "sdg_mappings", "documents", "sustainability_evidence",
    "sustainability_approvals", "sustainability_reports",
]
if order != expected:
    fails.append("Order mismatch: " + str(order))

print("Tables:", order)
if fails:
    print("VALIDATION FAILED:")
    for f in fails:
        print("  -", f)
    sys.exit(1)
print("VALIDATION PASSED")