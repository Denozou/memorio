package com.memorio.backend.auth.dto;

import java.util.ArrayList;
import java.util.List;

public class TwoFactorSetupResponse {

    private String secret;
    private String qrCodeDataUrl;
    private String manualEntryKey;
    private List<String> backupCodes;

    public TwoFactorSetupResponse(){}
    public TwoFactorSetupResponse(String secret, String qrCodeDataUrl,
                                  String manualEntryKey, List<String> backupCodes){
        this.secret = secret;
        this.qrCodeDataUrl = qrCodeDataUrl;
        this.manualEntryKey = manualEntryKey;
        this.backupCodes = backupCodes != null ? new ArrayList<>(backupCodes) : null;
    }
    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }

    public String getQrCodeDataUrl() { return qrCodeDataUrl; }
    public void setQrCodeDataUrl(String qrCodeDataUrl) { this.qrCodeDataUrl = qrCodeDataUrl; }

    public String getManualEntryKey() { return manualEntryKey; }
    public void setManualEntryKey(String manualEntryKey) { this.manualEntryKey = manualEntryKey; }

    public List<String> getBackupCodes() {
        return backupCodes != null ? new ArrayList<>(backupCodes) : null;
    }
    public void setBackupCodes(List<String> backupCodes) {
        this.backupCodes = backupCodes != null ? new ArrayList<>(backupCodes) : null;
    }
}