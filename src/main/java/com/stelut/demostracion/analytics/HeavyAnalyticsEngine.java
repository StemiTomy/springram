package com.stelut.demostracion.analytics;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import com.stelut.demostracion.analytics.dto.AnalyticsSummaryResponse;
import com.stelut.demostracion.analytics.dto.DailyPostBucketResponse;
import com.stelut.demostracion.analytics.dto.HourlyPostBucketResponse;
import com.stelut.demostracion.analytics.dto.TopPostSummaryResponse;
import com.stelut.demostracion.analytics.dto.WordCountResponse;
import com.stelut.demostracion.social.PostRepository;
import com.stelut.demostracion.user.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Lazy
public class HeavyAnalyticsEngine {

	private static final Logger log = LoggerFactory.getLogger(HeavyAnalyticsEngine.class);
	private static final int TOP_WORDS_LIMIT = 15;
	private static final int TOP_POSTS_LIMIT = 10;
	private static final int EVOLUTION_DAYS = 30;

	private final AnalyticsQueryRepository analyticsQueryRepository;
	private final PostRepository postRepository;
	private final UserRepository userRepository;

	public HeavyAnalyticsEngine(
			AnalyticsQueryRepository analyticsQueryRepository,
			PostRepository postRepository,
			UserRepository userRepository
	) {
		this.analyticsQueryRepository = analyticsQueryRepository;
		this.postRepository = postRepository;
		this.userRepository = userRepository;
		log.info("HeavyAnalyticsEngine initialized lazily");
	}

	@Transactional(readOnly = true)
	public AnalyticsSummaryResponse computeSummary() {
		long totalPosts = postRepository.count();
		long totalUsers = userRepository.count();
		double averageWordLength = Optional.ofNullable(analyticsQueryRepository.findAverageWordLength())
				.map(AnalyticsQueryRepository.AverageProjection::getValue)
				.map(HeavyAnalyticsEngine::safeDouble)
				.orElse(0D);
		double averageUserEmailLength = Optional.ofNullable(analyticsQueryRepository.findAverageUserEmailLength())
				.map(AnalyticsQueryRepository.AverageProjection::getValue)
				.map(HeavyAnalyticsEngine::safeDouble)
				.orElse(0D);

		List<WordCountResponse> topWords = analyticsQueryRepository.findTopWords(TOP_WORDS_LIMIT).stream()
				.map(row -> new WordCountResponse(row.getWord(), safeLong(row.getTotal())))
				.toList();

		List<TopPostSummaryResponse> topPosts = analyticsQueryRepository.findTopPosts(TOP_POSTS_LIMIT).stream()
				.map(row -> new TopPostSummaryResponse(
						row.getPostId(),
						row.getAuthorDisplayName(),
						toPreview(row.getContent()),
						row.getCreatedAt(),
						safeLong(row.getLikes()),
						safeLong(row.getViews()),
						safeLong(row.getComments())
				))
				.toList();

		Map<Integer, Long> hourlyMap = analyticsQueryRepository.findPostsPerHour().stream()
				.collect(Collectors.toMap(
						AnalyticsQueryRepository.HourlyProjection::getHour,
						row -> safeLong(row.getTotal())
				));

		List<HourlyPostBucketResponse> hourlyHeatmap = IntStream.range(0, 24)
				.mapToObj(hour -> new HourlyPostBucketResponse(hour, hourlyMap.getOrDefault(hour, 0L)))
				.toList();

		Map<LocalDate, Long> dailyMap = analyticsQueryRepository.findPostsPerDay(EVOLUTION_DAYS).stream()
				.collect(Collectors.toMap(
						AnalyticsQueryRepository.DailyProjection::getDay,
						row -> safeLong(row.getTotal()),
						(a, b) -> b
				));

		LocalDate start = LocalDate.now(ZoneOffset.UTC).minusDays(EVOLUTION_DAYS - 1L);
		List<DailyPostBucketResponse> postsEvolution = IntStream.range(0, EVOLUTION_DAYS)
				.mapToObj(offset -> {
					LocalDate day = start.plusDays(offset);
					return new DailyPostBucketResponse(day, dailyMap.getOrDefault(day, 0L));
				})
				.toList();

		return new AnalyticsSummaryResponse(
				Instant.now(),
				totalPosts,
				totalUsers,
				averageWordLength,
				averageUserEmailLength,
				topWords,
				topPosts,
				hourlyHeatmap,
				postsEvolution
		);
	}

	private static long safeLong(Number value) {
		return value == null ? 0L : value.longValue();
	}

	private static double safeDouble(Number value) {
		return value == null ? 0D : value.doubleValue();
	}

	private static String toPreview(String content) {
		if (content == null || content.isBlank()) {
			return "";
		}
		String normalized = content.trim().replaceAll("\\s+", " ");
		int maxLength = 180;
		if (normalized.length() <= maxLength) {
			return normalized;
		}
		return normalized.substring(0, maxLength - 3) + "...";
	}
}
