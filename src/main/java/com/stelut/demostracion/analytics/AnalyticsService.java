package com.stelut.demostracion.analytics;

import com.stelut.demostracion.analytics.dto.AnalyticsSummaryResponse;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnalyticsService {

	private final HeavyAnalyticsEngine heavyAnalyticsEngine;

	public AnalyticsService(HeavyAnalyticsEngine heavyAnalyticsEngine) {
		this.heavyAnalyticsEngine = heavyAnalyticsEngine;
	}

	@Transactional(readOnly = true)
	public AnalyticsSummaryResponse summary() {
		return heavyAnalyticsEngine.computeSummary();
	}
}
