package com.stelut.demostracion.social.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;

import com.stelut.demostracion.social.event.SocialEvent;

@Configuration
@EnableConfigurationProperties(SocialAsyncProperties.class)
public class SocialAsyncConfig {

	@Bean
	@ConditionalOnProperty(prefix = "app.social", name = "async-enabled", havingValue = "true")
	public NewTopic socialEventsTopic(SocialAsyncProperties properties) {
		return TopicBuilder.name(properties.kafkaTopic())
				.partitions(6)
				.replicas(1)
				.build();
	}

	@Bean
	@ConditionalOnProperty(prefix = "app.social", name = "async-enabled", havingValue = "true")
	public KafkaTemplate<String, SocialEvent> socialKafkaTemplate(ProducerFactory<String, SocialEvent> producerFactory) {
		return new KafkaTemplate<>(producerFactory);
	}
}
