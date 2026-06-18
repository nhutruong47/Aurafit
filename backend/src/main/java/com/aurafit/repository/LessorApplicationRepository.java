package com.aurafit.repository;

import com.aurafit.entity.LessorApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessorApplicationRepository extends JpaRepository<LessorApplication, Long> {

    List<LessorApplication> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<LessorApplication> findByStatusOrderByCreatedAtDesc(String status);

    List<LessorApplication> findAllByOrderByCreatedAtDesc();
}
