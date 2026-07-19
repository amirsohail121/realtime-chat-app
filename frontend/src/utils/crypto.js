import forge from "node-forge";

// Generate RSA key pair
export const generateKeyPair = () => {
  const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
  const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
  return { publicKey, privateKey };
};

// Hybrid encrypt — AES for message, RSA for AES key
export const encryptMessage = (message, publicKeyPem) => {
  const aesKey = forge.random.getBytesSync(32);
  const iv = forge.random.getBytesSync(16);

  const cipher = forge.cipher.createCipher("AES-CBC", aesKey);
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(message)));
  cipher.finish();
  const encryptedMessage = cipher.output.getBytes();

  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const encryptedAesKey = publicKey.encrypt(aesKey, "RSA-OAEP");

  const payload = {
    encryptedMessage: forge.util.encode64(encryptedMessage),
    encryptedAesKey: forge.util.encode64(encryptedAesKey),
    iv: forge.util.encode64(iv),
  };

  return forge.util.encode64(JSON.stringify(payload));
};

// Hybrid decrypt
export const decryptMessage = (encryptedContent, privateKeyPem) => {
  try {
    const payload = JSON.parse(forge.util.decode64(encryptedContent));
    const { encryptedMessage, encryptedAesKey, iv } = payload;

    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const aesKey = privateKey.decrypt(
      forge.util.decode64(encryptedAesKey),
      "RSA-OAEP",
    );

    const decipher = forge.cipher.createDecipher("AES-CBC", aesKey);
    decipher.start({ iv: forge.util.decode64(iv) });
    decipher.update(
      forge.util.createBuffer(forge.util.decode64(encryptedMessage)),
    );
    decipher.finish();

    return decipher.output.toString("utf8");
  } catch (err) {
    console.error("Decryption error:", err.message);
    return "[Encrypted message]";
  }
};

// Save private key tied to specific user
export const savePrivateKey = (privateKey, userId) => {
  localStorage.setItem(`privateKey_${userId}`, privateKey);
};

// Get private key for specific user
export const getPrivateKey = (userId) => {
  if (!userId) return null;
  return localStorage.getItem(`privateKey_${userId}`);
};

// Decrypt preview for sidebar
export const decryptPreview = (msg, currentUserId) => {
  const privateKey = getPrivateKey(currentUserId);
  if (!privateKey || !msg?.content) return "No messages yet";

  const isSender =
    msg.sender === currentUserId || msg.sender?._id === currentUserId;

  const encrypted = isSender ? msg.contentForSender : msg.content;
  if (!encrypted) return "Encrypted message";

  return decryptMessage(encrypted, privateKey);
};

// Encrypt file (returns encrypted bytes + AES key info)
export const encryptFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileBytes = e.target.result;
        const aesKey = forge.random.getBytesSync(32);
        const iv = forge.random.getBytesSync(16);

        // ✅ Better approach — convert ArrayBuffer chunk by chunk
        const uint8Array = new Uint8Array(fileBytes);
        let binaryString = "";
        const chunkSize = 8192; // process 8KB at a time
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, i + chunkSize);
          binaryString += String.fromCharCode.apply(null, chunk);
        }

        const forgeBuffer = forge.util.createBuffer(binaryString);

        // Encrypt with AES
        const cipher = forge.cipher.createCipher("AES-CBC", aesKey);
        cipher.start({ iv });
        cipher.update(forgeBuffer);
        cipher.finish();

        const encryptedBytes = cipher.output.getBytes();

        resolve({
          encryptedBytes,
          aesKey,
          iv: forge.util.encode64(iv),
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// Decrypt file (returns blob URL for display/download)
export const decryptFile = (encryptedBase64, aesKey, ivBase64, mimeType) => {
  try {
    const encryptedBytes = forge.util.decode64(encryptedBase64);
    const iv = forge.util.decode64(ivBase64);

    const decipher = forge.cipher.createDecipher("AES-CBC", aesKey);
    decipher.start({ iv });
    decipher.update(forge.util.createBuffer(encryptedBytes));
    decipher.finish();

    const decryptedBytes = decipher.output.getBytes();

    // Convert to Uint8Array → Blob → URL
    const byteArray = new Uint8Array(decryptedBytes.length);
    for (let i = 0; i < decryptedBytes.length; i++) {
      byteArray[i] = decryptedBytes.charCodeAt(i);
    }

    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("File decryption error:", err.message);
    return null;
  }
};

// Encrypt AES key with RSA public key
export const encryptAesKey = (aesKey, publicKeyPem) => {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const encrypted = publicKey.encrypt(aesKey, "RSA-OAEP");
  return forge.util.encode64(encrypted);
};

// Decrypt AES key with RSA private key
export const decryptAesKey = (encryptedAesKey, privateKeyPem) => {
  try {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    return privateKey.decrypt(
      forge.util.decode64(encryptedAesKey),
      "RSA-OAEP"
    );
  } catch (err) {
    console.error("AES key decryption error:", err.message);
    return null;
  }
};
