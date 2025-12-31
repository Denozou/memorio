package com.memorio.backend.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CookieUtil Unit Tests")
class CookieUtilTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    private CookieUtil cookieUtil;

    private static final String TEST_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.access";
    private static final String TEST_REFRESH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.refresh";

    @BeforeEach
    void setUp() {
        cookieUtil = new CookieUtil();
        ReflectionTestUtils.setField(cookieUtil, "accessTokenMinutes", 30);
        ReflectionTestUtils.setField(cookieUtil, "refreshTokenMinutes", 10080);
        ReflectionTestUtils.setField(cookieUtil, "cookieSecure", true);
    }

    @Test
    @DisplayName("Should set access token cookie with correct attributes")
    void shouldSetAccessTokenCookie() {
        cookieUtil.setAccessTokenCookie(response, TEST_ACCESS_TOKEN);

        ArgumentCaptor<String> headerCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).addHeader(eq(HttpHeaders.SET_COOKIE), headerCaptor.capture());

        String cookieValue = headerCaptor.getValue();
        assertTrue(cookieValue.contains("accessToken=" + TEST_ACCESS_TOKEN));
        assertTrue(cookieValue.contains("HttpOnly"));
        assertTrue(cookieValue.contains("Secure"));
        assertTrue(cookieValue.contains("Path=/"));
        assertTrue(cookieValue.contains("SameSite=Lax"));
        assertTrue(cookieValue.contains("Max-Age=1800")); // 30 minutes * 60 seconds
    }

    @Test
    @DisplayName("Should set refresh token cookie with correct attributes")
    void shouldSetRefreshTokenCookie() {
        cookieUtil.setRefreshTokenCookie(response, TEST_REFRESH_TOKEN);

        ArgumentCaptor<String> headerCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).addHeader(eq(HttpHeaders.SET_COOKIE), headerCaptor.capture());

        String cookieValue = headerCaptor.getValue();
        assertTrue(cookieValue.contains("refreshToken=" + TEST_REFRESH_TOKEN));
        assertTrue(cookieValue.contains("HttpOnly"));
        assertTrue(cookieValue.contains("Secure"));
        assertTrue(cookieValue.contains("Path=/"));
        assertTrue(cookieValue.contains("SameSite=Lax"));
        assertTrue(cookieValue.contains("Max-Age=604800")); // 10080 minutes * 60 seconds
    }

    @Test
    @DisplayName("Should throw exception for null access token")
    void shouldThrowExceptionForNullAccessToken() {
        assertThrows(IllegalArgumentException.class, () -> {
            cookieUtil.setAccessTokenCookie(response, null);
        });
    }

    @Test
    @DisplayName("Should throw exception for blank access token")
    void shouldThrowExceptionForBlankAccessToken() {
        assertThrows(IllegalArgumentException.class, () -> {
            cookieUtil.setAccessTokenCookie(response, "   ");
        });
    }

    @Test
    @DisplayName("Should throw exception for null refresh token")
    void shouldThrowExceptionForNullRefreshToken() {
        assertThrows(IllegalArgumentException.class, () -> {
            cookieUtil.setRefreshTokenCookie(response, null);
        });
    }

    @Test
    @DisplayName("Should throw exception for blank refresh token")
    void shouldThrowExceptionForBlankRefreshToken() {
        assertThrows(IllegalArgumentException.class, () -> {
            cookieUtil.setRefreshTokenCookie(response, "  ");
        });
    }

    @Test
    @DisplayName("Should clear auth cookies by setting max age to 0")
    void shouldClearAuthCookies() {
        cookieUtil.clearAuthCookies(response);

        ArgumentCaptor<String> headerCaptor = ArgumentCaptor.forClass(String.class);
        verify(response, times(2)).addHeader(eq(HttpHeaders.SET_COOKIE), headerCaptor.capture());

        var cookies = headerCaptor.getAllValues();
        assertTrue(cookies.stream().anyMatch(c -> c.contains("accessToken=") && c.contains("Max-Age=0")));
        assertTrue(cookies.stream().anyMatch(c -> c.contains("refreshToken=") && c.contains("Max-Age=0")));
    }

    @Test
    @DisplayName("Should extract access token from cookies")
    void shouldExtractAccessToken() {
        Cookie[] cookies = new Cookie[] {
            new Cookie("accessToken", TEST_ACCESS_TOKEN),
            new Cookie("otherCookie", "otherValue")
        };
        when(request.getCookies()).thenReturn(cookies);

        String result = cookieUtil.getAccessTokenFromCookies(request);

        assertEquals(TEST_ACCESS_TOKEN, result);
    }

    @Test
    @DisplayName("Should extract refresh token from cookies")
    void shouldExtractRefreshToken() {
        Cookie[] cookies = new Cookie[] {
            new Cookie("refreshToken", TEST_REFRESH_TOKEN),
            new Cookie("otherCookie", "otherValue")
        };
        when(request.getCookies()).thenReturn(cookies);

        String result = cookieUtil.getRefreshTokenFromCookies(request);

        assertEquals(TEST_REFRESH_TOKEN, result);
    }

    @Test
    @DisplayName("Should return null when access token cookie not found")
    void shouldReturnNullWhenAccessTokenNotFound() {
        Cookie[] cookies = new Cookie[] {
            new Cookie("otherCookie", "otherValue")
        };
        when(request.getCookies()).thenReturn(cookies);

        String result = cookieUtil.getAccessTokenFromCookies(request);

        assertNull(result);
    }

    @Test
    @DisplayName("Should return null when refresh token cookie not found")
    void shouldReturnNullWhenRefreshTokenNotFound() {
        Cookie[] cookies = new Cookie[] {
            new Cookie("otherCookie", "otherValue")
        };
        when(request.getCookies()).thenReturn(cookies);

        String result = cookieUtil.getRefreshTokenFromCookies(request);

        assertNull(result);
    }

    @Test
    @DisplayName("Should return null when cookies array is null")
    void shouldReturnNullWhenCookiesNull() {
        when(request.getCookies()).thenReturn(null);

        assertNull(cookieUtil.getAccessTokenFromCookies(request));
        assertNull(cookieUtil.getRefreshTokenFromCookies(request));
    }

    @Test
    @DisplayName("Should return null when cookies array is empty")
    void shouldReturnNullWhenCookiesEmpty() {
        when(request.getCookies()).thenReturn(new Cookie[0]);

        assertNull(cookieUtil.getAccessTokenFromCookies(request));
        assertNull(cookieUtil.getRefreshTokenFromCookies(request));
    }

    @Test
    @DisplayName("Should not include Secure flag when cookieSecure is false")
    void shouldNotIncludeSecureFlagWhenDisabled() {
        ReflectionTestUtils.setField(cookieUtil, "cookieSecure", false);

        cookieUtil.setAccessTokenCookie(response, TEST_ACCESS_TOKEN);

        ArgumentCaptor<String> headerCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).addHeader(eq(HttpHeaders.SET_COOKIE), headerCaptor.capture());

        String cookieValue = headerCaptor.getValue();
        assertFalse(cookieValue.contains("Secure"));
    }

    @Test
    @DisplayName("Should handle multiple cookies and find correct one")
    void shouldHandleMultipleCookies() {
        Cookie[] cookies = new Cookie[] {
            new Cookie("session", "session123"),
            new Cookie("accessToken", TEST_ACCESS_TOKEN),
            new Cookie("refreshToken", TEST_REFRESH_TOKEN),
            new Cookie("preferences", "dark-mode")
        };
        when(request.getCookies()).thenReturn(cookies);

        assertEquals(TEST_ACCESS_TOKEN, cookieUtil.getAccessTokenFromCookies(request));
        assertEquals(TEST_REFRESH_TOKEN, cookieUtil.getRefreshTokenFromCookies(request));
    }
}
