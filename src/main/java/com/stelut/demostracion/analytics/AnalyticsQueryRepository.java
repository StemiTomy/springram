package com.stelut.demostracion.analytics;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.stelut.demostracion.social.Post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AnalyticsQueryRepository extends JpaRepository<Post, UUID> {

	interface TopWordProjection {
		String getWord();

		Number getTotal();
	}

	interface TopPostProjection {
		UUID getPostId();

		String getAuthorDisplayName();

		String getContent();

		Instant getCreatedAt();

		Number getLikes();

		Number getViews();

		Number getComments();
	}

	interface HourlyProjection {
		Integer getHour();

		Number getTotal();
	}

	interface DailyProjection {
		LocalDate getDay();

		Number getTotal();
	}

	@Query(
			value = """
					select lower(w.word) as word, count(*) as total
					from posts p
					cross join lateral regexp_split_to_table(
					    regexp_replace(coalesce(p.content, ''), '[^A-Za-z0-9]+', ' ', 'g'),
					    '\\s+'
					) as w(word)
					where w.word <> ''
					  and char_length(w.word) >= 3
					  and lower(w.word) not in (
					    'the','and','for','that','with','this','from','have','your','you','are','was','but',
					    'una','unas','unos','que','con','para','por','del','las','los','sus','como','pero','sin',
					    'esto','esta','este','muy','mas','una','uno','todo','toda'
					  )
					group by lower(w.word)
					order by total desc, word asc
					limit :limit
					""",
			nativeQuery = true
	)
	List<TopWordProjection> findTopWords(@Param("limit") int limit);

	@Query(
			value = """
					select
					  p.id as postId,
					  p.author_display_name as authorDisplayName,
					  p.content as content,
					  p.created_at as createdAt,
					  coalesce(l.likes, 0) as likes,
					  coalesce(v.views, 0) as views,
					  coalesce(c.comments, 0) as comments
					from posts p
					left join (
					  select post_id, count(*) as likes
					  from post_likes
					  group by post_id
					) l on l.post_id = p.id
					left join (
					  select post_id, sum(view_count) as views
					  from post_views
					  group by post_id
					) v on v.post_id = p.id
					left join (
					  select post_id, count(*) as comments
					  from post_comments
					  group by post_id
					) c on c.post_id = p.id
					order by coalesce(l.likes, 0) desc, coalesce(v.views, 0) desc, coalesce(c.comments, 0) desc, p.created_at desc
					limit :limit
					""",
			nativeQuery = true
	)
	List<TopPostProjection> findTopPosts(@Param("limit") int limit);

	@Query(
			value = """
					select cast(extract(hour from p.created_at) as integer) as hour, count(*) as total
					from posts p
					group by cast(extract(hour from p.created_at) as integer)
					order by hour
					""",
			nativeQuery = true
	)
	List<HourlyProjection> findPostsPerHour();

	@Query(
			value = """
					select q.day as day, q.total as total
					from (
					  select cast(date_trunc('day', p.created_at) as date) as day, count(*) as total
					  from posts p
					  group by cast(date_trunc('day', p.created_at) as date)
					  order by day desc
					  limit :days
					) q
					order by q.day asc
					""",
			nativeQuery = true
	)
	List<DailyProjection> findPostsPerDay(@Param("days") int days);
}
