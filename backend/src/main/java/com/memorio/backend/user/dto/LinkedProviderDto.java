package com.memorio.backend.user.dto;

import java.time.OffsetDateTime;

public class LinkedProviderDto {
    private String provider;
    private String providerUserId;
    private OffsetDateTime connectedAt;

    public LinkedProviderDto(String provider, String providerUserId,
                             OffsetDateTime connectedAt){
        this.provider = provider;
        this.providerUserId = providerUserId;
        this.connectedAt = connectedAt;
    }

    public String getProvider(){return provider;}
    public String getProviderUserId(){return providerUserId;}
    public OffsetDateTime getConnectedAt(){return connectedAt;}
}
