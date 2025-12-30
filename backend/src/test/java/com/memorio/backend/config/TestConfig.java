package com.memorio.backend.config;

import com.memorio.backend.auth.LoginAttemptService;
import com.memorio.backend.common.security.RateLimitService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@TestConfiguration
public class TestConfig {

    @Bean
    @Primary
    public RedisTemplate<String, Object> redisTemplate() {
        RedisTemplate<String, Object> mockTemplate = mock(RedisTemplate.class);
        ValueOperations<String, Object> mockValueOps = mock(ValueOperations.class);

        when(mockTemplate.opsForValue()).thenReturn(mockValueOps);
        when(mockValueOps.get(anyString())).thenReturn(null);
        doNothing().when(mockValueOps).set(anyString(), any(), anyLong(), any());
        when(mockTemplate.delete(anyString())).thenReturn(true);

        return mockTemplate;
    }

    @Bean
    @Primary
    public RateLimitService rateLimitService() {
        RateLimitService mockService = mock(RateLimitService.class);
        when(mockService.allowLogin(any())).thenReturn(true);
        when(mockService.allowRegister(any())).thenReturn(true);
        when(mockService.allowRefresh(any())).thenReturn(true);
        return mockService;
    }

    @Bean
    @Primary
    public LoginAttemptService loginAttemptService() {
        LoginAttemptService mockService = mock(LoginAttemptService.class);
        when(mockService.isBlocked(anyString())).thenReturn(false);
        doNothing().when(mockService).loginSucceeded(anyString());
        doNothing().when(mockService).loginFailed(anyString());
        return mockService;
    }
}
