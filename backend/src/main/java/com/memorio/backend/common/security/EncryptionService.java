package com.memorio.backend.common.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Service for encrypting sensitive data at rest using AES-256-GCM.
 * Used for encrypting 2FA secrets and other sensitive user data.
 */
@Service
public class EncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int GCM_IV_LENGTH = 12;
    
    private final SecretKey secretKey;
    private final SecureRandom secureRandom;

    public EncryptionService(@Value("${security.encryption.key}") String encryptionKeyBase64) {
        // Decode the base64-encoded key
        byte[] decodedKey = Base64.getDecoder().decode(encryptionKeyBase64);
        
        if (decodedKey.length != 32) {
            throw new IllegalArgumentException(
                "Encryption key must be exactly 32 bytes (256 bits). Current length: " + decodedKey.length + " bytes"
            );
        }
        
        this.secretKey = new SecretKeySpec(decodedKey, "AES");
        this.secureRandom = new SecureRandom();
    }

    /**
     * Encrypts a plaintext string using AES-256-GCM.
     * Returns Base64-encoded string containing: IV + encrypted data + authentication tag.
     * 
     * @param plaintext The data to encrypt
     * @return Base64-encoded encrypted data with IV prepended
     * @throws RuntimeException if encryption fails
     */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }

        try {
            // Generate random IV for this encryption operation
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            // Initialize cipher with GCM mode
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);

            // Encrypt the data
            byte[] encryptedData = cipher.doFinal(plaintext.getBytes());

            // Combine IV + encrypted data
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + encryptedData.length);
            byteBuffer.put(iv);
            byteBuffer.put(encryptedData);

            // Return as Base64 string for database storage
            return Base64.getEncoder().encodeToString(byteBuffer.array());
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt data", e);
        }
    }

    /**
     * Decrypts a Base64-encoded encrypted string.
     * 
     * @param encryptedBase64 The Base64-encoded encrypted data (IV + ciphertext + tag)
     * @return Decrypted plaintext
     * @throws RuntimeException if decryption fails
     */
    public String decrypt(String encryptedBase64) {
        if (encryptedBase64 == null || encryptedBase64.isEmpty()) {
            return encryptedBase64;
        }

        try {
            // Decode from Base64
            byte[] encryptedBytes = Base64.getDecoder().decode(encryptedBase64);

            // Extract IV and encrypted data
            ByteBuffer byteBuffer = ByteBuffer.wrap(encryptedBytes);
            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);
            
            byte[] ciphertext = new byte[byteBuffer.remaining()];
            byteBuffer.get(ciphertext);

            // Initialize cipher for decryption
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);

            // Decrypt
            byte[] decryptedData = cipher.doFinal(ciphertext);
            return new String(decryptedData);
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to decrypt data", e);
        }
    }
}
