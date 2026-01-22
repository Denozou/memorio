package com.memorio.backend.common.security;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RateLimitService Unit Tests")
class RateLimitServiceTest {

    @Mock
    private RateLimitConfig rateLimitConfig;

    @Mock
    private HttpServletRequest request;

    @Mock
    private Bucket mockBucket;

    @Mock
    private ConsumptionProbe mockProbe;

    private ClientIpResolver clientIpResolver;
    private RateLimitService rateLimitService;

    @BeforeEach
    void setUp() {
        // Use default trusted proxies: localhost and private network ranges
        clientIpResolver = new ClientIpResolver("127.0.0.1,::1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16");
        rateLimitService = new RateLimitService(rateLimitConfig, clientIpResolver);
    }

    @Nested
    @DisplayName("Secure IP Resolution - Trusted Proxy Validation")
    class SecureIpResolutionTests {

        @Test
        @DisplayName("Should use remoteAddr directly when request NOT from trusted proxy (prevents IP spoofing)")
        void shouldUseRemoteAddrWhenNotFromTrustedProxy() {
            // External IP (not a trusted proxy) - headers are not consulted
            when(request.getRemoteAddr()).thenReturn("203.0.113.50");
            // Note: X-Forwarded-For NOT stubbed because untrusted sources' headers are ignored
            when(rateLimitConfig.resolveLoginBucket("203.0.113.50")).thenReturn(mockBucket);
            when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mockProbe);

            rateLimitService.allowLogin(request);

            // Should use the actual remote addr, spoofed headers are ignored
            verify(rateLimitConfig).resolveLoginBucket("203.0.113.50");
        }

        @Test
        @DisplayName("Should extract client IP from X-Forwarded-For when request FROM trusted proxy")
        void shouldExtractIpFromXForwardedForWhenFromTrustedProxy() {
            // Request coming from trusted proxy (Docker network)
            when(request.getRemoteAddr()).thenReturn("172.18.0.2");
            when(request.getHeader("X-Forwarded-For")).thenReturn("203.0.113.100");
            when(rateLimitConfig.resolveLoginBucket("203.0.113.100")).thenReturn(mockBucket);
            when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mockProbe);

            rateLimitService.allowLogin(request);

            // Should trust the header since it comes from trusted proxy
            verify(rateLimitConfig).resolveLoginBucket("203.0.113.100");
        }

        @Test
        @DisplayName("Should extract rightmost untrusted IP from X-Forwarded-For chain")
        void shouldExtractRightmostUntrustedIpFromChain() {
            // Request with multiple proxies in chain
            when(request.getRemoteAddr()).thenReturn("127.0.0.1");
            // Chain: client -> external proxy -> internal proxy -> nginx (localhost)
            when(request.getHeader("X-Forwarded-For")).thenReturn("203.0.113.50, 10.0.0.5, 172.16.0.1");
            when(rateLimitConfig.resolveLoginBucket("203.0.113.50")).thenReturn(mockBucket);
            when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mockProbe);

            rateLimitService.allowLogin(request);

            // Should use 203.0.113.50 (first untrusted IP from the right)
            verify(rateLimitConfig).resolveLoginBucket("203.0.113.50");
        }

        @Test
        @DisplayName("Should fall back to remoteAddr when no headers present (trusted proxy)")
        void shouldFallBackToRemoteAddrWhenNoHeaders() {
            when(request.getRemoteAddr()).thenReturn("192.168.1.100");
            when(request.getHeader("X-Forwarded-For")).thenReturn(null);
            when(request.getHeader("X-Real-IP")).thenReturn(null);
            when(rateLimitConfig.resolveLoginBucket("192.168.1.100")).thenReturn(mockBucket);
            when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mockProbe);

            rateLimitService.allowLogin(request);

            verify(rateLimitConfig).resolveLoginBucket("192.168.1.100");
        }

        @Test
        @DisplayName("Should use X-Real-IP when X-Forwarded-For not present (from trusted proxy)")
        void shouldUseXRealIpWhenXForwardedForNotPresent() {
            when(request.getRemoteAddr()).thenReturn("10.0.0.1");
            when(request.getHeader("X-Forwarded-For")).thenReturn(null);
            when(request.getHeader("X-Real-IP")).thenReturn("203.0.113.100");
            when(rateLimitConfig.resolveLoginBucket("203.0.113.100")).thenReturn(mockBucket);
            when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mockProbe);

            rateLimitService.allowLogin(request);

            verify(rateLimitConfig).resolveLoginBucket("203.0.113.100");
        }
    }

    @Nested
    @DisplayName("Rate Limiting Operations")
    class RateLimitingTests {

        @Test
        @DisplayName("Should allow login when bucket has tokens")
        void shouldAllowLoginWhenBucketHasTokens() {
            when(request.getRemoteAddr()).thenReturn("192.168.1.100");
            when(rateLimitConfig.resolveLoginBucket("192.168.1.100")).thenReturn(mockBucket);
            when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mockProbe);
            when(mockProbe.isConsumed()).thenReturn(true);

            boolean result = rateLimitService.allowLogin(request);

            assertTrue(result);
        }

        @Test
        @DisplayName("Should deny login when bucket exhausted")
        void shouldDenyLoginWhenBucketExhausted() {
            when(request.getRemoteAddr()).thenReturn("192.168.1.100");
            when(rateLimitConfig.resolveLoginBucket("192.168.1.100")).thenReturn(mockBucket);
            when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mockProbe);
            when(mockProbe.isConsumed()).thenReturn(false);

            boolean result = rateLimitService.allowLogin(request);

            assertFalse(result);
        }

        @Test
        @DisplayName("Should allow register when bucket has tokens")
        void shouldAllowRegisterWhenBucketHasTokens() {
            when(request.getRemoteAddr()).thenReturn("192.168.1.100");
            when(rateLimitConfig.resolveRegisterBucket("192.168.1.100")).thenReturn(mockBucket);
            when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mockProbe);
            when(mockProbe.isConsumed()).thenReturn(true);

            boolean result = rateLimitService.allowRegister(request);

            assertTrue(result);
        }

        @Test
        @DisplayName("Should allow refresh when bucket has tokens")
        void shouldAllowRefreshWhenBucketHasTokens() {
            when(request.getRemoteAddr()).thenReturn("192.168.1.100");
            when(rateLimitConfig.resolveRefreshBucket("192.168.1.100")).thenReturn(mockBucket);
            when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mockProbe);
            when(mockProbe.isConsumed()).thenReturn(true);

            boolean result = rateLimitService.allowRefresh(request);

            assertTrue(result);
        }
    }

    @Nested
    @DisplayName("IPv6 Address Handling")
    class Ipv6Tests {

        @Test
        @DisplayName("Should handle IPv6 loopback address")
        void shouldHandleIpv6Loopback() {
            when(request.getRemoteAddr()).thenReturn("::1");
            when(request.getHeader("X-Forwarded-For")).thenReturn("203.0.113.100");
            when(rateLimitConfig.resolveLoginBucket("203.0.113.100")).thenReturn(mockBucket);
            when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mockProbe);

            rateLimitService.allowLogin(request);

            // ::1 is trusted (localhost), so should use forwarded header
            verify(rateLimitConfig).resolveLoginBucket("203.0.113.100");
        }

        @Test
        @DisplayName("Should handle full IPv6 addresses")
        void shouldHandleFullIpv6Addresses() {
            when(request.getRemoteAddr()).thenReturn("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
            when(rateLimitConfig.resolveLoginBucket("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).thenReturn(mockBucket);
            when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mockProbe);

            rateLimitService.allowLogin(request);

            // Public IPv6 is not trusted, use it directly
            verify(rateLimitConfig).resolveLoginBucket("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
        }
    }

    @Nested
    @DisplayName("Edge Cases")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should skip 'unknown' header values")
        void shouldSkipUnknownHeaderValues() {
            when(request.getRemoteAddr()).thenReturn("10.0.0.1");
            when(request.getHeader("X-Forwarded-For")).thenReturn("unknown");
            when(request.getHeader("X-Real-IP")).thenReturn("unknown");
            when(rateLimitConfig.resolveLoginBucket("10.0.0.1")).thenReturn(mockBucket);
            when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mockProbe);

            rateLimitService.allowLogin(request);

            verify(rateLimitConfig).resolveLoginBucket("10.0.0.1");
        }

        @Test
        @DisplayName("Should handle empty header values")
        void shouldHandleEmptyHeaderValues() {
            when(request.getRemoteAddr()).thenReturn("10.0.0.1");
            when(request.getHeader("X-Forwarded-For")).thenReturn("");
            when(request.getHeader("X-Real-IP")).thenReturn("");
            when(rateLimitConfig.resolveLoginBucket("10.0.0.1")).thenReturn(mockBucket);
            when(mockBucket.tryConsumeAndReturnRemaining(1)).thenReturn(mockProbe);

            rateLimitService.allowLogin(request);

            verify(rateLimitConfig).resolveLoginBucket("10.0.0.1");
        }
    }
}
