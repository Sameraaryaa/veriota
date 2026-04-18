#!/bin/bash
source ~/veriota-dev/venv/bin/activate
python3 -c "
import oqs
sig = oqs.Signature('Dilithium3')
pub = sig.generate_keypair()
priv = sig.export_secret_key()
msg = b'VeriOTA test message'
signature = sig.sign(msg)
valid = sig.verify(msg, signature, pub)
print('Dilithium3 SIGN + VERIFY:', 'PASS' if valid else 'FAIL')
print('Public key size:', len(pub), 'bytes (expected 1952)')
print('Signature size:', len(signature), 'bytes (expected 3293)')
"
