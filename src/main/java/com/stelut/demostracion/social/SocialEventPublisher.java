package com.stelut.demostracion.social;

import java.util.concurrent.TimeUnit;

import com.stelut.demostracion.social.config.SocialAsyncProperties;
import com.stelut.demostracion.social.event.SocialEvent;
import com.stelut.demostracion.social.metrics.SocialMetrics;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class SocialEventPublisher {

	private static final Logger log = LoggerFactory.getLogger(SocialEventPublisher.class);

	private final KafkaTemplate<String, SocialEvent> kafkaTemplate;
	private final SocialAsyncProperties properties;
	private final SocialMetrics metrics;

	public SocialEventPublisher(
			KafkaTemplate<String, SocialEvent> kafkaTemplate,
			SocialAsyncProperties properties,
			SocialMetrics metrics
	) {
		this.kafkaTemplate = kafkaTemplate;
		this.properties = properties;
		this.metrics = metrics;
	}

	public boolean publish(SocialEvent event) {
		if (!properties.asyncEnabled()) {
			return false;
		}
		try {
			kafkaTemplate.send(properties.kafkaTopic(), event.postId().toString(), event)
					.get(properties.kafkaSendTimeout().toMillis(), TimeUnit.MILLISECONDS);
			metrics.kafkaPublished(event.type().name());
			return true;
		} catch (Exception ex) {
			metrics.kafkaFailed(event.type().name());
			log.warn("kafka publish failed eventId={} type={} postId={}", event.eventId(), event.type(), event.postId(), ex);
			return false;
		}
	}
}
