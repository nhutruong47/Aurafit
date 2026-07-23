package com.aurafit.config;

import com.aurafit.business.catalog.entity.Category;
import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.repository.CategoryRepository;
import com.aurafit.business.catalog.repository.CostumeRepository;
import com.aurafit.business.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataInitializerTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CostumeRepository costumeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void run_shouldDeleteCostumesAndCategoriesOutsideTheSeedTree() {
        Category staleCategory = Category.builder()
                .id(999L)
                .name("Danh mục dư")
                .slug("danh-muc-du")
                .path("danh-muc-du")
                .isActive(true)
                .build();
        Costume staleCostume = Costume.builder()
                .id(999L)
                .name("Sản phẩm dư")
                .slug("san-pham-du")
                .category(staleCategory)
                .build();

        when(userRepository.existsByEmail(anyString())).thenReturn(true);
        when(categoryRepository.findAll()).thenReturn(List.of(staleCategory));
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(costumeRepository.findAll()).thenReturn(List.of(staleCostume));

        dataInitializer().run();

        verify(costumeRepository).deleteAll(List.of(staleCostume));
        verify(costumeRepository).flush();
        verify(categoryRepository).delete(staleCategory);
        verify(categoryRepository).flush();
        verify(costumeRepository, never()).save(any(Costume.class));
    }

    private DataInitializer dataInitializer() {
        return new DataInitializer(
                categoryRepository,
                costumeRepository,
                userRepository,
                passwordEncoder
        );
    }
}
