package com.aurafit.exception;

public class AiReasoningParseException extends RuntimeException {

    public AiReasoningParseException(String message) {
        super(message);
    }

    public AiReasoningParseException(String message, Throwable cause) {
        super(message, cause);
    }
}
