package com.memorio.backend.common.security;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.List;

/**
 * Securely resolves client IP addresses from HTTP requests.
 *
 * <p>This resolver addresses the X-Forwarded-For header spoofing vulnerability
 * by validating that the direct connection comes from a trusted proxy before
 * trusting any forwarded headers.</p>
 *
 * <p><strong>Security:</strong> Without trusted proxy validation, an attacker
 * can bypass rate limiting by spoofing the X-Forwarded-For header with arbitrary IPs.</p>
 *
 * <p>Works in conjunction with Spring's {@code server.forward-headers-strategy=native}
 * but provides an additional layer of security and explicit validation.</p>
 */
@Component
public class ClientIpResolver {

    private static final Logger log = LoggerFactory.getLogger(ClientIpResolver.class);

    private final List<CidrRange> trustedProxyCidrs;

    /**
     * Constructs a ClientIpResolver with configurable trusted proxy ranges.
     *
     * @param trustedProxies Comma-separated list of trusted proxy IPs or CIDR ranges.
     *                       Defaults to Docker/private network ranges.
     */
    public ClientIpResolver(
            @Value("${security.trusted-proxies:127.0.0.1,::1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16}")
            String trustedProxies) {
        this.trustedProxyCidrs = parseCidrRanges(trustedProxies);
        log.info("ClientIpResolver initialized with trusted proxies: {}", trustedProxies);
    }

    /**
     * Resolves the real client IP address from the request.
     *
     * <p>Only trusts X-Forwarded-For and X-Real-IP headers when the direct
     * connection (RemoteAddr) comes from a trusted proxy.</p>
     *
     * @param request The HTTP servlet request
     * @return The resolved client IP address
     */
    public String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String directIp = request.getRemoteAddr();

        // Only trust forwarded headers if the direct connection is from a trusted proxy
        if (!isTrustedProxy(directIp)) {
            // Direct connection from untrusted source - use the direct IP
            // This prevents header spoofing attacks
            log.debug("Direct connection from untrusted source: {}", directIp);
            return normalizeIp(directIp);
        }

        // Connection is from trusted proxy - safe to check forwarded headers
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isEmpty()) {
            // X-Forwarded-For format: client, proxy1, proxy2, ...
            // The rightmost non-trusted IP is the real client
            String clientIp = extractClientFromForwardedFor(forwardedFor, directIp);
            if (clientIp != null) {
                log.debug("Resolved client IP from X-Forwarded-For: {} (via proxy: {})", clientIp, directIp);
                return clientIp;
            }
        }

        // Check X-Real-IP (commonly set by nginx)
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isEmpty() && isValidIp(realIp.trim())) {
            log.debug("Resolved client IP from X-Real-IP: {} (via proxy: {})", realIp.trim(), directIp);
            return normalizeIp(realIp.trim());
        }

        // Fallback to direct IP (the proxy itself in this case)
        return normalizeIp(directIp);
    }

    /**
     * Extracts the real client IP from the X-Forwarded-For header chain.
     *
     * <p>Strategy: Traverse from right to left, skipping trusted proxies,
     * and return the first (rightmost) untrusted IP - this is the real client.</p>
     */
    private String extractClientFromForwardedFor(String forwardedFor, String directIp) {
        String[] ips = forwardedFor.split(",");

        // Start from the end (proxies add to the end)
        // The chain is: client, proxy1, proxy2, ... , lastProxy
        // directIp is the last hop (not in the header)
        for (int i = ips.length - 1; i >= 0; i--) {
            String ip = ips[i].trim();
            if (!isValidIp(ip)) {
                continue;
            }

            if (!isTrustedProxy(ip)) {
                // Found the first untrusted IP from the right - this is the client
                return normalizeIp(ip);
            }
        }

        // All IPs in the chain are trusted proxies - return the leftmost one
        // This shouldn't normally happen but handles edge cases
        if (ips.length > 0) {
            String firstIp = ips[0].trim();
            if (isValidIp(firstIp)) {
                return normalizeIp(firstIp);
            }
        }

        return null;
    }

    /**
     * Checks if the given IP address belongs to a trusted proxy.
     */
    boolean isTrustedProxy(String ip) {
        if (ip == null || ip.isEmpty()) {
            return false;
        }

        String normalizedIp = normalizeIp(ip);

        try {
            InetAddress addr = InetAddress.getByName(normalizedIp);
            byte[] ipBytes = addr.getAddress();

            for (CidrRange cidr : trustedProxyCidrs) {
                if (cidr.contains(ipBytes)) {
                    return true;
                }
            }
        } catch (UnknownHostException e) {
            log.warn("Failed to parse IP address: {}", ip);
        }

        return false;
    }

    /**
     * Validates and normalizes an IP address string.
     */
    private String normalizeIp(String ip) {
        if (ip == null) {
            return null;
        }

        ip = ip.trim();

        // Handle IPv6 loopback represented as IPv4
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            return "127.0.0.1";
        }

        // Remove port if present (e.g., "192.168.1.1:8080")
        int portIndex = ip.lastIndexOf(':');
        if (portIndex > 0 && ip.indexOf(':') == portIndex) {
            // IPv4 with port
            ip = ip.substring(0, portIndex);
        }

        return ip;
    }

    /**
     * Validates that the string is a valid IP address (IPv4 or IPv6).
     */
    private boolean isValidIp(String ip) {
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            return false;
        }

        try {
            InetAddress.getByName(ip.trim());
            return true;
        } catch (UnknownHostException e) {
            return false;
        }
    }

    /**
     * Parses a comma-separated string of IP addresses and CIDR ranges.
     */
    private List<CidrRange> parseCidrRanges(String proxies) {
        List<CidrRange> ranges = new ArrayList<>();

        if (proxies == null || proxies.isEmpty()) {
            return ranges;
        }

        for (String proxy : proxies.split(",")) {
            proxy = proxy.trim();
            if (proxy.isEmpty()) {
                continue;
            }

            try {
                ranges.add(CidrRange.parse(proxy));
            } catch (Exception e) {
                log.warn("Failed to parse trusted proxy CIDR: {}", proxy);
            }
        }

        return ranges;
    }

    /**
     * Represents a CIDR range for IP address matching.
     */
    private static class CidrRange {
        private final byte[] networkAddress;
        private final int prefixLength;
        private final boolean isIpv6;

        private CidrRange(byte[] networkAddress, int prefixLength, boolean isIpv6) {
            this.networkAddress = networkAddress;
            this.prefixLength = prefixLength;
            this.isIpv6 = isIpv6;
        }

        /**
         * Parses a CIDR string (e.g., "192.168.0.0/16" or "10.0.0.1").
         */
        static CidrRange parse(String cidr) throws UnknownHostException {
            String[] parts = cidr.split("/");
            InetAddress addr = InetAddress.getByName(parts[0].trim());
            byte[] addressBytes = addr.getAddress();
            boolean isIpv6 = addressBytes.length == 16;

            int prefix;
            if (parts.length == 2) {
                prefix = Integer.parseInt(parts[1].trim());
            } else {
                // No prefix specified - treat as single host
                prefix = isIpv6 ? 128 : 32;
            }

            return new CidrRange(addressBytes, prefix, isIpv6);
        }

        /**
         * Checks if the given IP address bytes fall within this CIDR range.
         */
        boolean contains(byte[] ipBytes) {
            // IPv4 and IPv6 can't be compared directly
            if ((ipBytes.length == 16) != isIpv6) {
                // Check for IPv4-mapped IPv6 addresses
                if (ipBytes.length == 16 && !isIpv6) {
                    // Check if it's an IPv4-mapped IPv6 (::ffff:x.x.x.x)
                    boolean isIpv4Mapped = true;
                    for (int i = 0; i < 10; i++) {
                        if (ipBytes[i] != 0) {
                            isIpv4Mapped = false;
                            break;
                        }
                    }
                    if (isIpv4Mapped && ipBytes[10] == (byte) 0xff && ipBytes[11] == (byte) 0xff) {
                        // Extract the IPv4 part and compare
                        byte[] ipv4Bytes = new byte[4];
                        System.arraycopy(ipBytes, 12, ipv4Bytes, 0, 4);
                        return containsBytes(ipv4Bytes, networkAddress, prefixLength);
                    }
                }
                return false;
            }

            return containsBytes(ipBytes, networkAddress, prefixLength);
        }

        private static boolean containsBytes(byte[] ip, byte[] network, int prefix) {
            int fullBytes = prefix / 8;
            int remainingBits = prefix % 8;

            // Compare full bytes
            for (int i = 0; i < fullBytes && i < ip.length && i < network.length; i++) {
                if (ip[i] != network[i]) {
                    return false;
                }
            }

            // Compare remaining bits if any
            if (remainingBits > 0 && fullBytes < ip.length && fullBytes < network.length) {
                int mask = 0xFF << (8 - remainingBits);
                if ((ip[fullBytes] & mask) != (network[fullBytes] & mask)) {
                    return false;
                }
            }

            return true;
        }
    }
}
