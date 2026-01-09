// Helper to encode ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Helper to decode Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

// Global state for MY keys
let myKeys = {
    encryption: null, // RSA-OAEP KeyPair
    signing: null     // RSASSA-PKCS1-v1_5 KeyPair
};

// --- 1. KEY GENERATION ---

document.getElementById('btnGenerateKeys').addEventListener('click', async () => {
    try {
        const statusEl = document.getElementById('keysStatus');
        statusEl.textContent = "Generant claus...";

        // 1. Generate Encryption Key Pair (RSA-OAEP)
        const encKeyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true,
            ["encrypt", "decrypt"]
        );

        // 2. Generate Signing Key Pair (RSASSA-PKCS1-v1_5)
        const sigKeyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSASSA-PKCS1-v1_5",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true,
            ["sign", "verify"]
        );

        myKeys.encryption = encKeyPair;
        myKeys.signing = sigKeyPair;

        // 3. Export Keys to JWK for display
        const visiblePublicKey = {
            encryption: await window.crypto.subtle.exportKey("jwk", encKeyPair.publicKey),
            signing: await window.crypto.subtle.exportKey("jwk", sigKeyPair.publicKey)
        };

        const visiblePrivateKey = {
            encryption: await window.crypto.subtle.exportKey("jwk", encKeyPair.privateKey),
            signing: await window.crypto.subtle.exportKey("jwk", sigKeyPair.privateKey)
        };

        // 4. Update UI
        document.getElementById('myPublicKey').value = JSON.stringify(visiblePublicKey, null, 2);
        document.getElementById('myPrivateKey').value = JSON.stringify(visiblePrivateKey, null, 2);

        statusEl.textContent = "Claus generades correctament.";
        statusEl.style.color = "var(--success)";

        // Enable sign button
        document.getElementById('btnSign').disabled = false;

    } catch (err) {
        console.error(err);
        alert("Error generant les claus: " + err.message);
    }
});

// --- 2. SIGNING ---

document.getElementById('btnSign').addEventListener('click', async () => {
    try {
        const messageText = document.getElementById('messageInput').value;
        if (!messageText) return alert("Escriu un missatge primer!");
        if (!myKeys.signing) return alert("Has de generar les teves claus primer!");

        const encoder = new TextEncoder();
        const data = encoder.encode(messageText);

        const signatureBuffer = await window.crypto.subtle.sign(
            "RSASSA-PKCS1-v1_5",
            myKeys.signing.privateKey,
            data
        );

        const signatureBase64 = arrayBufferToBase64(signatureBuffer);

        const signedObject = {
            missatge: messageText,
            signatura: signatureBase64
        };

        document.getElementById('signedMessage').value = JSON.stringify(signedObject, null, 2);

        // Enable encrypt button
        document.getElementById('btnEncrypt').disabled = false;

    } catch (err) {
        console.error(err);
        alert("Error signant el missatge: " + err.message);
    }
});

// --- 3. ENCRYPTION (HYBRID: AES-GCM + RSA-OAEP) ---

document.getElementById('btnEncrypt').addEventListener('click', async () => {
    try {
        const signedJson = document.getElementById('signedMessage').value;
        const remotePublicKeyJson = document.getElementById('remotePublicKey').value;

        if (!signedJson) return alert("Primer has de signar el missatge!");
        if (!remotePublicKeyJson) return alert("Necessites la clau pública remota per encriptar!");

        // 1. Import Remote Encryption Key (RSA)
        let remoteKeys;
        try {
            remoteKeys = JSON.parse(remotePublicKeyJson);
        } catch (e) {
            return alert("Format de clau pública remota invàlid (ha de ser JSON).");
        }

        if (!remoteKeys.encryption) return alert("No s'ha trobat la clau d'encriptació al JSON remot.");

        const remoteRsapubKey = await window.crypto.subtle.importKey(
            "jwk",
            remoteKeys.encryption,
            {
                name: "RSA-OAEP",
                hash: "SHA-256"
            },
            true,
            ["encrypt"]
        );

        // 2. Generate a One-Time AES Key (Session Key)
        const aesKey = await window.crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256
            },
            true,
            ["encrypt", "decrypt"]
        );

        // 3. Encrypt the Message with AES (AES-GCM)
        const encoder = new TextEncoder();
        const data = encoder.encode(signedJson);
        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

        const encryptedDataBuffer = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            aesKey,
            data
        );

        // 4. Encrypt the AES Key with RSA (Remote Public Key)
        const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

        const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
            {
                name: "RSA-OAEP"
            },
            remoteRsapubKey,
            exportedAesKey
        );

        // 5. Package Everything
        const finalPackage = {
            iv: arrayBufferToBase64(iv),
            key: arrayBufferToBase64(encryptedKeyBuffer),
            data: arrayBufferToBase64(encryptedDataBuffer)
        };

        document.getElementById('encryptedOutput').value = JSON.stringify(finalPackage, null, 2);

        // Enable decrypt button locally just in case
        document.getElementById('btnDecrypt').disabled = false;

    } catch (err) {
        console.error(err);
        alert("Error encriptant: " + err.message);
    }
});

// --- 4. DECRYPTION & VALIDATION ---

document.getElementById('btnDecrypt').addEventListener('click', async () => {
    const resultArea = document.getElementById('decryptionResult');
    resultArea.innerHTML = '<div class="placeholder-result">Processant...</div>';

    try {
        // 1. Parse Inputs
        const encryptedPackageJson = document.getElementById('receivedEncrypted').value;
        const remotePublicKeyJson = document.getElementById('remotePublicKey').value;

        if (!encryptedPackageJson) return alert("Enganxa el missatge encriptat!");
        if (!myKeys.encryption) return alert("Necessites les teves claus per desencriptar!");
        if (!remotePublicKeyJson) return alert("Necessites la clau pública remota per validar la signatura!");

        let encryptedPackage;
        try {
            encryptedPackage = JSON.parse(encryptedPackageJson);
        } catch (e) {
            throw new Error("El text xifrat no és un format JSON vàlid (Hybrid Format).");
        }

        const { iv, key, data } = encryptedPackage;
        if (!iv || !key || !data) throw new Error("Format del paquet encriptat incomplet.");

        // 2. Decrypt the AES Key using MY RSA Private Key
        const encryptedKeyBuffer = base64ToArrayBuffer(key);

        let exportedAesKeyBuffer;
        try {
            exportedAesKeyBuffer = await window.crypto.subtle.decrypt(
                {
                    name: "RSA-OAEP"
                },
                myKeys.encryption.privateKey,
                encryptedKeyBuffer
            );
        } catch (e) {
            throw new Error("Error desencriptant la clau AES. Potser el missatge no era per a tu?");
        }

        // 3. Import the AES Key
        const aesKey = await window.crypto.subtle.importKey(
            "raw",
            exportedAesKeyBuffer,
            {
                name: "AES-GCM",
                length: 256
            },
            true,
            ["decrypt"]
        );

        // 4. Decrypt the Data using AES Key
        const encryptedDataBuffer = base64ToArrayBuffer(data);
        const ivBuffer = base64ToArrayBuffer(iv);

        let decryptedBuffer;
        try {
            decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: ivBuffer
                },
                aesKey,
                encryptedDataBuffer
            );
        } catch (e) {
            throw new Error("Error desencriptant les dades (AES-GCM auth tag mismatch).");
        }

        const decoder = new TextDecoder();
        const decryptedJsonString = decoder.decode(decryptedBuffer);

        // --- End Hybrid Decryption ---

        // Proceed with Signature Verification (Parsing inner JSON)
        let decryptedObject;
        try {
            decryptedObject = JSON.parse(decryptedJsonString);
        } catch (e) {
            throw new Error("El missatge desencriptat no és un JSON vàlid.");
        }

        const { missatge, signatura } = decryptedObject;
        if (!missatge || !signatura) throw new Error("Format del missatge incorrecte (falta missatge o signatura).");

        // 5. Import Remote Signing Key
        let remoteKeys;
        try {
            remoteKeys = JSON.parse(remotePublicKeyJson);
        } catch (e) {
            throw new Error("Clau pública remota mal formada.");
        }

        if (!remoteKeys.signing) throw new Error("No s'ha trobat la clau de signatura al JSON remot.");

        const remoteSigKey = await window.crypto.subtle.importKey(
            "jwk",
            remoteKeys.signing,
            {
                name: "RSASSA-PKCS1-v1_5",
                hash: "SHA-256"
            },
            true,
            ["verify"]
        );

        // 6. Verify Signature
        const signatureBuffer = base64ToArrayBuffer(signatura);
        const encoder = new TextEncoder();
        const messageData = encoder.encode(missatge);

        const isValid = await window.crypto.subtle.verify(
            "RSASSA-PKCS1-v1_5",
            remoteSigKey,
            signatureBuffer,
            messageData
        );

        // 7. Display Results
        if (isValid) {
            resultArea.innerHTML = `
                <div class="validation-success">
                    <span class="validation-title">ÈXIT: Missatge Autèntic</span>
                    <p><strong>Missatge:</strong> ${missatge}</p>
                    <p style="margin-top:0.5rem; font-size:0.85rem; opacity:0.8;">La signatura ha estat validada correctament amb la clau pública remota.</p>
                </div>
            `;
        } else {
            resultArea.innerHTML = `
                <div class="validation-error">
                    <span class="validation-title">ERROR: Signatura Invàlida</span>
                    <p><strong>Missatge Desencriptat:</strong> ${missatge}</p>
                    <p>ALERTA: Aquest missatge ha pogut ser modificat o no prové de l'autor de la clau pública proporcionada.</p>
                </div>
            `;
        }

    } catch (err) {
        console.error(err);
        resultArea.innerHTML = `
            <div class="validation-error">
                <span class="validation-title">Error Tècnic</span>
                <p>${err.message}</p>
            </div>
        `;
    }
});

// Helper for "Receive" input to auto-enable button
document.getElementById('receivedEncrypted').addEventListener('input', (e) => {
    document.getElementById('btnDecrypt').disabled = !e.target.value;
});
