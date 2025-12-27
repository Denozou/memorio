package com.memorio.backend.common.security;

import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RateLimitService Unit Tests")
class RateLimitServiceTest {

    @Mock
    private RateLimitConfig rateLimitConfig;

    @Mock
    private HttpServletRequest request;

    private RateLimitService rateLimitService;

    @BeforeEach
    void setUp() {
        rateLimitService = new RateLimitService(rateLimitConfig);
    }

    @Test
    @DisplayName("Should extract IP from X-Forwarded-For header")
    void shouldExtractIpFromXForwardedFor() {
        when(request.getHeader("X-Forwarded-For")).thenReturn("192.168.1.100");
        when(request.getRemoteAddr()).thenReturn("10.0.0.1");
        Bucket mockBucket = mock(Bucket.class);
        when(rateLimitConfig.resolveLoginBucket("192.168.1.100")).thenReturn(mockBucket);
        when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mock(io.github.bucket4j.ConsumptionProbe.class));

        rateLimitService.allowLogin(request);

        verify(rateLimitConfig).resolveLoginBucket("192.168.1.100");
    }

    @Test
    @DisplayName("Should extract first IP from multiple X-Forwarded-For values")
    void shouldExtractFirstIpFromMultipleValues() {
        when(request.getHeader("X-Forwarded-For")).thenReturn("192.168.1.100, 10.0.0.1, 172.16.0.1");
        Bucket mockBucket = mock(Bucket.class);
        when(rateLimitConfig.resolveLoginBucket("192.168.1.100")).thenReturn(mockBucket);
        when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mock(io.github.bucket4j.ConsumptionProbe.class));

        rateLimitService.allowLogin(request);

        verify(rateLimitConfig).resolveLoginBucket("192.168.1.100");
    }

    @Test
    @DisplayName("Should extract IP from X-Real-IP header when X-Forwarded-For not present")
    void shouldExtractIpFromXRealIp() {
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getHeader("X-Real-IP")).thenReturn("192.168.1.100");
        when(request.getRemoteAddr()).thenReturn("10.0.0.1");
        Bucket mockBucket = mock(Bucket.class);
        when(rateLimitConfig.resolveLoginBucket("192.168.1.100")).thenReturn(mockBucket);
        when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mock(io.github.bucket4j.ConsumptionProbe.class));

        rateLimitService.allowLogin(request);

        verify(rateLimitConfig).resolveLoginBucket("192.168.1.100");
    }

    @Test
    @DisplayName("Should fall back to remote address when no proxy headers")
    void shouldFallBackToRemoteAddress() {
        when(request.getHeader(anyString())).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("192.168.1.100");
        Bucket mockBucket = mock(Bucket.class);
        when(rateLimitConfig.resolveLoginBucket("192.168.1.100")).thenReturn(mockBucket);
        when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mock(io.github.bucket4j.ConsumptionProbe.class));

        rateLimitService.allowLogin(request);

        verify(rateLimitConfig).resolveLoginBucket("192.168.1.100");
    }

    @Test
    @DisplayName("Should skip unknown header values")
    void shouldSkipUnknownHeaderValues() {
        when(request.getHeader("X-Forwarded-For")).thenReturn("unknown");
        when(request.getHeader("X-Real-IP")).thenReturn("unknown");
        when(request.getRemoteAddr()).thenReturn("192.168.1.100");
        Bucket mockBucket = mock(Bucket.class);
        when(rateLimitConfig.resolveLoginBucket("192.168.1.100")).thenReturn(mockBucket);
        when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mock(io.github.bucket4j.ConsumptionProbe.class));

        rateLimitService.allowLogin(request);

        verify(rateLimitConfig).resolveLoginBucket("192.168.1.100");
    }

    @Test
    @DisplayName("Should validate IPv4 addresses correctly")
    void shouldValidateIpv4Addresses() {
        when(request.getHeader("X-Forwarded-For")).thenReturn("192.168.1.1");
        Bucket mockBucket = mock(Bucket.class);
        when(rateLimitConfig.resolveLoginBucket("192.168.1.1")).thenReturn(mockBucket);
        when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mock(io.github.bucket4j.ConsumptionProbe.class));

        rateLimitService.allowLogin(request);

        verify(rateLimitConfig).resolveLoginBucket("192.168.1.1");
    }

    @Test
    @DisplayName("Should handle IPv6 addresses")
    void shouldHandleIpv6Addresses() {
        when(request.getHeader("X-Forwarded-For")).thenReturn("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
        Bucket mockBucket = mock(Bucket.class);
        when(rateLimitConfig.resolveLoginBucket("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).thenReturn(mockBucket);
        when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mock(io.github.bucket4j.ConsumptionProbe.class));

        rateLimitService.allowLogin(request);

        verify(rateLimitConfig).resolveLoginBucket("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    }

    @Test
    @DisplayName("Should reject invalid IPv4 addresses")
    void shouldRejectInvalidIpv4Addresses() {
        when(request.getHeader("X-Forwarded-For")).thenReturn("256.1.1.1");
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");
        Bucket mockBucket = mock(Bucket.class);
        when(rateLimitConfig.resolveLoginBucket("192.168.1.1")).thenReturn(mockBucket);
        when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mock(io.github.bucket4j.ConsumptionProbe.class));

        rateLimitService.allowLogin(request);

        verify(rateLimitConfig).resolveLoginBucket("192.168.1.1");
    }
}
