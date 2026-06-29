package com.aurafit.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.aurafit.dto.request.CreateAiStylistSessionRequest;
import com.aurafit.dto.request.SendAiStylistMessageRequest;
import com.aurafit.dto.response.AiStylistMessageDTO;
import com.aurafit.dto.response.AiStylistSessionAttachResponse;
import com.aurafit.dto.response.AiStylistSessionDTO;
import com.aurafit.dto.response.CostumeDTO;
import com.aurafit.dto.response.CostumeMetadataDTO;
import com.aurafit.dto.response.SimilarCostumeRecommendationDTO;
import com.aurafit.entity.AiStylistMessage;
import com.aurafit.entity.AiStylistSession;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.User;
import com.aurafit.entity.UserInteractionEvent;
import com.aurafit.enums.AiStylistMessageRole;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.InteractionEventType;
import com.aurafit.enums.ItemStatus;
import com.aurafit.enums.OrderStatus;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.AiStylistSessionRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.RentalOrderDetailRepository;
import com.aurafit.repository.UserInteractionEventRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.AiExplanationService;
import com.aurafit.service.AiStylistService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
public class AiStylistServiceImpl implements AiStylistService {

    private static final int RESPONSE_LIMIT = 3;
    private static final int HISTORY_EVENT_LIMIT = 60;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final TypeReference<List<Map<String, Object>>> RECOMMENDATION_SUMMARY_TYPE = new TypeReference<>() {
    };
    private static final TypeReference<Map<String, Object>> METADATA_TYPE = new TypeReference<>() {
    };
    private static final Pattern BUDGET_PATTERN = Pattern.compile("(\\d+[\\d.,]*)\\s*(tr|trieu|k|nghin|ngan|vnd|d)?", Pattern.CASE_INSENSITIVE);
    private static final Pattern NORMALIZE_TEXT_PATTERN = Pattern.compile("[^\\p{L}\\p{N}\\s]");

    private final AiStylistSessionRepository aiStylistSessionRepository;
    private final CostumeRepository costumeRepository;
    private final RentalOrderDetailRepository rentalOrderDetailRepository;
    private final UserInteractionEventRepository userInteractionEventRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final AiExplanationService aiExplanationService;

    public AiStylistServiceImpl(AiStylistSessionRepository aiStylistSessionRepository,
                                CostumeRepository costumeRepository,
                                RentalOrderDetailRepository rentalOrderDetailRepository,
                                UserInteractionEventRepository userInteractionEventRepository,
                                UserRepository userRepository,
                                ObjectMapper objectMapper,
                                AiExplanationService aiExplanationService) {
        this.aiStylistSessionRepository = aiStylistSessionRepository;
        this.costumeRepository = costumeRepository;
        this.rentalOrderDetailRepository = rentalOrderDetailRepository;
        this.userInteractionEventRepository = userInteractionEventRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.aiExplanationService = aiExplanationService;
    }

    @Override
    @Transactional
    public AiStylistSessionDTO createSession(CreateAiStylistSessionRequest request, String authenticatedEmail) {
        User authenticatedUser = resolveAuthenticatedUser(authenticatedEmail);
        String guestSessionId = normalize(request.guestSessionId());
        if (authenticatedUser == null && guestSessionId == null) {
            throw new BadRequestException("guestSessionId is required for guest AI Stylist sessions.");
        }

        Costume contextCostume = request.contextCostumeId() != null
                ? costumeRepository.findByIdWithItems(request.contextCostumeId())
                .orElseThrow(() -> new ResourceNotFoundException("Costume", "id", request.contextCostumeId()))
                : null;

        AiStylistSession session = AiStylistSession.builder()
                .user(authenticatedUser)
                .guestSessionId(guestSessionId)
                .contextCostume(contextCostume)
                .build();

        addAssistantMessage(session, buildIntroMessage(contextCostume), null);
        AiStylistSession savedSession = aiStylistSessionRepository.save(session);

        return toSessionDTO(savedSession, buildActiveCostumeMap());
    }

    @Override
    @Transactional(readOnly = true)
    public AiStylistSessionDTO getSession(Long sessionId, String guestSessionId, String authenticatedEmail) {
        AiStylistSession session = loadAccessibleSession(sessionId, guestSessionId, authenticatedEmail);
        return toSessionDTO(session, buildActiveCostumeMap());
    }

    @Override
    @Transactional
    public AiStylistSessionDTO sendMessage(SendAiStylistMessageRequest request, String authenticatedEmail) {
        AiStylistSession session = loadAccessibleSession(request.sessionId(), request.guestSessionId(), authenticatedEmail);
        String normalizedMessage = request.message().trim();
        AvailabilityWindow availabilityWindow = resolveAvailabilityWindow(request.rentalStartDate(), request.rentalEndDate());

        addUserMessage(session, normalizedMessage);

        Map<Long, Costume> activeCostumesById = buildActiveCostumeMap();
        AvailabilitySnapshot availabilitySnapshot = buildAvailabilitySnapshot(activeCostumesById.values(), availabilityWindow);
        Costume selectedCostume = resolveSelectedCostume(session, request.selectedCostumeId(), activeCostumesById);
        List<UserInteractionEvent> recentEvents = loadRecentEvents(session, request.guestSessionId(), authenticatedEmail);
        StylistPreferenceProfile preferenceProfile = buildPreferenceProfile(recentEvents, activeCostumesById);
        StylistIntent intent = parseIntent(normalizedMessage, activeCostumesById.values());
        List<SimilarCostumeRecommendationDTO> recommendations = buildRecommendations(
                normalizedMessage,
                intent,
                preferenceProfile,
                selectedCostume,
                activeCostumesById.values(),
                availabilitySnapshot
        );
        recommendations = aiExplanationService.enhanceRecommendationReasons(
                "ai_stylist_chat",
                buildAiStylistExplanationContext(normalizedMessage, selectedCostume, availabilityWindow, !preferenceProfile.isEmpty()),
                recommendations
        );

        addAssistantMessage(
                session,
                buildAssistantMessage(recommendations, selectedCostume, availabilityWindow, !preferenceProfile.isEmpty()),
                writeRecommendationMetadata(recommendations, availabilityWindow)
        );

        AiStylistSession savedSession = aiStylistSessionRepository.save(session);
        return toSessionDTO(savedSession, activeCostumesById);
    }

    @Override
    @Transactional
    public AiStylistSessionAttachResponse attachGuestSessionsToUser(String guestSessionId, Long preferredSessionId, String authenticatedEmail) {
        User user = requireAuthenticatedUser(authenticatedEmail);
        String normalizedGuestSessionId = normalize(guestSessionId);
        if (normalizedGuestSessionId == null) {
            throw new BadRequestException("guestSessionId is required.");
        }

        List<AiStylistSession> guestSessions = aiStylistSessionRepository.findGuestSessionsForAttach(normalizedGuestSessionId);
        AiStylistSession latestExistingUserSession = aiStylistSessionRepository
                .findTopByUser_IdOrderByUpdatedAtDescIdDesc(user.getId())
                .orElse(null);

        AiStylistSession preferredAttachedSession = null;
        for (AiStylistSession guestSession : guestSessions) {
            guestSession.setUser(user);
            if (preferredSessionId != null && preferredSessionId.equals(guestSession.getId())) {
                preferredAttachedSession = guestSession;
            }
        }

        if (!guestSessions.isEmpty()) {
            aiStylistSessionRepository.saveAll(guestSessions);
        }

        if (preferredAttachedSession == null) {
            preferredAttachedSession = guestSessions.stream()
                    .max(this::compareSessionRecency)
                    .orElse(null);
        }

        if (preferredAttachedSession == null && preferredSessionId != null) {
            preferredAttachedSession = aiStylistSessionRepository
                    .findByIdAndUser_Id(preferredSessionId, user.getId())
                    .orElse(null);
        }

        AiStylistSession preferredSession = choosePreferredSession(latestExistingUserSession, preferredAttachedSession);
        return new AiStylistSessionAttachResponse(
                guestSessionId.trim(),
                guestSessions.size(),
                preferredSession != null ? preferredSession.getId() : null
        );
    }

    private AiStylistSession loadAccessibleSession(Long sessionId, String guestSessionId, String authenticatedEmail) {
        AiStylistSession session = aiStylistSessionRepository.findByIdWithMessages(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("AI Stylist session", "id", sessionId));

        User authenticatedUser = resolveAuthenticatedUser(authenticatedEmail);
        String normalizedGuestSessionId = normalize(guestSessionId);

        if (session.getUser() != null) {
            if (authenticatedUser == null || authenticatedUser.getId() == null || !authenticatedUser.getId().equals(session.getUser().getId())) {
                throw new BadRequestException("You cannot access this AI Stylist session.");
            }
            return session;
        }

        if (normalizedGuestSessionId == null || !normalizedGuestSessionId.equals(normalize(session.getGuestSessionId()))) {
            throw new BadRequestException("guestSessionId does not match this AI Stylist session.");
        }

        return session;
    }

    private Map<Long, Costume> buildActiveCostumeMap() {
        return costumeRepository.findActiveWithItems(CostumeStatus.ACTIVE).stream()
                .collect(Collectors.toMap(Costume::getId, costume -> costume, (left, right) -> left, LinkedHashMap::new));
    }

    private Costume resolveSelectedCostume(AiStylistSession session,
                                           Long selectedCostumeId,
                                           Map<Long, Costume> activeCostumesById) {
        if (selectedCostumeId != null) {
            return activeCostumesById.get(selectedCostumeId);
        }

        if (session.getContextCostume() != null && session.getContextCostume().getId() != null) {
            return activeCostumesById.get(session.getContextCostume().getId());
        }

        return null;
    }

    private List<SimilarCostumeRecommendationDTO> buildRecommendations(String userMessage,
                                                                       StylistIntent intent,
                                                                       StylistPreferenceProfile preferenceProfile,
                                                                       Costume selectedCostume,
                                                                       Collection<Costume> candidates,
                                                                       AvailabilitySnapshot availabilitySnapshot) {
        List<StylistCandidate> scoredCandidates = candidates.stream()
                .map(candidate -> buildStylistCandidate(candidate, intent, preferenceProfile, selectedCostume, availabilitySnapshot))
                .filter(candidate -> candidate.availableItemCount() > 0)
                .filter(candidate -> candidate.score() > 0)
                .sorted(Comparator
                        .comparingInt(StylistCandidate::score).reversed()
                        .thenComparing(Comparator.comparingInt(StylistCandidate::availableItemCount).reversed())
                        .thenComparing(candidate -> candidate.costume().getId(), Comparator.reverseOrder()))
                .limit(RESPONSE_LIMIT)
                .toList();

        if (!scoredCandidates.isEmpty()) {
            return scoredCandidates.stream()
                    .map(candidate -> SimilarCostumeRecommendationDTO.fromEntity(
                            candidate.costume(),
                            candidate.reason(),
                            candidate.score(),
                            candidate.availableItemCount()
                    ))
                    .toList();
        }

        if (selectedCostume != null && looksLikeProductSpecificQuestion(userMessage)) {
            int availableItemCount = availabilitySnapshot.availableItemCount(selectedCostume, intent.requestedSizes());
            if (availableItemCount > 0) {
                return List.of(SimilarCostumeRecommendationDTO.fromEntity(
                        selectedCostume,
                        "Dung voi costume ban dang hoi va con san de thue",
                        20 + availableItemCount,
                        availableItemCount
                ));
            }
        }

        return List.of();
    }

    private StylistCandidate buildStylistCandidate(Costume candidate,
                                                   StylistIntent intent,
                                                   StylistPreferenceProfile preferenceProfile,
                                                   Costume selectedCostume,
                                                   AvailabilitySnapshot availabilitySnapshot) {
        int availableItemCount = availabilitySnapshot.availableItemCount(candidate, intent.requestedSizes());
        CostumeMetadataDTO candidateMetadata = CostumeMetadataDTO.fromEntity(candidate.getMetadata());
        int keywordMatchCount = countKeywordMatches(candidate, intent.tokens());

        int score = keywordMatchCount * 4;
        boolean inBudget = isInBudget(candidate, intent.maxBudget());
        if (inBudget) {
            score += 6;
        } else if (intent.maxBudget() != null) {
            score -= 4;
        }

        int historyCostumeScore = preferenceProfile.costumeScore(candidate.getId());
        int historyStyleScore = preferenceProfile.attributeScore(
                preferenceProfile.styles(),
                candidateMetadata != null ? candidateMetadata.style() : null,
                2
        );
        int historyOccasionScore = preferenceProfile.attributeScore(
                preferenceProfile.occasions(),
                candidateMetadata != null ? candidateMetadata.occasion() : null,
                2
        );
        int historySeasonScore = preferenceProfile.attributeScore(
                preferenceProfile.seasons(),
                candidateMetadata != null ? candidateMetadata.season() : null,
                1
        );
        int historyColorScore = preferenceProfile.attributeScore(
                preferenceProfile.colors(),
                candidateMetadata != null ? candidateMetadata.color() : null,
                2
        );
        int historyCategoryScore = preferenceProfile.attributeScore(
                preferenceProfile.categories(),
                candidate.getCategory() != null ? candidate.getCategory().getName() : null,
                1
        );
        int historyTagScore = preferenceProfile.tagScore(candidateMetadata != null ? candidateMetadata.tags() : List.of(), 1, 8);
        int historyKeywordScore = preferenceProfile.keywordScore(candidate, 1, 8);
        score += historyCostumeScore
                + historyStyleScore
                + historyOccasionScore
                + historySeasonScore
                + historyColorScore
                + historyCategoryScore
                + historyTagScore
                + historyKeywordScore;

        boolean sameCategory = false;
        boolean sameStyle = false;
        boolean sameOccasion = false;
        boolean sameSeason = false;
        boolean sameColor = false;
        int sharedTags = 0;

        if (selectedCostume != null) {
            CostumeMetadataDTO selectedMetadata = CostumeMetadataDTO.fromEntity(selectedCostume.getMetadata());
            if (selectedCostume.getId() != null && selectedCostume.getId().equals(candidate.getId())) {
                score += 14;
            }

            sameCategory = selectedCostume.getCategory() != null
                    && candidate.getCategory() != null
                    && selectedCostume.getCategory().getId() != null
                    && selectedCostume.getCategory().getId().equals(candidate.getCategory().getId());
            sameStyle = equalsIgnoreCase(selectedMetadata != null ? selectedMetadata.style() : null,
                    candidateMetadata != null ? candidateMetadata.style() : null);
            sameOccasion = equalsIgnoreCase(selectedMetadata != null ? selectedMetadata.occasion() : null,
                    candidateMetadata != null ? candidateMetadata.occasion() : null);
            sameSeason = equalsIgnoreCase(selectedMetadata != null ? selectedMetadata.season() : null,
                    candidateMetadata != null ? candidateMetadata.season() : null);
            sameColor = equalsIgnoreCase(selectedMetadata != null ? selectedMetadata.color() : null,
                    candidateMetadata != null ? candidateMetadata.color() : null);
            sharedTags = countSharedTags(
                    selectedMetadata != null ? selectedMetadata.tags() : List.of(),
                    candidateMetadata != null ? candidateMetadata.tags() : List.of()
            );

            if (sameCategory) {
                score += 5;
            }
            if (sameStyle) {
                score += 8;
            }
            if (sameOccasion) {
                score += 6;
            }
            if (sameSeason) {
                score += 4;
            }
            if (sameColor) {
                score += 3;
            }
            score += sharedTags * 2;
        }

        boolean sizeMatched = !intent.requestedSizes().isEmpty();
        if (sizeMatched) {
            score += 4;
        }

        score += Math.min(availableItemCount, 3);

        String reason = buildStylistReason(
                candidate,
                selectedCostume,
                intent,
                keywordMatchCount,
                inBudget,
                sameCategory,
                sameStyle,
                sameOccasion,
                sameSeason,
                sameColor,
                sharedTags,
                historyCostumeScore,
                historyStyleScore,
                historyOccasionScore,
                historyColorScore,
                historyTagScore,
                historyKeywordScore,
                sizeMatched
        );
        return new StylistCandidate(candidate, score, availableItemCount, reason);
    }

    private String buildStylistReason(Costume candidate,
                                      Costume selectedCostume,
                                      StylistIntent intent,
                                      int keywordMatchCount,
                                      boolean inBudget,
                                      boolean sameCategory,
                                      boolean sameStyle,
                                      boolean sameOccasion,
                                      boolean sameSeason,
                                      boolean sameColor,
                                      int sharedTags,
                                      int historyCostumeScore,
                                      int historyStyleScore,
                                      int historyOccasionScore,
                                      int historyColorScore,
                                      int historyTagScore,
                                      int historyKeywordScore,
                                      boolean sizeMatched) {
        if (selectedCostume != null && selectedCostume.getId() != null && selectedCostume.getId().equals(candidate.getId())) {
            return "Dung voi costume ban dang hoi va con san de thue";
        }
        if (historyCostumeScore > 0) {
            return "Gan voi costume ban da xem hoac tuong tac gan day";
        }
        if (sameStyle && sameOccasion) {
            return "Cung style va dung dip su dung ban dang quan tam";
        }
        if (historyStyleScore > 0 && historyOccasionScore > 0) {
            return "Gan voi phong cach va dip su dung ban thuong tim";
        }
        if (historyStyleScore > 0) {
            return "Gan voi phong cach ban thuong xem gan day";
        }
        if (historyOccasionScore > 0 || historyColorScore > 0) {
            return "Phu hop voi nhu cau ban da tim hoac xem gan day";
        }
        if (sameCategory && sharedTags > 0) {
            return "Cung nhom san pham va co tag gan voi nhu cau hien tai";
        }
        if (sizeMatched) {
            return "Co size " + String.join("/", intent.requestedSizes()) + " dang san de thue";
        }
        if (keywordMatchCount > 0 && inBudget) {
            return "Hop voi tu khoa ban dua ra va nam trong tam gia";
        }
        if (historyTagScore > 0 || historyKeywordScore > 0) {
            return "Lien quan den hanh vi tim kiem gan day cua ban";
        }
        if (sameStyle) {
            return "Cung style voi ngu canh ban dang xem";
        }
        if (sameOccasion || sameSeason || sameColor) {
            return "Metadata phu hop voi nhu cau ban vua mo ta";
        }
        if (sameCategory) {
            return "Cung danh muc va con san de thue";
        }
        if (inBudget) {
            return "Con san de thue va nam trong tam gia ban dua ra";
        }
        if (keywordMatchCount > 0) {
            return "Lien quan den tu khoa ban vua nhap";
        }
        return "Con san de thue trong catalog hien tai";
    }

    private String buildAssistantMessage(List<SimilarCostumeRecommendationDTO> recommendations,
                                         Costume selectedCostume,
                                         AvailabilityWindow availabilityWindow,
                                         boolean usedBehaviorProfile) {
        if (recommendations.isEmpty()) {
            return "Minh chua tim thay costume phu hop hoac con san tu noi dung hien tai. Ban hay noi ro hon ve dip su dung, style, mau sac, ngan sach, size, hoac chon mot costume cu the de minh loc hep hon.";
        }

        String catalogContext = selectedCostume != null
                ? " Minh dang uu tien cac lua chon gan voi costume ban dang xem."
                : "";
        String behaviorContext = usedBehaviorProfile
                ? " Minh cung uu tien cac mau gan voi hanh vi ban da xem va tim gan day."
                : "";
        String dateContext = availabilityWindow != null
                ? " trong khoang ngay " + formatAvailabilityWindow(availabilityWindow)
                : "";

        String recommendationSummary = recommendations.stream()
                .map(item -> item.costume().name() + " (" + formatPrice(item.costume().rentalPrice()) + ") - " + item.reason())
                .collect(Collectors.joining("; "));

        return "Minh da doi chieu voi catalog dang co va chi giu lai cac costume con san de thue" + dateContext + "." +
                catalogContext +
                behaviorContext +
                " Goi y phu hop nhat hien tai: " + recommendationSummary +
                ". Neu can loc tiep, ban co the bo sung ngan sach, size, mau sac hoac dip su dung.";
    }

    private String buildIntroMessage(Costume contextCostume) {
        if (contextCostume != null) {
            return "AI Stylist da san sang. Ban co the hoi ve style, dip su dung, mau sac, ngan sach, size, hoac yeu cau san pham tuong tu voi \"" + contextCostume.getName() + "\".";
        }

        return "AI Stylist da san sang. Hay cho minh biet dip su dung, style, mau sac, ngan sach, size, hoac costume ban dang quan tam de minh de xuat tu catalog thuc te.";
    }

    private String buildAiStylistExplanationContext(String userMessage,
                                                    Costume selectedCostume,
                                                    AvailabilityWindow availabilityWindow,
                                                    boolean usedBehaviorProfile) {
        StringBuilder context = new StringBuilder("Gợi ý từ AI Stylist dựa trên catalog thật.");
        if (selectedCostume != null) {
            context.append(" Costume tham chiếu: ").append(selectedCostume.getName()).append('.');
        }
        if (availabilityWindow != null) {
            context.append(" Lọc theo lịch thuê ")
                    .append(formatAvailabilityWindow(availabilityWindow))
                    .append('.');
        }
        if (usedBehaviorProfile) {
            context.append(" Có dùng thêm lịch sử hành vi gần đây.");
        }
        if (userMessage != null && !userMessage.isBlank()) {
            context.append(" Yêu cầu người dùng: ").append(limitText(userMessage, 220));
        }
        return context.toString();
    }

    private void addUserMessage(AiStylistSession session, String content) {
        session.getMessages().add(AiStylistMessage.builder()
                .session(session)
                .role(AiStylistMessageRole.USER)
                .content(content)
                .build());
    }

    private void addAssistantMessage(AiStylistSession session, String content, String metadataJson) {
        session.getMessages().add(AiStylistMessage.builder()
                .session(session)
                .role(AiStylistMessageRole.ASSISTANT)
                .content(content)
                .metadataJson(metadataJson)
                .build());
    }

    private AiStylistSessionDTO toSessionDTO(AiStylistSession session, Map<Long, Costume> activeCostumesById) {
        return new AiStylistSessionDTO(
                session.getId(),
                session.getUser() != null ? session.getUser().getId() : null,
                session.getGuestSessionId(),
                session.getContextCostume() != null ? CostumeDTO.fromEntity(session.getContextCostume()) : null,
                session.getMessages().stream()
                        .map(message -> AiStylistMessageDTO.fromEntity(message, readStoredRecommendations(message.getMetadataJson(), activeCostumesById)))
                        .toList(),
                session.getCreatedAt() != null ? session.getCreatedAt().toString() : null,
                session.getUpdatedAt() != null ? session.getUpdatedAt().toString() : null
        );
    }

    private List<SimilarCostumeRecommendationDTO> readStoredRecommendations(String metadataJson, Map<Long, Costume> activeCostumesById) {
        if (metadataJson == null || metadataJson.isBlank()) {
            return List.of();
        }

        try {
            List<Map<String, Object>> summaries = objectMapper.readValue(metadataJson, RECOMMENDATION_SUMMARY_TYPE);
            List<SimilarCostumeRecommendationDTO> recommendations = new ArrayList<>();
            Map<AvailabilityWindow, AvailabilitySnapshot> availabilitySnapshots = new HashMap<>();
            List<Costume> activeCostumes = new ArrayList<>(activeCostumesById.values());
            for (Map<String, Object> summary : summaries) {
                Long costumeId = parseLong(summary.get("costumeId"));
                Costume costume = costumeId != null ? activeCostumesById.get(costumeId) : null;
                if (costume == null) {
                    continue;
                }

                AvailabilityWindow availabilityWindow = readAvailabilityWindow(summary);
                AvailabilitySnapshot availabilitySnapshot = availabilitySnapshots.computeIfAbsent(
                        availabilityWindow,
                        key -> buildAvailabilitySnapshot(activeCostumes, key)
                );
                int availableItemCount = availabilitySnapshot.availableItemCount(costume, Set.of());
                if (availableItemCount <= 0) {
                    continue;
                }

                recommendations.add(SimilarCostumeRecommendationDTO.fromEntity(
                        costume,
                        stringValue(summary.get("reason")),
                        intValue(summary.get("score")),
                        availableItemCount
                ));
            }
            return recommendations;
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private String writeRecommendationMetadata(List<SimilarCostumeRecommendationDTO> recommendations, AvailabilityWindow availabilityWindow) {
        if (recommendations == null || recommendations.isEmpty()) {
            return null;
        }

        List<Map<String, Object>> summaries = recommendations.stream()
                .map(item -> {
                    Map<String, Object> summary = new LinkedHashMap<>();
                    summary.put("costumeId", item.costume().id());
                    summary.put("reason", item.reason());
                    summary.put("score", item.score());
                    summary.put("availableItemCount", item.availableItemCount());
                    if (availabilityWindow != null) {
                        summary.put("rentalStartDate", availabilityWindow.startDate().format(DATE_FORMATTER));
                        summary.put("rentalEndDate", availabilityWindow.endDate().format(DATE_FORMATTER));
                    }
                    return summary;
                })
                .toList();

        try {
            return objectMapper.writeValueAsString(summaries);
        } catch (Exception ignored) {
            return null;
        }
    }

    private User resolveAuthenticatedUser(String authenticatedEmail) {
        String normalizedEmail = normalize(authenticatedEmail);
        if (normalizedEmail == null) {
            return null;
        }

        return userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", authenticatedEmail));
    }

    private User requireAuthenticatedUser(String authenticatedEmail) {
        User user = resolveAuthenticatedUser(authenticatedEmail);
        if (user == null) {
            throw new ResourceNotFoundException("Authenticated user not found.");
        }
        return user;
    }

    private List<UserInteractionEvent> loadRecentEvents(AiStylistSession session, String fallbackGuestSessionId, String authenticatedEmail) {
        List<UserInteractionEvent> mergedEvents = new ArrayList<>();
        Set<Long> seenEventIds = new LinkedHashSet<>();

        User user = session.getUser() != null ? session.getUser() : resolveAuthenticatedUser(authenticatedEmail);
        if (user != null && user.getId() != null) {
            for (UserInteractionEvent event : userInteractionEventRepository.findTop60ByUser_IdOrderByCreatedAtDesc(user.getId())) {
                if (event.getId() != null && seenEventIds.add(event.getId())) {
                    mergedEvents.add(event);
                }
            }
        }

        String guestSessionId = normalize(session.getGuestSessionId());
        if (guestSessionId == null) {
            guestSessionId = normalize(fallbackGuestSessionId);
        }
        if (guestSessionId != null) {
            for (UserInteractionEvent event : userInteractionEventRepository.findTop60BySessionIdOrderByCreatedAtDesc(guestSessionId)) {
                if (event.getId() != null && seenEventIds.add(event.getId())) {
                    mergedEvents.add(event);
                }
            }
        }

        return mergedEvents.stream()
                .sorted(Comparator.comparing(UserInteractionEvent::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(HISTORY_EVENT_LIMIT)
                .toList();
    }

    private StylistPreferenceProfile buildPreferenceProfile(List<UserInteractionEvent> events, Map<Long, Costume> activeCostumesById) {
        StylistPreferenceProfile profile = new StylistPreferenceProfile();

        for (int index = 0; index < events.size(); index++) {
            UserInteractionEvent event = events.get(index);
            int eventWeight = interactionEventWeight(event.getEventType(), index);
            if (eventWeight <= 0) {
                continue;
            }

            Long costumeId = parseLong(event.getTargetId());
            if (costumeId != null) {
                Costume sourceCostume = activeCostumesById.get(costumeId);
                if (sourceCostume != null) {
                    profile.addCostumeInterest(costumeId, directCostumeBoost(event.getEventType(), index));
                    profile.addCostumeMetadata(sourceCostume, eventWeight);
                }
            }

            profile.addMetadata(parseMetadataMap(event.getMetadataJson()), eventWeight);
            profile.addKeywords(event.getQueryText(), keywordEventBoost(event.getEventType()));
        }

        return profile;
    }

    private Map<String, Object> parseMetadataMap(String metadataJson) {
        if (metadataJson == null || metadataJson.isBlank()) {
            return Map.of();
        }

        try {
            return objectMapper.readValue(metadataJson.trim(), METADATA_TYPE);
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private int interactionEventWeight(InteractionEventType eventType, int eventIndex) {
        int base = switch (eventType) {
            case RENT -> 7;
            case ADD_TO_CART -> 6;
            case RECOMMENDATION_CLICK -> 5;
            case VIEW_PRODUCT -> 3;
            case SEARCH, CHAT_QUERY -> 2;
            default -> 0;
        };

        if (eventIndex < 5) {
            return base + 2;
        }
        if (eventIndex < 10) {
            return base + 1;
        }
        return base;
    }

    private int directCostumeBoost(InteractionEventType eventType, int eventIndex) {
        int boost = switch (eventType) {
            case VIEW_PRODUCT, RECOMMENDATION_CLICK, ADD_TO_CART, RENT -> 8;
            default -> 0;
        };

        if (eventIndex < 5) {
            return boost + 2;
        }
        if (eventIndex < 10) {
            return boost + 1;
        }
        return boost;
    }

    private int keywordEventBoost(InteractionEventType eventType) {
        return switch (eventType) {
            case SEARCH, CHAT_QUERY -> 2;
            default -> 0;
        };
    }

    private StylistIntent parseIntent(String message, Collection<Costume> candidates) {
        String normalizedMessage = normalizeText(message);
        Set<String> tokens = new LinkedHashSet<>();
        if (normalizedMessage != null) {
            for (String token : normalizedMessage.split("\\s+")) {
                if (token.length() >= 3) {
                    tokens.add(token);
                }
            }
        }

        return new StylistIntent(tokens, extractMaxBudget(message), extractRequestedSizes(normalizedMessage, candidates));
    }

    private Set<String> extractRequestedSizes(String normalizedMessage, Collection<Costume> candidates) {
        if (normalizedMessage == null || candidates == null || candidates.isEmpty()) {
            return Set.of();
        }

        LinkedHashSet<String> requestedSizes = new LinkedHashSet<>();
        Set<String> knownSizes = candidates.stream()
                .flatMap(costume -> costume.getItems().stream())
                .map(CostumeItem::getSize)
                .map(this::normalizeText)
                .filter(size -> size != null && !size.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        for (String knownSize : knownSizes) {
            Pattern sizePattern = Pattern.compile("(?<![\\p{L}\\p{N}])" + Pattern.quote(knownSize) + "(?![\\p{L}\\p{N}])");
            if (sizePattern.matcher(normalizedMessage).find()) {
                requestedSizes.add(knownSize.toUpperCase(Locale.ROOT));
            }
        }

        return requestedSizes;
    }

    private BigDecimal extractMaxBudget(String message) {
        String normalizedMessage = normalizeText(message);
        if (normalizedMessage == null) {
            return null;
        }

        boolean hasBudgetHint = normalizedMessage.contains("ngan sach")
                || normalizedMessage.contains("toi da")
                || normalizedMessage.contains("duoi")
                || normalizedMessage.contains("gia");

        Matcher matcher = BUDGET_PATTERN.matcher(normalizedMessage);
        while (matcher.find()) {
            String rawNumber = matcher.group(1);
            String rawUnit = matcher.group(2);
            if (rawNumber == null) {
                continue;
            }

            if (rawUnit == null && !hasBudgetHint) {
                continue;
            }

            String sanitizedNumber = rawNumber.replace(".", "").replace(",", ".");
            try {
                BigDecimal numericValue = new BigDecimal(sanitizedNumber);
                String normalizedUnit = rawUnit != null ? rawUnit.toLowerCase(Locale.ROOT) : "";
                if (normalizedUnit.startsWith("tr")) {
                    return numericValue.multiply(BigDecimal.valueOf(1_000_000L));
                }
                if (normalizedUnit.startsWith("k") || normalizedUnit.startsWith("ng")) {
                    return numericValue.multiply(BigDecimal.valueOf(1_000L));
                }
                return numericValue;
            } catch (NumberFormatException ignored) {
                // Keep scanning for a valid budget token.
            }
        }

        return null;
    }

    private int countKeywordMatches(Costume candidate, Set<String> tokens) {
        if (tokens == null || tokens.isEmpty()) {
            return 0;
        }

        String searchableText = normalizeText(
                String.join(" ",
                        safe(candidate.getName()),
                        safe(candidate.getDescription()),
                        candidate.getCategory() != null ? safe(candidate.getCategory().getName()) : "",
                        candidate.getMetadata() != null ? safe(candidate.getMetadata().getStyle()) : "",
                        candidate.getMetadata() != null ? safe(candidate.getMetadata().getOccasion()) : "",
                        candidate.getMetadata() != null ? safe(candidate.getMetadata().getSeason()) : "",
                        candidate.getMetadata() != null ? safe(candidate.getMetadata().getColor()) : "",
                        candidate.getMetadata() != null ? String.join(" ", candidate.getMetadata().getTags()) : ""
                )
        );

        if (searchableText == null) {
            return 0;
        }

        int matchCount = 0;
        for (String token : tokens) {
            if (searchableText.contains(token)) {
                matchCount++;
            }
        }
        return matchCount;
    }

    private int countSharedTags(List<String> leftTags, List<String> rightTags) {
        Set<String> normalizedLeft = normalizeTags(leftTags);
        if (normalizedLeft.isEmpty()) {
            return 0;
        }

        Set<String> normalizedRight = normalizeTags(rightTags);
        normalizedLeft.retainAll(normalizedRight);
        return normalizedLeft.size();
    }

    private Set<String> normalizeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return new LinkedHashSet<>();
        }

        LinkedHashSet<String> normalizedTags = new LinkedHashSet<>();
        for (String tag : tags) {
            String normalizedTag = normalize(tag);
            if (normalizedTag != null) {
                normalizedTags.add(normalizedTag);
            }
        }
        return normalizedTags;
    }

    private boolean isInBudget(Costume candidate, BigDecimal maxBudget) {
        if (candidate == null || candidate.getRentalPrice() == null || maxBudget == null) {
            return false;
        }

        return candidate.getRentalPrice().compareTo(maxBudget) <= 0;
    }

    private boolean equalsIgnoreCase(String left, String right) {
        String normalizedLeft = normalize(left);
        String normalizedRight = normalize(right);
        return normalizedLeft != null && normalizedLeft.equals(normalizedRight);
    }

    private AvailabilityWindow resolveAvailabilityWindow(LocalDate rentalStartDate, LocalDate rentalEndDate) {
        if (rentalStartDate == null && rentalEndDate == null) {
            return null;
        }

        if (rentalStartDate == null || rentalEndDate == null) {
            throw new BadRequestException("rentalStartDate and rentalEndDate must be provided together.");
        }

        if (!rentalEndDate.isAfter(rentalStartDate)) {
            throw new BadRequestException("rentalEndDate must be after rentalStartDate.");
        }

        return new AvailabilityWindow(rentalStartDate, rentalEndDate);
    }

    private AvailabilityWindow readAvailabilityWindow(Map<String, Object> summary) {
        LocalDate rentalStartDate = parseLocalDate(summary.get("rentalStartDate"));
        LocalDate rentalEndDate = parseLocalDate(summary.get("rentalEndDate"));
        if (rentalStartDate == null || rentalEndDate == null) {
            return null;
        }

        if (!rentalEndDate.isAfter(rentalStartDate)) {
            return null;
        }

        return new AvailabilityWindow(rentalStartDate, rentalEndDate);
    }

    private AvailabilitySnapshot buildAvailabilitySnapshot(Collection<Costume> costumes, AvailabilityWindow availabilityWindow) {
        if (availabilityWindow == null) {
            return new AvailabilitySnapshot(null, Set.of());
        }

        Set<Long> availableItemIds = costumes.stream()
                .flatMap(costume -> costume.getItems().stream())
                .filter(item -> ItemStatus.AVAILABLE.equals(item.getStatus()))
                .map(CostumeItem::getId)
                .filter(id -> id != null)
                .collect(Collectors.toCollection(HashSet::new));

        if (availableItemIds.isEmpty()) {
            return new AvailabilitySnapshot(availabilityWindow, Set.of());
        }

        Set<Long> blockedItemIds = new HashSet<>(rentalOrderDetailRepository.findBookedCostumeItemIdsForPeriod(
                availableItemIds,
                availabilityWindow.startAt(),
                availabilityWindow.endAt(),
                OrderStatus.CANCELLED
        ));

        return new AvailabilitySnapshot(availabilityWindow, blockedItemIds);
    }

    private String formatAvailabilityWindow(AvailabilityWindow availabilityWindow) {
        return availabilityWindow.startDate().format(DATE_FORMATTER) + " den " + availabilityWindow.endDate().format(DATE_FORMATTER);
    }

    private boolean looksLikeProductSpecificQuestion(String userMessage) {
        String normalizedMessage = normalizeText(userMessage);
        if (normalizedMessage == null) {
            return false;
        }

        return normalizedMessage.contains("san pham nay")
                || normalizedMessage.contains("costume nay")
                || normalizedMessage.contains("bo nay")
                || normalizedMessage.contains("co con hang");
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed.toLowerCase(Locale.ROOT);
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String normalized = NORMALIZE_TEXT_PATTERN.matcher(value.toLowerCase(Locale.ROOT)).replaceAll(" ").trim();
        return normalized.isEmpty() ? null : normalized.replaceAll("\\s+", " ");
    }

    private String formatPrice(BigDecimal value) {
        if (value == null) {
            return "khong ro gia";
        }

        DecimalFormat decimalFormat = new DecimalFormat("#,###");
        decimalFormat.setRoundingMode(RoundingMode.HALF_UP);
        return decimalFormat.format(value) + " VND";
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String limitText(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }

    private Long parseLong(Object value) {
        if (value == null) {
            return null;
        }

        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private int intValue(Object value) {
        if (value == null) {
            return 0;
        }

        if (value instanceof Number number) {
            return number.intValue();
        }

        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }

    private String stringValue(Object value) {
        return value != null ? value.toString() : null;
    }

    private LocalDate parseLocalDate(Object value) {
        if (value == null) {
            return null;
        }

        try {
            return LocalDate.parse(value.toString(), DATE_FORMATTER);
        } catch (Exception ignored) {
            return null;
        }
    }

    private AiStylistSession choosePreferredSession(AiStylistSession left, AiStylistSession right) {
        if (left == null) {
            return right;
        }
        if (right == null) {
            return left;
        }
        return compareSessionRecency(left, right) >= 0 ? left : right;
    }

    private int compareSessionRecency(AiStylistSession left, AiStylistSession right) {
        return Comparator
                .comparing(AiStylistSession::getUpdatedAt, Comparator.nullsLast(LocalDateTime::compareTo))
                .thenComparing(AiStylistSession::getCreatedAt, Comparator.nullsLast(LocalDateTime::compareTo))
                .thenComparing(AiStylistSession::getId, Comparator.nullsLast(Long::compareTo))
                .compare(left, right);
    }

    private record StylistIntent(Set<String> tokens, BigDecimal maxBudget, Set<String> requestedSizes) {
    }

    private record StylistCandidate(Costume costume, int score, int availableItemCount, String reason) {
    }

    private record AvailabilityWindow(LocalDate startDate, LocalDate endDate) {
        private LocalDateTime startAt() {
            return startDate.atStartOfDay();
        }

        private LocalDateTime endAt() {
            return endDate.atTime(LocalTime.MAX);
        }
    }

    private record AvailabilitySnapshot(AvailabilityWindow availabilityWindow, Set<Long> blockedItemIds) {
        private int availableItemCount(Costume costume, Set<String> requestedSizes) {
            if (costume == null || costume.getItems() == null) {
                return 0;
            }

            return (int) costume.getItems().stream()
                    .filter(item -> ItemStatus.AVAILABLE.equals(item.getStatus()))
                    .filter(item -> availabilityWindow == null || item.getId() == null || !blockedItemIds.contains(item.getId()))
                    .filter(item -> requestedSizes == null || requestedSizes.isEmpty() || matchesRequestedSize(item, requestedSizes))
                    .count();
        }

        private boolean matchesRequestedSize(CostumeItem item, Set<String> requestedSizes) {
            String normalizedItemSize = AiStylistServiceImpl.normalizeSize(item != null ? item.getSize() : null);
            return normalizedItemSize != null && requestedSizes.contains(normalizedItemSize);
        }
    }

    private static String normalizeSize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed.toUpperCase(Locale.ROOT);
    }

    private static final class StylistPreferenceProfile {
        private final Map<String, Integer> styles = new HashMap<>();
        private final Map<String, Integer> occasions = new HashMap<>();
        private final Map<String, Integer> seasons = new HashMap<>();
        private final Map<String, Integer> colors = new HashMap<>();
        private final Map<String, Integer> categories = new HashMap<>();
        private final Map<String, Integer> tags = new HashMap<>();
        private final Map<String, Integer> keywords = new HashMap<>();
        private final Map<Long, Integer> costumes = new HashMap<>();

        boolean isEmpty() {
            return styles.isEmpty()
                    && occasions.isEmpty()
                    && seasons.isEmpty()
                    && colors.isEmpty()
                    && categories.isEmpty()
                    && tags.isEmpty()
                    && keywords.isEmpty()
                    && costumes.isEmpty();
        }

        Map<String, Integer> styles() {
            return styles;
        }

        Map<String, Integer> occasions() {
            return occasions;
        }

        Map<String, Integer> seasons() {
            return seasons;
        }

        Map<String, Integer> colors() {
            return colors;
        }

        Map<String, Integer> categories() {
            return categories;
        }

        void addCostumeInterest(Long costumeId, int score) {
            if (costumeId == null || score <= 0) {
                return;
            }

            costumes.merge(costumeId, score, Integer::sum);
        }

        int costumeScore(Long costumeId) {
            if (costumeId == null) {
                return 0;
            }

            return costumes.getOrDefault(costumeId, 0);
        }

        void addCostumeMetadata(Costume costume, int weight) {
            if (costume == null || weight <= 0) {
                return;
            }

            CostumeMetadataDTO metadata = CostumeMetadataDTO.fromEntity(costume.getMetadata());
            add(styles, metadata != null ? metadata.style() : null, weight);
            add(occasions, metadata != null ? metadata.occasion() : null, weight);
            add(seasons, metadata != null ? metadata.season() : null, weight);
            add(colors, metadata != null ? metadata.color() : null, weight);
            add(categories, costume.getCategory() != null ? costume.getCategory().getName() : null, weight);

            if (metadata != null && metadata.tags() != null) {
                for (String tag : metadata.tags()) {
                    add(tags, tag, weight);
                }
            }
        }

        void addMetadata(Map<String, Object> metadataMap, int weight) {
            if (metadataMap == null || metadataMap.isEmpty() || weight <= 0) {
                return;
            }

            add(styles, readString(metadataMap.get("style")), weight);
            add(occasions, readString(metadataMap.get("occasion")), weight);
            add(seasons, readString(metadataMap.get("season")), weight);
            add(colors, readString(metadataMap.get("color")), weight);
            add(categories, readString(metadataMap.get("category")), weight);
            addCollection(tags, metadataMap.get("tags"), weight);
        }

        void addKeywords(String queryText, int weight) {
            String normalizedQuery = normalizeStatic(queryText);
            if (normalizedQuery == null || weight <= 0) {
                return;
            }

            for (String token : normalizedQuery.split("\\s+")) {
                if (token.length() >= 3) {
                    keywords.merge(token, weight, Integer::sum);
                }
            }
        }

        int attributeScore(Map<String, Integer> profileScores, String value, int multiplier) {
            String normalizedValue = normalizeStatic(value);
            if (normalizedValue == null) {
                return 0;
            }

            return profileScores.getOrDefault(normalizedValue, 0) * multiplier;
        }

        int tagScore(List<String> candidateTags, int unit, int cap) {
            if (candidateTags == null || candidateTags.isEmpty()) {
                return 0;
            }

            int score = 0;
            for (String tag : candidateTags) {
                String normalizedTag = normalizeStatic(tag);
                if (normalizedTag != null) {
                    score += tags.getOrDefault(normalizedTag, 0) * unit;
                }
            }
            return Math.min(cap, score);
        }

        int keywordScore(Costume candidate, int unit, int cap) {
            if (keywords.isEmpty() || candidate == null) {
                return 0;
            }

            String searchableText = normalizeStatic(
                    String.join(" ",
                            safe(candidate.getName()),
                            safe(candidate.getDescription()),
                            candidate.getCategory() != null ? safe(candidate.getCategory().getName()) : "",
                            safe(candidate.getMetadata() != null ? candidate.getMetadata().getStyle() : null),
                            safe(candidate.getMetadata() != null ? candidate.getMetadata().getOccasion() : null),
                            safe(candidate.getMetadata() != null ? candidate.getMetadata().getSeason() : null),
                            safe(candidate.getMetadata() != null ? candidate.getMetadata().getColor() : null),
                            candidate.getMetadata() != null ? String.join(" ", candidate.getMetadata().getTags()) : ""
                    )
            );

            if (searchableText == null) {
                return 0;
            }

            int score = 0;
            for (Map.Entry<String, Integer> entry : keywords.entrySet()) {
                if (searchableText.contains(entry.getKey())) {
                    score += entry.getValue() * unit;
                }
            }
            return Math.min(cap, score);
        }

        private void add(Map<String, Integer> profileScores, String value, int weight) {
            String normalizedValue = normalizeStatic(value);
            if (normalizedValue == null) {
                return;
            }

            profileScores.merge(normalizedValue, weight, Integer::sum);
        }

        private void addCollection(Map<String, Integer> profileScores, Object rawValue, int weight) {
            if (rawValue instanceof Collection<?> collection) {
                for (Object value : collection) {
                    add(profileScores, value != null ? value.toString() : null, weight);
                }
                return;
            }

            if (rawValue instanceof String text) {
                for (String token : text.split(",")) {
                    add(profileScores, token, weight);
                }
            }
        }

        private static String readString(Object value) {
            return value != null ? value.toString() : null;
        }

        private static String safe(String value) {
            return value == null ? "" : value;
        }

        private static String normalizeStatic(String value) {
            if (value == null) {
                return null;
            }

            String trimmed = value.trim().toLowerCase(Locale.ROOT);
            return trimmed.isEmpty() ? null : trimmed;
        }
    }
}
