package com.aurafit.repository;

import com.aurafit.entity.ReviewImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ReviewImageRepository extends JpaRepository<ReviewImage, Long> {

    List<ReviewImage> findByReview_IdInOrderByReview_IdAscDisplayOrderAsc(Collection<Long> reviewIds);

    void deleteByReview_Id(Long reviewId);
}
