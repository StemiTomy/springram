package com.stelut.demostracion.social.dto;

import java.util.UUID;

public record PostStatsResponse(
		UUID postId,
		long likes,
		long views,
		long comments
) {
}
