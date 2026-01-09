# Security & Cryptography Documentation (`src/status/CryptoService.js`)

## Overview
SecureChat uses **Hybrid Encryption** combining RSA (for key exchange/signing) and AES (for efficient message encryption). All operations use the browser's native **Web Crypto API** (`window.crypto.subtle`) for maximum performance and security.

## Algorithms Used
1.  **RSA-OAEP (2048-bit)**: Used for encrypting the symmetric AES key.
    -   *Why?* RSA is slow for large data but perfect for small secrets like keys.
2.  **RSASSA-PKCS1-v1_5 (2048-bit)**: Used for digital signatures.
    -   *Why?* Ensures the message actually came from the claimed sender (Non-repudiation/Authenticity).
3.  **AES-GCM (256-bit)**: Used for encrypting the actual text message.
    -   *Why?* Symmetric encryption is extremely fast and GCM mode provides built-in integrity checking.

## The Encryption Flow (`signAndEncrypt`)
When sending a message `M` to Bob:
1.  **Sign**: Calculate signature `S` of `M` using Alice's **Private Signing Key**.
2.  **Package**: Create a JSON payload `{ missatge: M, signatura: S }`.
3.  **Session Key**: Generate a random ephemeral AES-256 key (`AES_K`).
4.  **Encrypt Data**: Encrypt the JSON payload using `AES_K` (produces `EncData` + `IV`).
5.  **Encrypt Key**: Encrypt `AES_K` itself using Bob's **Public Encryption Key** (produces `EncKey`).
6.  **Send**: The final packet is `{ iv, key: EncKey, data: EncData }`.

## The Decryption Flow (`decryptAndVerify`)
When Bob receives the packet:
1.  **Decrypt Key**: Decrypt `EncKey` using Bob's **Private Encryption Key** to reveal `AES_K`.
2.  **Decrypt Data**: Use `AES_K` and `IV` to decrypt `EncData`, validating the AES-GCM tag. This reveals the JSON `{ missatge: M, signatura: S }`.
3.  **Verify**: Check signature `S` against message `M` using Alice's **Public Signing Key**.
4.  **Result**: If valid, the message is displayed. If any step fails (signature mismatch, decryption error), the message is rejected.

## Key Management
-   Keys are generated in memory (`generateKeys()`) on page load.
-   Private keys are **never** exported or sent to the server.
-   Public keys are exported as JWK (JSON Web Key) and shared via the server during the `join` event.
