// Encapsulates all cryptographic operations

class CryptoService {
    constructor() {
        this.keyPair = {
            encryption: null,
            signing: null
        };
        this.publicKeys = {
            encryption: null, // JWK
            signing: null     // JWK
        };
    }

    // Helper: ArrayBuffer to Base64
    buffToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    // Helper: Base64 to ArrayBuffer
    base64ToBuff(base64) {
        if (!base64) return new ArrayBuffer(0);
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async generateKeys() {
        // 1. Encryption (RSA-OAEP)
        this.keyPair.encryption = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true,
            ["encrypt", "decrypt"]
        );

        // 2. Signing (RSASSA-PKCS1-v1_5)
        this.keyPair.signing = await window.crypto.subtle.generateKey(
            {
                name: "RSASSA-PKCS1-v1_5",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true,
            ["sign", "verify"]
        );

        // Export Public Keys
        this.publicKeys.encryption = await window.crypto.subtle.exportKey("jwk", this.keyPair.encryption.publicKey);
        this.publicKeys.signing = await window.crypto.subtle.exportKey("jwk", this.keyPair.signing.publicKey);

        return this.publicKeys;
    }

    /**
     * Signs a message and then encrypts it for the target.
     * @param {string} message - Plaintext message
     * @param {object} targetPublicKey - { encryption: JWK, signing: JWK }
     * @returns {Promise<object>} - { iv, key, data } (Base64 strings)
     */
    async signAndEncrypt(message, targetPublicKey) {
        if (!this.keyPair.signing) throw new Error("Keys not generated");

        // 1. Sign
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(message);

        const signatureBuff = await window.crypto.subtle.sign(
            "RSASSA-PKCS1-v1_5",
            this.keyPair.signing.privateKey,
            dataBytes
        );

        const signedPayload = JSON.stringify({
            missatge: message,
            signatura: this.buffToBase64(signatureBuff)
        });

        // 2. Encrypt (Hybrid)
        // Import Target Enc Key
        const targetEncKey = await window.crypto.subtle.importKey(
            "jwk",
            targetPublicKey.encryption,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["encrypt"]
        );

        // Generate Session Key (AES-GCM)
        const aesKey = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        // Encrypt Data with AES
        const payloadBytes = encoder.encode(signedPayload);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encryptedDataBuff = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            payloadBytes
        );

        // Encrypt AES Key with RSA
        const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
        const encryptedKeyBuff = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            targetEncKey,
            rawAesKey
        );

        return {
            iv: this.buffToBase64(iv),
            key: this.buffToBase64(encryptedKeyBuff),
            data: this.buffToBase64(encryptedDataBuff)
        };
    }

    /**
     * Decrypts a message and verifies the signature.
     * @param {object} encryptedPackage - { iv, key, data }
     * @param {object} senderPublicKey - { encryption: JWK, signing: JWK }
     * @returns {Promise<string>} - The decrypted plaintext message if valid.
     * @throws {Error} if decryption fails or signature is invalid.
     */
    async decryptAndVerify(encryptedPackage, senderPublicKey) {
        if (!this.keyPair.encryption) throw new Error("Keys not generated");

        const { iv, key, data } = encryptedPackage;

        // 1. Decrypt AES Key with My RSA Private Key
        const encryptedKeyBuff = this.base64ToBuff(key);
        const aesKeyBuff = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            this.keyPair.encryption.privateKey,
            encryptedKeyBuff
        );

        // 2. Decrypt Data with AES Key
        const aesKey = await window.crypto.subtle.importKey(
            "raw",
            aesKeyBuff,
            { name: "AES-GCM", length: 256 },
            true,
            ["decrypt"]
        );

        const encryptedDataBuff = this.base64ToBuff(data);
        const ivBuff = this.base64ToBuff(iv);

        const decryptedPayloadBuff = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: ivBuff },
            aesKey,
            encryptedDataBuff
        );

        const decoder = new TextDecoder();
        const decryptedJson = decoder.decode(decryptedPayloadBuff);
        const { missatge, signatura } = JSON.parse(decryptedJson);

        // 3. Verify Signature
        const senderSigKey = await window.crypto.subtle.importKey(
            "jwk",
            senderPublicKey.signing,
            { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
            true,
            ["verify"]
        );

        const signatureBuff = this.base64ToBuff(signatura);
        const encoder = new TextEncoder();
        const messageBytes = encoder.encode(missatge);

        const isValid = await window.crypto.subtle.verify(
            "RSASSA-PKCS1-v1_5",
            senderSigKey,
            signatureBuff,
            messageBytes
        );

        if (!isValid) throw new Error("SIGNATURA INVÀLIDA: El missatge pot haver estat manipulat.");

        return missatge;
    }
}

export const cryptoService = new CryptoService();
