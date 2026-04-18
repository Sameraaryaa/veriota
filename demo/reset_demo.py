import requests
import sys

API_URL = "http://localhost:8001"

print("=" * 60)
print("  VeriOTA — Demo Reset Utility")
print("=" * 60)
print("Sending reset command to backend...")

try:
    res = requests.post(f"{API_URL}/demo/reset", timeout=10)
    if res.status_code == 200:
        print("✔ SUCCESS: All vehicles restored to QUANTUM_SAFE baseline.")
        print("✔ Database wiped of all tamper alerts.")
        print("→ You can now show the demo to the next judge!")
    else:
        print(f"✘ FAILED: Backend returned HTTP {res.status_code}")
except Exception as e:
    print(f"✘ ERROR: Could not connect to backend ({e})")
    print("Is the FastAPI backend running?")
