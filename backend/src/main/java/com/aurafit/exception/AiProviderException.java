package com.aurafit.exception;

import com.aurafit.enums.AiErrorType;

public class AiProviderException extends RuntimeException {

    private static final String DEFAULT_USER_FRIENDLY_MESSAGE = "Có lỗi xảy ra, vui lòng thử lại";

    private final AiErrorType errorType;
    private final String userFriendlyMessage;

    public AiProviderException(String message) {
        this(AiErrorType.UNKNOWN, message, DEFAULT_USER_FRIENDLY_MESSAGE, null);
    }

    public AiProviderException(String message, Throwable cause) {
        this(AiErrorType.UNKNOWN, message, DEFAULT_USER_FRIENDLY_MESSAGE, cause);
    }

    public AiProviderException(
            AiErrorType errorType,
            String message,
            String userFriendlyMessage
    ) {
        this(errorType, message, userFriendlyMessage, null);
    }

    public AiProviderException(
            AiErrorType errorType,
            String message,
            String userFriendlyMessage,
            Throwable cause
    ) {
        super(message, cause);
        this.errorType = errorType == null ? AiErrorType.UNKNOWN : errorType;
        this.userFriendlyMessage = userFriendlyMessage == null
                ? DEFAULT_USER_FRIENDLY_MESSAGE
                : userFriendlyMessage;
    }

    public AiErrorType getErrorType() {
        return errorType;
    }

    public String getUserFriendlyMessage() {
        return userFriendlyMessage;
    }
}
