package com.aurafit.business.auth.controller;

import com.aurafit.business.auth.service.AuthService;
import com.aurafit.business.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class AuthControllerLogoutTest {

    @Test
    void logoutInvalidatesTheRefreshTokenAndExpiresTheCookie() {
        UserService userService = mock(UserService.class);
        AuthController controller = new AuthController(mock(AuthService.class), userService);

        var response = controller.logout(null);

        verify(userService).logout(null);
        String setCookie = response.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(setCookie)
                .contains("refreshToken=")
                .contains("Max-Age=0")
                .contains("Path=/")
                .contains("HttpOnly")
                .contains("SameSite=Strict");
    }
}
