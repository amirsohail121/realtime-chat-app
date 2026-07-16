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
  // 1. Generate random AES key
  const aesKey = forge.random.getBytesSync(32); // 256-bit AES key
  const iv = forge.random.getBytesSync(16); // initialization vector

  // 2. Encrypt message with AES
  const cipher = forge.cipher.createCipher("AES-CBC", aesKey);
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(message)));
  cipher.finish();
  const encryptedMessage = cipher.output.getBytes();

  // 3. Encrypt AES key with RSA public key
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const encryptedAesKey = publicKey.encrypt(aesKey, "RSA-OAEP");

  // 4. Combine everything → base64
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
    // 1. Parse payload
    const payload = JSON.parse(forge.util.decode64(encryptedContent));
    const { encryptedMessage, encryptedAesKey, iv } = payload;

    // 2. Decrypt AES key with RSA private key
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const aesKey = privateKey.decrypt(
      forge.util.decode64(encryptedAesKey),
      "RSA-OAEP",
    );

    // 3. Decrypt message with AES key
    const decipher = forge.cipher.createDecipher("AES-CBC", aesKey);
    decipher.start({ iv: forge.util.decode64(iv) });
    decipher.update(
      forge.util.createBuffer(forge.util.decode64(encryptedMessage)),
    );
    decipher.finish();

    return decipher.output.toString("utf8");
  } catch (err) {
    // console.error("Decryption error:", err.message);
    return "[Encrypted message]";
  }
};

// Decrypt latest message preview for sidebar
export const decryptPreview = (msg, currentUserId) => {
  const privateKey = getPrivateKey();
  if (!privateKey || !msg?.content) return "No messages yet";

  const isSender = msg.sender === currentUserId || 
                   msg.sender?._id === currentUserId;

  const encrypted = isSender ? msg.contentForSender : msg.content;
  if (!encrypted) return "Encrypted message";

  return decryptMessage(encrypted, privateKey);
};

// Save private key to localStorage
export const savePrivateKey = (privateKey) => {
  localStorage.setItem("privateKey", privateKey);
};

// Get private key from localStorage
export const getPrivateKey = () => {
  return localStorage.getItem("privateKey");
};
