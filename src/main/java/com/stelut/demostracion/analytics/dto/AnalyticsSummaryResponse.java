package com.stelut.demostracion.analytics.dto;

import java.time.Instant;
import java.util.List;

public record AnalyticsSummaryResponse(
		Instant generatedAt,
		long totalPosts,
		long totalUsers,
		List<WordCountResponse> topWords,
		List<TopPostSummaryResponse> topPosts,
		List<HourlyPostBucketResponse> hourlyHeatmap,
		List<DailyPostBucketResponse> postsEvolution
) {
}
