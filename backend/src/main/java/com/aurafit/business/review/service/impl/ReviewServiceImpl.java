package com.aurafit.business.review.service.impl;

import com.aurafit.business.review.dto.request.ReviewRequest;
import com.aurafit.business.review.dto.response.AdminReviewResponse;
import com.aurafit.business.review.dto.response.ReviewResponse;
import com.aurafit.business.review.dto.response.ReviewSummaryResponse;
import com.aurafit.business.order.entity.RentalOrderDetail;
import com.aurafit.business.review.entity.Review;
import com.aurafit.business.review.entity.ReviewImage;
import com.aurafit.business.upload.entity.UploadAsset;
import com.aurafit.business.user.entity.User;
import com.aurafit.business.order.enums.OrderStatus;
import com.aurafit.business.review.enums.ReviewStatus;
import com.aurafit.common.exception.BadRequestException;
import com.aurafit.common.exception.ConflictException;
import com.aurafit.common.exception.ResourceNotFoundException;
import com.aurafit.business.order.repository.RentalOrderDetailRepository;
import com.aurafit.business.review.repository.ReviewImageRepository;
import com.aurafit.business.review.repository.ReviewRatingSummaryProjection;
import com.aurafit.business.review.repository.ReviewRepository;
import com.aurafit.business.upload.repository.UploadAssetRepository;
import com.aurafit.business.user.repository.UserRepository;
import com.aurafit.business.review.service.ReviewService;
import com.aurafit.business.user.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReviewServiceImpl implements ReviewService {

    private static final int MAX_REVIEW_IMAGES = 3;
    private static final Duration REVIEW_EDIT_WINDOW = Duration.ofHours(1);
    private static final Set<OrderStatus> REVIEWABLE_ORDER_STATUSES = EnumSet.of(
            OrderStatus.RENTED,
            OrderStatus.RETURNING,
            OrderStatus.RETURNED,
            OrderStatus.COMPLETED
    );

    private final ReviewRepository reviewRepository;
    private final ReviewImageRepository reviewImageRepository;
    private final RentalOrderDetailRepository rentalOrderDetailRepository;
    private final UploadAssetRepository uploadAssetRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public ReviewServiceImpl(
            ReviewRepository reviewRepository,
            ReviewImageRepository reviewImageRepository,
            RentalOrderDetailRepository rentalOrderDetailRepository,
            UploadAssetRepository uploadAssetRepository,
            UserRepository userRepository,
            UserService userService
    ) {
        this.reviewRepository = reviewRepository;
        this.reviewImageRepository = reviewImageRepository;
        this.rentalOrderDetailRepository = rentalOrderDetailRepository;
        this.uploadAssetRepository = uploadAssetRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Override
    @Transactional
    public ReviewResponse createReview(String userEmail, ReviewRequest request) {
        return createReview(userEmail, null, request);
    }

    @Override
    @Transactional
    public ReviewResponse createReview(String userEmail, Long costumeId, ReviewRequest request) {
        Long userId = userService.getUserIdByEmail(userEmail);
        User user = getUser(userId);
        validateReviewRequest(request);

        if (request.rentalOrderDetailId() == null) {
            throw new BadRequestException("Vui lòng chọn lượt thuê cần đánh giá.");
        }

        RentalOrderDetail rentalOrderDetail = rentalOrderDetailRepository
                .findById(request.rentalOrderDetailId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "RentalOrderDetail",
                        "id",
                        request.rentalOrderDetailId()
                ));

        if (!rentalOrderDetail.getRentalOrder().getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Bạn không có quyền đánh giá lượt thuê này.");
        }

        Long rentedCostumeId = rentalOrderDetail.getCostumeItem().getCostume().getId();
        if (costumeId != null && !costumeId.equals(rentedCostumeId)) {
            throw new BadRequestException("Lượt thuê không thuộc trang phục được yêu cầu.");
        }

        if (!REVIEWABLE_ORDER_STATUSES.contains(rentalOrderDetail.getRentalOrder().getStatus())) {
            throw new BadRequestException("Lượt thuê chưa ở trạng thái cho phép đánh giá.");
        }

        if (reviewRepository.existsByRentalOrderDetail_Id(rentalOrderDetail.getId())) {
            throw new ConflictException("Bạn đã đánh giá lượt thuê này rồi");
        }

        List<UploadAsset> uploadAssets = resolveOwnedUploadAssets(userId, request.uploadAssetIds());
        Review review = Review.builder()
                .rentalOrderDetail(rentalOrderDetail)
                .user(user)
                .costume(rentalOrderDetail.getCostumeItem().getCostume())
                .rating(request.rating())
                .comment(request.comment())
                .status(ReviewStatus.VISIBLE)
                .build();

        Review savedReview = reviewRepository.save(review);
        List<ReviewImage> images = saveReviewImages(savedReview, uploadAssets);
        return toResponse(savedReview, images);
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(String userEmail, Long reviewId, ReviewRequest request) {
        Long userId = userService.getUserIdByEmail(userEmail);
        Review review = getReview(reviewId);
        requireOwner(review, userId);
        requireWithinEditWindow(review);
        validateReviewRequest(request);

        List<UploadAsset> uploadAssets = request.uploadAssetIds() == null
                ? null
                : resolveOwnedUploadAssets(userId, request.uploadAssetIds());
        review.setRating(request.rating());
        review.setComment(request.comment());
        Review savedReview = reviewRepository.save(review);

        List<ReviewImage> images;
        if (uploadAssets == null) {
            images = getImagesForReview(reviewId);
        } else {
            reviewImageRepository.deleteByReview_Id(reviewId);
            images = saveReviewImages(savedReview, uploadAssets);
        }
        return toResponse(savedReview, images);
    }

    @Override
    @Transactional
    public void deleteReview(String userEmail, Long reviewId) {
        Long userId = userService.getUserIdByEmail(userEmail);
        Review review = getReview(reviewId);
        requireOwner(review, userId);
        requireWithinEditWindow(review);

        reviewImageRepository.deleteByReview_Id(reviewId);
        reviewRepository.delete(review);
    }

    @Override
    public Page<ReviewResponse> getReviewsByCostume(
            Long costumeId,
            Pageable pageable,
            Integer ratingFilter
    ) {
        if (ratingFilter != null) {
            validateRating(ratingFilter);
        }

        Page<Review> reviews = ratingFilter == null
                ? reviewRepository.findByCostume_IdAndStatus(costumeId, ReviewStatus.VISIBLE, pageable)
                : reviewRepository.findByCostume_IdAndStatusAndRating(
                        costumeId,
                        ReviewStatus.VISIBLE,
                        ratingFilter,
                        pageable
                );

        Map<Long, List<ReviewImage>> imagesByReviewId = getImagesByReviewId(reviews.getContent());
        return reviews.map(review -> toResponse(
                review,
                imagesByReviewId.getOrDefault(review.getId(), List.of())
        ));
    }

    @Override
    public ReviewSummaryResponse getReviewSummary(Long costumeId) {
        ReviewRatingSummaryProjection summary = reviewRepository
                .getRatingSummaryByCostumeIdAndStatus(costumeId, ReviewStatus.VISIBLE);

        double averageRating = summary == null || summary.getAverageRating() == null
                ? 0.0
                : Math.round(summary.getAverageRating() * 10.0) / 10.0;

        Map<Integer, Long> ratingDistribution = new LinkedHashMap<>();
        ratingDistribution.put(1, getCount(summary == null ? null : summary.getOneStarCount()));
        ratingDistribution.put(2, getCount(summary == null ? null : summary.getTwoStarCount()));
        ratingDistribution.put(3, getCount(summary == null ? null : summary.getThreeStarCount()));
        ratingDistribution.put(4, getCount(summary == null ? null : summary.getFourStarCount()));
        ratingDistribution.put(5, getCount(summary == null ? null : summary.getFiveStarCount()));

        return new ReviewSummaryResponse(
                averageRating,
                getCount(summary == null ? null : summary.getTotalCount()),
                ratingDistribution
        );
    }

    @Override
    public Page<AdminReviewResponse> getAdminReviews(
            Pageable pageable,
            ReviewStatus status,
            Integer rating,
            String costumeName
    ) {
        if (rating != null) {
            validateRating(rating);
        }

        String normalizedCostumeName = costumeName == null || costumeName.isBlank()
                ? null
                : costumeName.trim();
        Page<Review> reviews = reviewRepository.findAdminReviews(
                status,
                rating,
                normalizedCostumeName,
                pageable
        );

        Map<Long, List<ReviewImage>> imagesByReviewId = getImagesByReviewId(reviews.getContent());
        return reviews.map(review -> toAdminResponse(
                review,
                imagesByReviewId.getOrDefault(review.getId(), List.of())
        ));
    }

    @Override
    @Transactional
    public ReviewResponse hideReviewByAdmin(Long reviewId) {
        return updateReviewStatus(reviewId, ReviewStatus.HIDDEN_BY_ADMIN);
    }

    @Override
    @Transactional
    public ReviewResponse restoreReview(Long reviewId) {
        return updateReviewStatus(reviewId, ReviewStatus.VISIBLE);
    }

    private ReviewResponse updateReviewStatus(Long reviewId, ReviewStatus status) {
        Review review = getReview(reviewId);
        review.setStatus(status);
        Review savedReview = reviewRepository.save(review);
        return toResponse(savedReview, getImagesForReview(reviewId));
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private Review getReview(Long reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));
    }

    private void validateReviewRequest(ReviewRequest request) {
        if (request == null) {
            throw new BadRequestException("Dữ liệu đánh giá không hợp lệ.");
        }
        if (request.rating() == null) {
            throw new BadRequestException("Vui lòng chọn số sao đánh giá.");
        }

        validateRating(request.rating());
        if (request.uploadAssetIds() != null && request.uploadAssetIds().size() > MAX_REVIEW_IMAGES) {
            throw new BadRequestException("Mỗi đánh giá chỉ được đính kèm tối đa 3 ảnh.");
        }
    }

    private void validateRating(int rating) {
        if (rating < 1 || rating > 5) {
            throw new BadRequestException("Số sao đánh giá phải nằm trong khoảng từ 1 đến 5.");
        }
    }

    private List<UploadAsset> resolveOwnedUploadAssets(Long userId, List<Long> uploadAssetIds) {
        if (uploadAssetIds == null || uploadAssetIds.isEmpty()) {
            return List.of();
        }

        Map<Long, UploadAsset> assetsById = uploadAssetRepository.findAllById(uploadAssetIds)
                .stream()
                .collect(Collectors.toMap(UploadAsset::getId, asset -> asset));

        List<UploadAsset> orderedAssets = new ArrayList<>();
        for (Long uploadAssetId : uploadAssetIds) {
            if (uploadAssetId == null) {
                throw new BadRequestException("Danh sách ảnh đánh giá không hợp lệ.");
            }

            UploadAsset asset = assetsById.get(uploadAssetId);
            if (asset == null) {
                throw new ResourceNotFoundException("UploadAsset", "id", uploadAssetId);
            }
            if (!asset.getUploadedBy().getId().equals(userId)) {
                throw new AccessDeniedException("Bạn không có quyền sử dụng ảnh này.");
            }
            orderedAssets.add(asset);
        }

        return orderedAssets;
    }

    private List<ReviewImage> saveReviewImages(Review review, List<UploadAsset> uploadAssets) {
        if (uploadAssets.isEmpty()) {
            return List.of();
        }

        List<ReviewImage> images = new ArrayList<>();
        for (int index = 0; index < uploadAssets.size(); index++) {
            images.add(ReviewImage.builder()
                    .review(review)
                    .uploadAsset(uploadAssets.get(index))
                    .displayOrder(index)
                    .build());
        }
        return reviewImageRepository.saveAll(images);
    }

    private void requireOwner(Review review, Long userId) {
        if (!review.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Bạn không có quyền thay đổi đánh giá này.");
        }
    }

    private void requireWithinEditWindow(Review review) {
        LocalDateTime createdAt = review.getCreatedAt();
        if (createdAt == null || !LocalDateTime.now().isBefore(createdAt.plus(REVIEW_EDIT_WINDOW))) {
            throw new BadRequestException("Đã quá thời gian cho phép chỉnh sửa");
        }
    }

    private List<ReviewImage> getImagesForReview(Long reviewId) {
        return reviewImageRepository
                .findByReview_IdInOrderByReview_IdAscDisplayOrderAsc(List.of(reviewId));
    }

    private Map<Long, List<ReviewImage>> getImagesByReviewId(List<Review> reviews) {
        if (reviews.isEmpty()) {
            return Map.of();
        }

        List<Long> reviewIds = reviews.stream().map(Review::getId).toList();
        return reviewImageRepository
                .findByReview_IdInOrderByReview_IdAscDisplayOrderAsc(reviewIds)
                .stream()
                .collect(Collectors.groupingBy(
                        image -> image.getReview().getId(),
                        HashMap::new,
                        Collectors.toList()
                ));
    }

    private ReviewResponse toResponse(Review review, List<ReviewImage> images) {
        List<String> imageUrls = images.stream()
                .map(image -> image.getUploadAsset().getSecureUrl())
                .toList();

        return new ReviewResponse(
                review.getId(),
                review.getUser().getId(),
                review.getUser().getFullName(),
                review.getRating(),
                review.getComment(),
                review.getStatus(),
                review.getCreatedAt(),
                imageUrls
        );
    }

    private AdminReviewResponse toAdminResponse(Review review, List<ReviewImage> images) {
        List<String> imageUrls = images.stream()
                .map(image -> image.getUploadAsset().getSecureUrl())
                .toList();

        return new AdminReviewResponse(
                review.getId(),
                review.getCostume().getId(),
                review.getCostume().getName(),
                review.getUser().getId(),
                review.getUser().getFullName(),
                review.getRating(),
                review.getComment(),
                review.getStatus(),
                review.getCreatedAt(),
                imageUrls
        );
    }

    private long getCount(Long count) {
        return count == null ? 0L : count;
    }
}
