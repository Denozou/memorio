package com.memorio.backend.auth;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.memorio.backend.user.User;
import dev.samstevens.totp.code.*;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.*;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
public class TwoFactorAuthService {

    private static final Logger log = LoggerFactory.getLogger(TwoFactorAuthService.class);

    private static final int CODE_DIGITS = 6;
    private static final int TIME_PERIOD = 30;
    private static final int DISCREPANCY = 1;

    private static final int BACKUP_CODE_COUNT = 10;
    private static final int BACKUP_CODE_LENGTH = 8;

    private final PasswordEncoder passwordEncoder;
    private final SecretGenerator secretGenerator;
    private final TimeProvider timeProvider;
    private final CodeGenerator codeGenerator;
    private final CodeVerifier codeVerifier;
    private final QrGenerator qrGenerator;
    private final SecureRandom secureRandom;

    public TwoFactorAuthService(PasswordEncoder passwordEncoder){
        this.passwordEncoder = passwordEncoder;
        this.secretGenerator = new DefaultSecretGenerator();
        this.timeProvider = new SystemTimeProvider();
        this.codeGenerator = new DefaultCodeGenerator();

        DefaultCodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
        verifier.setTimePeriod(TIME_PERIOD);
        verifier.setAllowedTimePeriodDiscrepancy(DISCREPANCY);
        this.codeVerifier = verifier;

        this.qrGenerator = new ZxingPngQrGenerator();
        this.secureRandom = new SecureRandom();
        log.info("TwoFactorAuthService initialized with TOTP parameters: " +
                "digits={}, period={}s, discrepancy=±{}", CODE_DIGITS, TIME_PERIOD, DISCREPANCY);
    }

    public String generateSecret(){
        String secret = secretGenerator.generate();
        log.debug("Generated new TOTP secret (length: {})", secret.length());
        return secret;
    }

    public String generateQrCodeDataUrl(User user, String secret) throws QrGenerationException{

        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("Secret cannot be null or empty");
        }

        QrData data = new QrData.Builder()
                .label(user.getEmail())
                .secret(secret)
                .issuer("Memorio")
                .algorithm(HashingAlgorithm.SHA1)
                .digits(CODE_DIGITS)
                .period(TIME_PERIOD)
                .build();

        byte[] imageData = qrGenerator.generate(data);
        String base64Image = Base64.getEncoder().encodeToString(imageData);
        String dataUrl = "data:image/png;base64," + base64Image;

        log.debug("Generated QR code for user: {} (size: {} bytes)", user.getEmail(), imageData.length);
        return dataUrl;
    }

    public String generateManualEntryKey(User user, String secret){
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("Secret cannot be null or empty");
        }

        String encodedEmail = URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8);

        return String.format(
                "otpauth://totp/Memorio:%s?secret=%s&issuer=Memorio&algorithm=SHA1&digits=%d&period=%d",
                encodedEmail, secret, CODE_DIGITS, TIME_PERIOD
        );
    }

    public boolean verifyCode(String secret, String code){
        if(secret == null || code == null){
            log.warn("Attempted to verify null secret or code");
            return false;
        }
        String cleanCode = code.replaceAll("[\\s-]", "");
        boolean isValid = codeVerifier.isValidCode(secret, cleanCode);
        if (isValid){
            log.debug("TOTP code verified successfully");
        }else{
            log.warn("TOTP code verification failed");
        }
        return isValid;

    }

    public List<String> generateBackupCodes(){
        List<String> codes = new ArrayList<>();

        for(int i = 0; i < BACKUP_CODE_COUNT; i++){
            int part1 = secureRandom.nextInt(10000);
            int part2 = secureRandom.nextInt(10000);

            String code = String.format("%04d-%04d", part1, part2);
            codes.add(code);
        }
        log.debug("Generated {} backup codes", BACKUP_CODE_COUNT);
        return codes;

    }
    public List<String>hashBackupCodes(List<String> plainCodes){
        return plainCodes.stream()
                .map(code->passwordEncoder.encode(code))
                .toList();
    }

    public boolean verifyBackupCode(List<String> hashedCodes, String inputCode){
        if(hashedCodes == null || hashedCodes.isEmpty() || inputCode == null){
            return false;
        }

        String cleanInput = inputCode.replaceAll("[\\s-]", "");
        for(String hashedCode : hashedCodes){
            if(passwordEncoder.matches(cleanInput, hashedCode)){
                log.info("Backup code verified successfully");
                return true;
            }
        }
        log.warn("Backup code verification failed");
        return false;

    }

    public String findUsedBackupCodeHash(List<String> hashedCodes, String inputCode){
        if(hashedCodes == null || inputCode == null){
            return null;
        }

        String cleanInput = inputCode.replaceAll("[\\s-]", "");
        for(String hashedCode : hashedCodes){
            if(passwordEncoder.matches(cleanInput, hashedCode)){
                return hashedCode;
            }
        }

        return null;
    }


}
