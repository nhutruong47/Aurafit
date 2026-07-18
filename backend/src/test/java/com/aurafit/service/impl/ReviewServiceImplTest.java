package com.aurafit.service.impl;

import com.aurafit.dto.request.ReviewRequest;
import com.aurafit.dto.response.ReviewResponse;
import com.aurafit.dto.response.ReviewSummaryResponse;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.RentalOrder;
import com.aurafit.entity.RentalOrderDetail;
import com.aurafit.entity.Review;
import com.aurafit.entity.User;
import com.aurafit.enums.OrderStatus;
import com.aurafit.enums.ReviewStatus;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ConflictException;
import com.aurafit.repository.RentalOrderDetailRepository;
import com.aurafit.repository.ReviewImageRepository;
import com.aurafit.repository.ReviewRatingSummaryProjection;
import com.aurafit.repository.ReviewRepository;
import com.aurafit.repository.UploadAssetRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    private static final long USER_ID = 10L;
    private static final long OTHER_USER_ID = 11L;
    private static final long COSTUME_ID = 20L;
    private static final long ORDER_DETAIL_ID = 30L;
    private static final long REVIEW_ID = 40L;
    private static final String USER_EMAIL = "reviewer@aurafit.com";

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ReviewImageRepository reviewImageRepository;

    @Mock
    private RentalOrderDetailRepository rentalOrderDetailRepository;

    @Mock
    private UploadAssetRepository uploadAssetRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private User owner;
    private Costume costume;
    private RentalOrder order;
    private RentalOrderDetail orderDetail;

    @BeforeEach
    void setUp() {
        owner = user(USER_ID, USER_EMAIL, "Review Owner");
        costume = Costume.builder()
                .id(COSTUME_ID)
                .name("Test Costume")
                .build();
        CostumeItem costumeItem = CostumeItem.builder()
                .id(21L)
                .sku("TEST-SKU")
                .costume(costume)
                .build();
        order = RentalOrder.builder()
                .id(22L)
                .user(owner)
                .status(OrderStatus.RENTED)
                .build();
        orderDetail = RentalOrderDetail.builder()
                .id(ORDER_DETAIL_ID)
                .rentalOrder(order)
                .costumeItem(costumeItem)
                .build();
    }

    @Test
    void createReview_shouldSucceedWhenRentalIsEligible() {
        stubAuthenticatedOwner();
        when(rentalOrderDetailRepository.findById(ORDER_DETAIL_ID)).thenReturn(Optional.of(orderDetail));
        when(reviewRepository.existsByRentalOrderDetail_Id(ORDER_DETAIL_ID)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenAnswer(invocation -> {
            Review review = invocation.getArgument(0);
            review.setId(REVIEW_ID);
            review.setCreatedAt(LocalDateTime.now());
            return review;
        });

        ReviewResponse response = reviewService.createReview(
                USER_EMAIL,
                COSTUME_ID,
                request(5, List.of())
        );

        assertEquals(REVIEW_ID, response.id());
        assertEquals(USER_ID, response.userId());
        assertEquals(5, response.rating());
        assertEquals(ReviewStatus.VISIBLE, response.status());
        assertTrue(response.imageUrls().isEmpty());
        verify(reviewRepository).save(any(Review.class));
    }

    @ParameterizedTest
    @EnumSource(value = OrderStatus.class, names = {"PENDING", "CANCELLED"})
    void createReview_shouldRejectInvalidOrderStatus(OrderStatus invalidStatus) {
        order.setStatus(invalidStatus);
        stubAuthenticatedOwner();
        when(rentalOrderDetailRepository.findById(ORDER_DETAIL_ID)).thenReturn(Optional.of(orderDetail));

        assertThrows(
                BadRequestException.class,
                () -> reviewService.createReview(USER_EMAIL, COSTUME_ID, request(4, List.of()))
        );

        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void createReview_shouldRejectOrderDetailThatAlreadyHasReview() {
        stubAuthenticatedOwner();
        when(rentalOrderDetailRepository.findById(ORDER_DETAIL_ID)).thenReturn(Optional.of(orderDetail));
        when(reviewRepository.existsByRentalOrderDetail_Id(ORDER_DETAIL_ID)).thenReturn(true);

        assertThrows(
                ConflictException.class,
                () -> reviewService.createReview(USER_EMAIL, COSTUME_ID, request(4, List.of()))
        );

        verify(reviewRepository, never()).save(any(Review.class));
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 6})
    void createReview_shouldRejectRatingOutsideAllowedRange(int rating) {
        stubAuthenticatedOwner();

        assertThrows(
                BadRequestException.class,
                () -> reviewService.createReview(USER_EMAIL, COSTUME_ID, request(rating, List.of()))
        );

        verify(rentalOrderDetailRepository, never()).findById(any());
        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void createReview_shouldRejectMoreThanThreeImages() {
        stubAuthenticatedOwner();

        assertThrows(
                BadRequestException.class,
                () -> reviewService.createReview(
                        USER_EMAIL,
                        COSTUME_ID,
                        request(5, List.of(1L, 2L, 3L, 4L))
                )
        );

        verify(uploadAssetRepository, never()).findAllById(any());
        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void updateReview_shouldSucceedWithinOneHour() {
        Review review = review(owner, LocalDateTime.now().minusMinutes(30));
        stubAuthenticatedUserId();
        when(reviewRepository.findById(REVIEW_ID)).thenReturn(Optional.of(review));
        when(reviewRepository.save(review)).thenReturn(review);
        when(reviewImageRepository.findByReview_IdInOrderByReview_IdAscDisplayOrderAsc(List.of(REVIEW_ID)))
                .thenReturn(List.of());

        ReviewResponse response = reviewService.updateReview(
                USER_EMAIL,
                REVIEW_ID,
                new ReviewRequest(null, 3, "Updated comment", null)
        );

        assertEquals(3, response.rating());
        assertEquals("Updated comment", response.comment());
        verify(reviewRepository).save(review);
        verify(reviewImageRepository, never()).deleteByReview_Id(REVIEW_ID);
    }

    @Test
    void deleteReview_shouldSucceedWithinOneHour() {
        Review review = review(owner, LocalDateTime.now().minusMinutes(30));
        stubAuthenticatedUserId();
        when(reviewRepository.findById(REVIEW_ID)).thenReturn(Optional.of(review));

        reviewService.deleteReview(USER_EMAIL, REVIEW_ID);

        verify(reviewImageRepository).deleteByReview_Id(REVIEW_ID);
        verify(reviewRepository).delete(review);
    }

    @Test
    void updateReview_shouldRejectAfterOneHour() {
        Review review = review(owner, LocalDateTime.now().minusHours(1).minusSeconds(1));
        stubAuthenticatedUserId();
        when(reviewRepository.findById(REVIEW_ID)).thenReturn(Optional.of(review));

        assertThrows(
                BadRequestException.class,
                () -> reviewService.updateReview(USER_EMAIL, REVIEW_ID, request(4, null))
        );

        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void deleteReview_shouldRejectAfterOneHour() {
        Review review = review(owner, LocalDateTime.now().minusHours(1).minusSeconds(1));
        stubAuthenticatedUserId();
        when(reviewRepository.findById(REVIEW_ID)).thenReturn(Optional.of(review));

        assertThrows(
                BadRequestException.class,
                () -> reviewService.deleteReview(USER_EMAIL, REVIEW_ID)
        );

        verify(reviewRepository, never()).delete(any(Review.class));
    }

    @Test
    void updateReview_shouldRejectNonOwner() {
        Review review = review(user(OTHER_USER_ID, "other@aurafit.com", "Other User"), LocalDateTime.now());
        stubAuthenticatedUserId();
        when(reviewRepository.findById(REVIEW_ID)).thenReturn(Optional.of(review));

        assertThrows(
                AccessDeniedException.class,
                () -> reviewService.updateReview(USER_EMAIL, REVIEW_ID, request(4, null))
        );

        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void deleteReview_shouldRejectNonOwner() {
        Review review = review(user(OTHER_USER_ID, "other@aurafit.com", "Other User"), LocalDateTime.now());
        stubAuthenticatedUserId();
        when(reviewRepository.findById(REVIEW_ID)).thenReturn(Optional.of(review));

        assertThrows(
                AccessDeniedException.class,
                () -> reviewService.deleteReview(USER_EMAIL, REVIEW_ID)
        );

        verify(reviewRepository, never()).delete(any(Review.class));
    }

    @Test
    void getReviewSummary_shouldReturnVisibleAverageAndDistribution() {
        ReviewRatingSummaryProjection projection = org.mockito.Mockito.mock(ReviewRatingSummaryProjection.class);
        when(projection.getAverageRating()).thenReturn(4.34);
        when(projection.getTotalCount()).thenReturn(6L);
        when(projection.getOneStarCount()).thenReturn(0L);
        when(projection.getTwoStarCount()).thenReturn(1L);
        when(projection.getThreeStarCount()).thenReturn(1L);
        when(projection.getFourStarCount()).thenReturn(1L);
        when(projection.getFiveStarCount()).thenReturn(3L);
        when(reviewRepository.getRatingSummaryByCostumeIdAndStatus(COSTUME_ID, ReviewStatus.VISIBLE))
                .thenReturn(projection);

        ReviewSummaryResponse response = reviewService.getReviewSummary(COSTUME_ID);

        assertEquals(4.3, response.averageRating());
        assertEquals(6L, response.totalCount());
        assertEquals(0L, response.ratingDistribution().get(1));
        assertEquals(1L, response.ratingDistribution().get(2));
        assertEquals(1L, response.ratingDistribution().get(3));
        assertEquals(1L, response.ratingDistribution().get(4));
        assertEquals(3L, response.ratingDistribution().get(5));
        verify(reviewRepository).getRatingSummaryByCostumeIdAndStatus(COSTUME_ID, ReviewStatus.VISIBLE);
    }

    private void stubAuthenticatedOwner() {
        stubAuthenticatedUserId();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(owner));
    }

    private void stubAuthenticatedUserId() {
        when(userService.getUserIdByEmail(USER_EMAIL)).thenReturn(USER_ID);
    }

    private ReviewRequest request(int rating, List<Long> uploadAssetIds) {
        return new ReviewRequest(ORDER_DETAIL_ID, rating, "Good costume", uploadAssetIds);
    }

    private Review review(User user, LocalDateTime createdAt) {
        Review review = Review.builder()
                .id(REVIEW_ID)
                .rentalOrderDetail(orderDetail)
                .user(user)
                .costume(costume)
                .rating(5)
                .comment("Original comment")
                .status(ReviewStatus.VISIBLE)
                .build();
        review.setCreatedAt(createdAt);
        return review;
    }

    private User user(Long id, String email, String fullName) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFullName(fullName);
        return user;
    }
}
