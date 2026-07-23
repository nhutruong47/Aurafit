package com.aurafit.security;

import com.aurafit.business.user.entity.User;
import com.aurafit.business.user.enums.UserStatus;
import com.aurafit.common.exception.UnauthorizedException;
import com.aurafit.business.user.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy email: " + email));

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new UnauthorizedException("Tài khoản của bạn hiện đang bị khóa.");
        }

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                Collections.singleton(() -> "ROLE_" + user.getRole().name()));
    }
}
