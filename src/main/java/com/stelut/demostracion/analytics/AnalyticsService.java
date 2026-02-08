package com.stelut.demostracion.analytics;

import java.time.Duration;

import com.stelut.demostracion.analytics.dto.AnalyticsSummaryResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnalyticsService {

	private final HeavyAnalyticsEngine heavyAnalyticsEngine;
	private final AnalyticsSummaryCache analyticsSummaryCache;
	private final Duration summaryCacheTtl;

	public AnalyticsService(
			HeavyAnalyticsEngine heavyAnalyticsEngine,
			AnalyticsSummaryCache analyticsSummaryCache,
			@Value("${app.analytics.summary-cache-ttl:PT60S}") Duration summaryCacheTtl
	) {
		this.heavyAnalyticsEngine = heavyAnalyticsEngine;
		this.analyticsSummaryCache = analyticsSummaryCache;
		this.summaryCacheTtl = summaryCacheTtl;
	}

	@Transactional(readOnly = true)
	public AnalyticsSummaryResponse summary() {
		return analyticsSummaryCache.getIfFresh(summaryCacheTtl)
				.orElseGet(() -> {
					AnalyticsSummaryResponse fresh = heavyAnalyticsEngine.computeSummary();
					analyticsSummaryCache.put(fresh);
					return fresh;
				});
	}
}
