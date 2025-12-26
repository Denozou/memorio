package com.memorio.backend.common.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * JPA AttributeConverter that automatically encrypts and decrypts string fields.
 * Used for sensitive data like 2FA secrets.
 * 
 * Usage: Add @Convert(converter = EncryptedStringConverter.class) to entity fields.
 */
@Converter
@Component
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private static EncryptionService encryptionService;

    @Autowired
    public void setEncryptionService(EncryptionService service) {
        EncryptedStringConverter.encryptionService = service;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        return encryptionService.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return null;
        }
        
        // Check if data appears to be encrypted (Base64 with proper length)
        // Encrypted data should be at least 28 bytes (12 IV + 16 tag minimum)
        // When Base64 encoded, that's at least ~38 characters
        if (dbData.length() < 32) {
            // Too short to be encrypted, assume plaintext (legacy data)
            return dbData;
        }
        
        try {
            // Attempt to decrypt
            return encryptionService.decrypt(dbData);
        } catch (Exception e) {
            // If decryption fails, assume it's plaintext legacy data
            // Log warning but return the plaintext value
            // On next save, it will be encrypted
            return dbData;
        }
    }
}
