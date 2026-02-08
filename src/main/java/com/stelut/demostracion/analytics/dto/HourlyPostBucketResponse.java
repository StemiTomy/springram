package com.stelut.demostracion.analytics.dto;

public record HourlyPostBucketResponse(
		int hour,
		long posts
) {
}
