"""
VeriOTA — Merkle Tree Engine
Provides firmware integrity verification with byte-level tamper localization.

Key properties:
- 4KB chunk size (matches ARM Cortex-M4 page size)
- SHA-256 leaf hashing (128-bit quantum security via Grover's bound)
- O(log N) Merkle proof paths for efficient ECU verification
- Tamper localization: chunk index + exact byte range
"""
import hashlib
from typing import List, Dict, Any, Optional

CHUNK_SIZE = 4096  # 4KB — ARM Cortex-M4 memory page boundary


def sha256(data: bytes) -> bytes:
    return hashlib.sha256(data).digest()


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def chunk_firmware(firmware: bytes) -> List[bytes]:
    """Split firmware into fixed 4KB chunks. Zero-pad the final chunk."""
    chunks = [firmware[i:i + CHUNK_SIZE] for i in range(0, len(firmware), CHUNK_SIZE)]
    if chunks and len(chunks[-1]) < CHUNK_SIZE:
        chunks[-1] = chunks[-1].ljust(CHUNK_SIZE, b'\x00')
    return chunks


def build_merkle_tree(firmware: bytes) -> Dict[str, Any]:
    """
    Build a complete Merkle tree from firmware bytes.
    Construction: bottom-up, duplicating last node if level has odd count.
    Returns: root (hex), leaves (hex list), tree (all levels), chunk_count, file_size.
    """
    chunks = chunk_firmware(firmware)
    leaves = [sha256(chunk) for chunk in chunks]

    tree = [leaves]
    current = leaves[:]

    while len(current) > 1:
        if len(current) % 2 == 1:
            current = current + [current[-1]]  # Duplicate last (standard Merkle padding)
        current = [
            sha256(current[i] + current[i + 1])
            for i in range(0, len(current), 2)
        ]
        tree.append(current)

    merkle_root = tree[-1][0]

    return {
        "root": merkle_root.hex(),
        "leaves": [h.hex() for h in leaves],
        "tree": [[h.hex() for h in level] for level in tree],
        "chunk_count": len(chunks),
        "file_size": len(firmware),
        "chunk_size": CHUNK_SIZE,
        "tree_depth": len(tree),
    }


def get_merkle_proof(leaves_hex: List[str], chunk_index: int) -> Dict[str, Any]:
    """
    Generate a Merkle proof for a specific chunk index.
    Returns the O(log N) sibling hashes needed to verify this chunk's inclusion.

    This enables ECUs to verify a single chunk without the full tree —
    Bitcoin SPV-style partial verification for resource-constrained ECUs.
    """
    leaves = [bytes.fromhex(h) for h in leaves_hex]
    n = len(leaves)
    if chunk_index >= n:
        return {"error": f"chunk_index {chunk_index} out of range (max {n - 1})"}

    proof_path = []
    current_level = leaves[:]
    index = chunk_index

    while len(current_level) > 1:
        if len(current_level) % 2 == 1:
            current_level = current_level + [current_level[-1]]

        # Get sibling
        if index % 2 == 0:
            sibling_index = index + 1
            direction = "right"
        else:
            sibling_index = index - 1
            direction = "left"

        proof_path.append({
            "direction": direction,
            "hash": current_level[sibling_index].hex(),
        })

        # Move to next level
        current_level = [
            sha256(current_level[i] + current_level[i + 1])
            for i in range(0, len(current_level), 2)
        ]
        index = index // 2

    return {
        "chunk_index": chunk_index,
        "byte_start": chunk_index * CHUNK_SIZE,
        "byte_end": (chunk_index + 1) * CHUNK_SIZE - 1,
        "merkle_root": current_level[0].hex(),
        "proof_path": proof_path,
        "proof_length": len(proof_path),
        "note": f"O(log N) = {len(proof_path)} hashes to verify chunk out of {n} total chunks",
    }


def verify_merkle_proof(leaf_hash_hex: str, proof_path: List[Dict], expected_root_hex: str) -> bool:
    """
    Verify a Merkle proof path.
    An ECU only needs the chunk hash + proof path to verify authenticity — not the full tree.
    """
    current = bytes.fromhex(leaf_hash_hex)
    for step in proof_path:
        sibling = bytes.fromhex(step["hash"])
        if step["direction"] == "right":
            current = sha256(current + sibling)
        else:
            current = sha256(sibling + current)
    return current.hex() == expected_root_hex


def verify_merkle(firmware: bytes, trusted_leaves: List[str]) -> Dict[str, Any]:
    """
    Rebuild Merkle tree from received firmware and compare leaf hashes.
    Returns tampered chunk details with exact byte ranges.
    """
    computed = build_merkle_tree(firmware)
    computed_leaves = computed["leaves"]
    tampered_chunks = []

    if len(computed_leaves) != len(trusted_leaves):
        return {
            "merkle_match": False,
            "tampered_chunks": [],
            "error": f"Chunk count mismatch: expected {len(trusted_leaves)}, got {len(computed_leaves)}",
            "computed_root": computed["root"],
        }

    for i, (trusted, computed_hash) in enumerate(zip(trusted_leaves, computed_leaves)):
        if trusted != computed_hash:
            tampered_chunks.append({
                "chunk_index": i,
                "byte_start": i * CHUNK_SIZE,
                "byte_end": (i + 1) * CHUNK_SIZE - 1,
                "trusted_hash": trusted[:16] + "...",
                "computed_hash": computed_hash[:16] + "...",
                "trusted_hash_full": trusted,
                "computed_hash_full": computed_hash,
            })

    return {
        "merkle_match": len(tampered_chunks) == 0,
        "tampered_chunks": tampered_chunks,
        "computed_root": computed["root"],
        "chunk_count": len(computed_leaves),
    }
