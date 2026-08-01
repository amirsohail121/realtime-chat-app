import forge from "node-forge";

// ─────────────────────────────────────────
// RSA Key Generation
// ─────────────────────────────────────────
export const generateKeyPair = () => {
  const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
  const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
  return { publicKey, privateKey };
};

// ─────────────────────────────────────────
// Text Encryption (Hybrid: AES + RSA)
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// File Encryption (Web Crypto API - FAST)
// ─────────────────────────────────────────
export const encryptFile = async (file) => {
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const fileBuffer = await file.arrayBuffer();

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    fileBuffer,
  );

  const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

  return {
    encryptedBytes: new Uint8Array(encryptedBuffer),
    aesKey: new Uint8Array(rawAesKey),
    iv: Array.from(iv).join(","),
  };
};

export const decryptFile = async (
  encryptedData,
  aesKeyBytes,
  ivString,
  mimeType,
) => {
  try {
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      aesKeyBytes,
      { name: "AES-GCM" },
      false,
      ["decrypt"],
    );

    const iv = new Uint8Array(ivString.split(",").map(Number));

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encryptedData,
    );

    const blob = new Blob([decryptedBuffer], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("File decryption error:", err.message);
    return null;
  }
};

// ─────────────────────────────────────────
// AES Key Encryption/Decryption (RSA)
// ─────────────────────────────────────────
export const encryptAesKey = (aesKeyBytes, publicKeyPem) => {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const aesKeyStr = String.fromCharCode.apply(null, aesKeyBytes);
  const encrypted = publicKey.encrypt(aesKeyStr, "RSA-OAEP");
  return forge.util.encode64(encrypted);
};

export const decryptAesKey = (encryptedAesKey, privateKeyPem) => {
  try {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const decrypted = privateKey.decrypt(
      forge.util.decode64(encryptedAesKey),
      "RSA-OAEP",
    );
    const bytes = new Uint8Array(decrypted.length);
    for (let i = 0; i < decrypted.length; i++) {
      bytes[i] = decrypted.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.error("AES key decryption error:", err.message);
    return null;
  }
};

// ─────────────────────────────────────────
// Private Key Storage (per user)
// ─────────────────────────────────────────
export const savePrivateKey = (privateKey, userId) => {
  localStorage.setItem(`privateKey_${userId}`, privateKey);
};

export const getPrivateKey = (userId) => {
  if (!userId) return null;
  return localStorage.getItem(`privateKey_${userId}`);
};

// ─────────────────────────────────────────
// Sidebar Preview Decryption
// ─────────────────────────────────────────
export const decryptPreview = (msg, currentUserId) => {
  // If it's a file message, show a file preview (filename or type)
  if (msg?.fileUrl) {
    if (msg.fileName) return msg.fileName;
    if (msg.fileType === "image") return "Image";
    if (msg.fileType === "video") return "Video";
    return "File";
  }

  const privateKey = getPrivateKey(currentUserId);
  if (!privateKey) return "No messages yet";

  const isSender =
    msg.sender === currentUserId || msg.sender?._id === currentUserId;

  const recipientEntry = msg.contentForUsers?.find(
    (entry) => entry.userId === currentUserId || entry.userId?._id === currentUserId,
  );
  const encrypted = isSender
    ? msg.contentForSender
    : recipientEntry?.content || msg.content;
  if (!encrypted) return "Encrypted message";

  return decryptMessage(encrypted, privateKey);
};
