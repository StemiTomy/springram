package com.stelut.demostracion.social;

import com.stelut.demostracion.social.event.SocialEvent;
import com.stelut.demostracion.social.event.SocialEventType;
import com.stelut.demostracion.social.metrics.SocialMetrics;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.dao.DataAccessException;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@ConditionalOnProperty(prefix = "app.social", name = "async-enabled", havingValue = "true")
public class SocialEventConsumer {

	private static final Logger log = LoggerFactory.getLogger(SocialEventConsumer.class);

	private final PostLikeRepository postLikeRepository;
	private final PostViewRepository postViewRepository;
	private final PostCommentRepository postCommentRepository;
	private final SocialMetrics metrics;

	public SocialEventConsumer(
			PostLikeRepository postLikeRepository,
			PostViewRepository postViewRepository,
			PostCommentRepository postCommentRepository,
			SocialMetrics metrics
	) {
		this.postLikeRepository = postLikeRepository;
		this.postViewRepository = postViewRepository;
		this.postCommentRepository = postCommentRepository;
		this.metrics = metrics;
	}

	@Transactional
	@KafkaListener(topics = "${app.social.kafka-topic}")
	public void onEvent(SocialEvent event) {
		try {
			metrics.kafkaConsumed(event.type().name());
			if (event.type() == SocialEventType.LIKE) {
				postLikeRepository.insertIgnore(
						event.eventId(),
						event.postId(),
						event.userId(),
						event.occurredAt()
				);
				return;
			}

			if (event.type() == SocialEventType.UNLIKE) {
				postLikeRepository.deleteByPostIdAndUserId(
						event.postId(),
						event.userId()
				);
				return;
			}

			if (event.type() == SocialEventType.VIEW) {
				postViewRepository.upsertView(
						event.eventId(),
						event.postId(),
						event.userId(),
						event.occurredAt()
				);
				return;
			}

			if (event.type() == SocialEventType.COMMENT) {
				postCommentRepository.insertIgnore(
						event.commentId(),
						event.postId(),
						event.userId(),
						event.commentContent(),
						event.occurredAt()
				);
			}
		} catch (DataAccessException ex) {
			metrics.kafkaDbError(event.type().name());
			log.warn("kafka event skipped eventId={} type={} reason={}", event.eventId(), event.type(), ex.getMessage());
		}
	}
}
