package com.memorio.backend.common.error;
import java.time.OffsetDateTime;

public class ErrorResponse {
    private final String error;
    private final String path;
    private final OffsetDateTime timestamp = OffsetDateTime.now();
    public ErrorResponse(String error, String path) {
        this.error = error;
        this.path = path;
    }
    public String getError() { return error; }
    public String getPath() { return path; }
    public OffsetDateTime getTimestamp() { return timestamp; }
}
