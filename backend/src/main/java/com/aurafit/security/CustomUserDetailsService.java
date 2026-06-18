package com.aurafit.security;

import com.aurafit.entity.User;
import com.aurafit.enums.UserStatus;
import com.aurafit.exception.UnauthorizedException;
import com.aurafit.repository.UserRepository;
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
                .orElseThrow(() -> new UsernameNotFoundException("Khong tim thay email: " + email));

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new UnauthorizedException("Tai khoan cua ban hien dang bi khoa.");
        }

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                Collections.singleton(() -> "ROLE_" + user.getRole().name()));
    }
}
