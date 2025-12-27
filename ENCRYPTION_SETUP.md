# Encryption Setup Guide

## Overview
Sensitive data (2FA secrets) are now encrypted at rest using AES-256-GCM encryption.

## Generating Encryption Key

**CRITICAL**: Before deploying, generate a secure 256-bit encryption key:

```bash
openssl rand -base64 32
```

This will output something like: `xK8vN2pQ4rL6sT9wY3eR5tU7iO1pA3sD5fG7hJ9kL2mN4qP6rS8tV0wX2yZ4aB6c`

## Configuration

Add to your `.env` file:

```bash
ENCRYPTION_KEY=xK8vN2pQ4rL6sT9wY3eR5tU7iO1pA3sD5fG7hJ9kL2mN4qP6rS8tV0wX2yZ4aB6c
```

## Security Considerations

1. **Never commit the encryption key to version control**
2. **Back up the key securely** - if lost, encrypted data cannot be recovered
3. **Use different keys for development and production**
4. **Rotate keys periodically** (requires data re-encryption)
5. **Store production keys in secure key management systems** (AWS KMS, HashiCorp Vault, etc.)

## What Gets Encrypted

- `users.two_factor_secret` - TOTP secrets for 2FA authentication

## Key Rotation (Future Enhancement)

To rotate encryption keys:
1. Generate new key
2. Decrypt all data with old key
3. Re-encrypt with new key
4. Deploy new key to environment

Consider implementing a key versioning system for zero-downtime rotation.

## Troubleshooting

**Error: "Encryption key must be exactly 32 bytes"**
- Ensure key is generated with `openssl rand -base64 32`
- Key should be 44 characters long (32 bytes base64-encoded)

**Error: "Failed to decrypt data"**
- Check encryption key matches the one used to encrypt
- Verify key hasn't been modified
- Check for data corruption in database
