package com.stelut.demostracion.analytics.dto;

import java.time.LocalDate;

public record DailyPostBucketResponse(
		LocalDate day,
		long posts
) {
}
