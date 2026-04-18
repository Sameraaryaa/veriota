import urllib.request, json

API = "http://localhost:8001"

def post(path, data):
    req = urllib.request.Request(f"{API}{path}", json.dumps(data).encode(), {"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())

def get(path):
    return json.loads(urllib.request.urlopen(f"{API}{path}").read())

# 1. Publish a legitimate firmware to the log
print("=== PUBLISH FIRMWARE v2.2.0 ===")
r = post("/api/transparency/publish", {
    "version": "2.2.0",
    "firmware_hash": "abc123def456trusted",
    "merkle_root": "merkle_root_hash_here",
    "signature": "sig_data_here"
})
print(f"  Status: {r['status']}, Sequence: {r['sequence']}")

# 2. Check the log
print("\n=== VERIFY LOG INTEGRITY ===")
r = get("/api/transparency/verify")
print(f"  Chain valid: {r['valid']}, Entries: {r['entries']}")

# 3. Check legitimate firmware (should be FOUND)
print("\n=== CHECK LEGITIMATE FIRMWARE ===")
r = post("/api/transparency/check", {"firmware_hash": "abc123def456trusted"})
print(f"  Status: {r['status']}")
print(f"  In log: {r['in_transparency_log']}")

# 4. Check STOLEN-KEY firmware (should NOT be found)
print("\n=== CHECK STOLEN-KEY FIRMWARE ===")
r = post("/api/transparency/check", {"firmware_hash": "MALICIOUS_stolen_key_firmware"})
print(f"  Status: {r['status']}")
print(f"  In log: {r['in_transparency_log']}")
print(f"  Message: {r['message']}")
