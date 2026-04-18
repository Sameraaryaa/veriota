import json, os
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "database.json")
if os.path.exists(db_path):
    with open(db_path) as f:
        db = json.load(f)
    db["transparency_log"] = []
    with open(db_path, "w") as f:
        json.dump(db, f, indent=2)
    print("Transparency log cleared for pi-seeded genesis rebuild")
else:
    print("No database found at", db_path)
