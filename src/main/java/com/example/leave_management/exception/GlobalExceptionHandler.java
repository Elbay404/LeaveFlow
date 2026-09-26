package com.example.leave_management.exception;

import com.example.leave_management.dto.error.ErrorResponse;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");


    // 404
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(
            ResourceNotFoundException exception) {

        logger.warn(
                "Resource not found: {}",
                exception.getMessage()
        );

        return new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "Resource not found",
                LocalDateTime.now().format(FORMATTER)
        );
    }


    // 409
    @ExceptionHandler(DuplicateResourceException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleDuplicate(
            DuplicateResourceException exception) {

        logger.warn(
                "Duplicate resource: {}",
                exception.getMessage()
        );

        return new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                "Resource already exists",
                LocalDateTime.now().format(FORMATTER)
        );
    }


    // 401
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(
            InvalidCredentialsException exception) {

        logger.warn(
                "Invalid credentials attempt: {}",
                exception.getMessage()
        );

        ErrorResponse error = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "Invalid credentials",
                LocalDateTime.now().format(FORMATTER)
        );

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(error);
    }


    // 404
    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleEntityNotFound(
            EntityNotFoundException exception) {

        logger.warn(
                "Entity not found: {}",
                exception.getMessage()
        );

        return new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "Resource not found",
                LocalDateTime.now().format(FORMATTER)
        );
    }

    // 400

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleIllegalArgument(
            IllegalArgumentException exception) {

        logger.warn(
                "Invalid argument: {}",
                exception.getMessage()
        );

        return new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Invalid request",
                LocalDateTime.now().format(FORMATTER)
        );
    }


    // 400


    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(
            MethodArgumentNotValidException exception) {

        String realMessage = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Validation failed");

        logger.warn(
                "Validation failed: {}",
                realMessage
        );

        return new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Invalid request data",
                LocalDateTime.now().format(FORMATTER)
        );
    }


    // 403

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException exception) {

        logger.warn(
                "Access denied: {}",
                exception.getMessage()
        );

        ErrorResponse error = new ErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "Access denied",
                LocalDateTime.now().format(FORMATTER)
        );

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(error);
    }


    // 500  Email Error
    @ExceptionHandler(EmailSendingException.class)
    public ResponseEntity<ErrorResponse> handleEmailSending(
            EmailSendingException exception) {

        logger.error(
                "Email sending error: {}",
                exception.getMessage(),
                exception
        );

        ErrorResponse error = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Unable to process the request",
                LocalDateTime.now().format(FORMATTER)
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error);
    }


    // 500
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGeneralException(
            Exception exception) {

        logger.error(
                "Unexpected error: {}",
                exception.getMessage(),
                exception
        );

        return new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected error occurred",
                LocalDateTime.now().format(FORMATTER)
        );
    }
}