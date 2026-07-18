package com.aurafit.repository;

import com.aurafit.entity.TryOnHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TryOnHistoryRepository extends JpaRepository<TryOnHistory, Long> {

    Page<TryOnHistory> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<TryOnHistory> findByIdAndUserId(Long id, Long userId);
}
