package com.memorio.backend.common.security;

import com.memorio.backend.auth.CookieUtil;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class JwtAuthFilter extends OncePerRequestFilter{
    private final JwtService jwt;
    private final CookieUtil cookieUtil;
    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);
    public JwtAuthFilter (JwtService jwt, CookieUtil cookieUtil){
        this.jwt = jwt;
        this.cookieUtil = cookieUtil;
    }
    @Override
    public void doFilterInternal(HttpServletRequest req,
                                 HttpServletResponse res,
                                 FilterChain chain)
            throws ServletException, IOException
    {
        String token = cookieUtil.getAccessTokenFromCookies(req);
        if(token != null && !token.isBlank()){
            try{
                // validate + parse
                var claims = jwt.parseClaims(token);
                String subject = claims.getSubject();

                // Read roles as a raw list, then map to strings safely
                Object rawRoles = claims.get("roles");
                List<String> roles;
                if (rawRoles instanceof List<?> list) {
                    roles = list.stream()
                            .map(String::valueOf)                 // toString each element
                            .toList();
                } else {
                    roles = List.of();
                }

                // Convert to GrantedAuthority with ROLE_ prefix
                Collection<? extends GrantedAuthority> authorities =
                        roles.stream()
                                .map(r -> "ROLE_" + r)
                                .map(SimpleGrantedAuthority::new)
                                .collect(Collectors.toList());

                var auth = new UsernamePasswordAuthenticationToken(
                        subject, null, authorities
                );
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }catch(JwtException e){
                log.warn("JWT validation failed URI: {}, IP: {}, Exception: {}",
                        req.getRequestURI(), req.getRemoteAddr(), e.getMessage());
            }
        }

        chain.doFilter(req, res);
    }
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request){
        String path = request.getRequestURI();
        return path.startsWith("/auth/");
    }
}
