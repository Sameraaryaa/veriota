import json, hashlib, os
from datetime import datetime, timezone

vehicles = [
    'TATA-Nexon-EV-001', 'TATA-Nexon-EV-002', 'TATA-Nexon-EV-003', 'TATA-Nexon-EV-004', 'TATA-Nexon-EV-005',
    'TATA-Harrier-EV-01', 'TATA-Harrier-EV-02', 'TATA-Harrier-EV-03', 'TATA-Harrier-EV-04', 'TATA-Harrier-EV-05',
    'TATA-Curvv-EV-01',  'TATA-Curvv-EV-02',  'TATA-Curvv-EV-03',  'TATA-Curvv-EV-04',  'TATA-Curvv-EV-05',
    'TATA-Punch-EV-01',  'TATA-Punch-EV-02',  'TATA-Punch-EV-03',  'TATA-Punch-EV-04',  'TATA-Punch-EV-05'
]

db = {'vehicle_ledger': {}, 'firmware_releases': {}, 'transparency_log': []}
now = datetime.now(timezone.utc).isoformat()

for vid in vehicles:
    h = hashlib.sha256(f'veriota_v2.1.4_firmware_for_{vid}_baseline'.encode()).hexdigest()
    db['vehicle_ledger'][vid] = {
        'vehicle_id': vid,
        'current_version': '2.1.4',
        'current_hash': h,
        'algorithm': 'ML-DSA-65',
        'nist_standard': 'FIPS 204',
        'status': 'QUANTUM_SAFE',
        'alerts': [],
        'update_history': [
            {'version': '1.0.0', 'firmware_hash': hashlib.sha256(f'v1.0.0_{vid}'.encode()).hexdigest(), 'installed_at': '2024-01-15T10:00:00+00:00', 'status': 'QUANTUM_SAFE'},
            {'version': '2.0.0', 'firmware_hash': hashlib.sha256(f'v2.0.0_{vid}'.encode()).hexdigest(), 'installed_at': '2025-06-10T14:30:00+00:00', 'status': 'QUANTUM_SAFE'},
            {'version': '2.1.4', 'firmware_hash': h, 'installed_at': now, 'status': 'QUANTUM_SAFE'},
        ]
    }

# Write to BOTH locations
for db_path in [
    os.path.expanduser('~/veriota-dev/backend/database.json'),
    '/mnt/c/Users/arya/Desktop/veriota/database.json'
]:
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    with open(db_path, 'w') as f:
        json.dump(db, f, indent=2)
    print(f'Written to {db_path}')

print(f'Done. Seeded {len(vehicles)} TATA EV vehicles.')
