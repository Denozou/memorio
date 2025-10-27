package com.memorio.backend.common.security;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.io.IOException;

@Configuration
public class SecurityHeadersConfig {
    @Bean
    public Filter securityHeadersFilter(){
        return (ServletRequest request, ServletResponse response, FilterChain chain)->{
            HttpServletResponse httpResponse = (HttpServletResponse) response;

            httpResponse.setHeader("X-Frame-Options", "DENY");
            httpResponse.setHeader("X-Content_Type-Options", "nosniff");
            httpResponse.setHeader("X-XSS-Protection", "1; mode=block");
            httpResponse.setHeader("Content-Security_Policy",
          "default-src 'self' http://localhost:5173; " +
                "script-src 'self' 'unsafe-inline' http://localhost:5173; " +
                "style-src 'self' 'unsafe-inline' http://localhost:5173; " +
                "img-src 'self' data: http://localhost:5173; " +
                "font-src 'self' data: http://localhost:5173; " +
                "connect-src 'self' http://localhost:5173");

            httpResponse.setHeader("Referer_Policy", "strict-origin-when-cross-origin");
            httpResponse.setHeader("Permissions-Policy",
                    "geolocation=(), microphone=(), camera=()");

            chain.doFilter(request,response);
        };
    }
}
