package com.memorio.backend.common.security;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SecurityHeadersConfig {
    
    @Value("${frontend.url}")
    private String frontendUrl;
    
    @Value("${security.csp.enabled:true}")
    private boolean cspEnabled;
    
    @Bean
    public Filter securityHeadersFilter(){
        return (ServletRequest request, ServletResponse response, FilterChain chain)->{
            HttpServletResponse httpResponse = (HttpServletResponse) response;

            // Prevent clickjacking attacks
            httpResponse.setHeader("X-Frame-Options", "DENY");
            
            // Prevent MIME type sniffing
            httpResponse.setHeader("X-Content-Type-Options", "nosniff");
            
            // Enable XSS filter (legacy browsers)
            httpResponse.setHeader("X-XSS-Protection", "1; mode=block");
            
            // Strict referrer policy
            httpResponse.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
            
            // Restrict browser features
            httpResponse.setHeader("Permissions-Policy",
                    "geolocation=(), microphone=(), camera=(), payment=()");
            
            // Content Security Policy - only if enabled
            if (cspEnabled) {
                httpResponse.setHeader("Content-Security-Policy",
                    "default-src 'self'; " +
                    "script-src 'self'; " +
                    "style-src 'self'; " +
                    "img-src 'self' data: https:; " +
                    "font-src 'self' data:; " +
                    "connect-src 'self' " + frontendUrl + "; " +
                    "frame-ancestors 'none'; " +
                    "base-uri 'self'; " +
                    "form-action 'self'");
            }

            chain.doFilter(request,response);
        };
    }
}
