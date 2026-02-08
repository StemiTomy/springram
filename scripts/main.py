from __future__ import annotations

import os
import random
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List

import bcrypt
import psycopg2
from dotenv import load_dotenv


@dataclass
class SeedConfig:
    database_url: str
    users_count: int
    posts_count: int
    max_likes_per_post: int
    max_comments_per_post: int
    max_view_count_per_user_post: int
    default_password: str


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def load_config() -> SeedConfig:
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError("DATABASE_URL is required in scripts/.env")

    return SeedConfig(
        database_url=database_url,
        users_count=int(os.getenv("SEED_USERS_COUNT", "20")),
        posts_count=int(os.getenv("SEED_POSTS_COUNT", "60")),
        max_likes_per_post=int(os.getenv("SEED_MAX_LIKES_PER_POST", "10")),
        max_comments_per_post=int(os.getenv("SEED_MAX_COMMENTS_PER_POST", "6")),
        max_view_count_per_user_post=int(os.getenv("SEED_MAX_VIEW_COUNT_PER_USER_POST", "20")),
        default_password=os.getenv("SEED_DEFAULT_PASSWORD", "Password123!"),
    )


def random_email(index: int) -> str:
    domains = ["springram.dev", "stelut.io", "mail.demo"]
    return f"user{index:03d}@{random.choice(domains)}"


def random_post_content() -> str:
    samples = [
        "Booting Springram in production mode.",
        "Kafka + Redis + PostgreSQL = async social stack.",
        "JWT auth working. Next: hardening and observability.",
        "Flyway migrations keep schema predictable.",
        "Cloudflare frontend talking to Spring Boot API.",
        "Demo post to test feed and counters.",
        "Designing for scale means reducing DB pressure first.",
        "Redis cache hit ratio should trend up over time.",
    ]
    suffix = random.randint(1000, 9999)
    return f"{random.choice(samples)} #{suffix}"


def random_comment() -> str:
    comments = [
        "Gran enfoque de arquitectura.",
        "Esto está listo para una demo seria.",
        "Buen uso de eventos asíncronos.",
        "Me gusta cómo quedó el feed.",
        "Vamos con la siguiente iteración.",
    ]
    return random.choice(comments)


def fmt_seconds(seconds: float) -> str:
    seconds = max(0, int(seconds))
    minutes, sec = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{sec:02d}"
    return f"{minutes:02d}:{sec:02d}"


def progress_step(total: int) -> int:
    return max(1, min(200, total // 20))


def print_progress(label: str, current: int, total: int, started_at: float) -> None:
    elapsed = time.perf_counter() - started_at
    ratio = current / total if total else 1.0
    eta = (elapsed / ratio - elapsed) if ratio > 0 else 0.0
    print(
        f"[{label}] {current}/{total} "
        f"({ratio * 100:5.1f}%) elapsed={fmt_seconds(elapsed)} eta~{fmt_seconds(eta)}"
    )


def print_load_estimate(cfg: SeedConfig) -> None:
    avg_likes_per_post = min(cfg.max_likes_per_post, cfg.users_count) / 2.0
    avg_comments_per_post = cfg.max_comments_per_post / 2.0
    avg_views_per_post = cfg.users_count / 2.0

    approx_total_statements = int(
        cfg.users_count
        + cfg.posts_count
        + cfg.posts_count * avg_likes_per_post
        + cfg.posts_count * avg_comments_per_post
        + cfg.posts_count * avg_views_per_post
    )

    print("Seed plan")
    print(f"- users: {cfg.users_count}")
    print(f"- posts: {cfg.posts_count}")
    print(f"- max likes/post: {cfg.max_likes_per_post}")
    print(f"- max comments/post: {cfg.max_comments_per_post}")
    print(f"- max view_count per (post,user): {cfg.max_view_count_per_user_post}")
    print(f"- approx SQL statements: ~{approx_total_statements:,}")
    print("- estimated duration: depends on network/DB, watch live ETA below")


def seed_users(cur, cfg: SeedConfig) -> List[uuid.UUID]:
    user_ids: List[uuid.UUID] = []
    password_hash = bcrypt.hashpw(cfg.default_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    started_at = time.perf_counter()
    step = progress_step(cfg.users_count)

    for index in range(1, cfg.users_count + 1):
        user_id = uuid.uuid4()
        email = random_email(index)
        role = "ADMIN" if index == 1 else "USER"

        cur.execute(
            """
            INSERT INTO users (id, email, password_hash, role, enabled, created_at)
            VALUES (%s, %s, %s, %s, true, %s)
            ON CONFLICT (email)
            DO UPDATE SET enabled = EXCLUDED.enabled
            RETURNING id;
            """,
            (str(user_id), email, password_hash, role, now_utc()),
        )
        returned_id = cur.fetchone()[0]
        user_ids.append(returned_id)
        if index % step == 0 or index == cfg.users_count:
            print_progress("users", index, cfg.users_count, started_at)

    return user_ids


def seed_posts(cur, user_ids: List[uuid.UUID], cfg: SeedConfig) -> List[uuid.UUID]:
    post_ids: List[uuid.UUID] = []
    started_at = time.perf_counter()
    step = progress_step(cfg.posts_count)

    for index in range(1, cfg.posts_count + 1):
        post_id = uuid.uuid4()
        author_id = random.choice(user_ids)
        author_display_name = f"user-{str(author_id)[:8]}"
        content = random_post_content()
        ts = now_utc()

        cur.execute(
            """
            INSERT INTO posts (id, author_id, author_display_name, content, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING;
            """,
            (str(post_id), str(author_id), author_display_name, content, ts, ts),
        )
        post_ids.append(post_id)
        if index % step == 0 or index == cfg.posts_count:
            print_progress("posts", index, cfg.posts_count, started_at)

    return post_ids


def seed_likes(cur, user_ids: List[uuid.UUID], post_ids: List[uuid.UUID], cfg: SeedConfig) -> int:
    inserted = 0
    started_at = time.perf_counter()
    total_posts = len(post_ids)
    step = progress_step(total_posts)

    for index, post_id in enumerate(post_ids, start=1):
        sample_size = random.randint(0, min(cfg.max_likes_per_post, len(user_ids)))
        liking_users = random.sample(user_ids, sample_size)

        for user_id in liking_users:
            like_id = uuid.uuid4()
            cur.execute(
                """
                INSERT INTO post_likes (id, post_id, user_id, created_at)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (post_id, user_id) DO NOTHING;
                """,
                (str(like_id), str(post_id), str(user_id), now_utc()),
            )
            inserted += 1
        if index % step == 0 or index == total_posts:
            print_progress("likes/posts", index, total_posts, started_at)
            print(f"[likes] inserted so far: {inserted:,}")
    return inserted


def seed_views(cur, user_ids: List[uuid.UUID], post_ids: List[uuid.UUID], cfg: SeedConfig) -> int:
    upserts = 0
    started_at = time.perf_counter()
    total_posts = len(post_ids)
    step = progress_step(total_posts)

    for index, post_id in enumerate(post_ids, start=1):
        sample_size = random.randint(1, len(user_ids))
        viewers = random.sample(user_ids, sample_size)

        for user_id in viewers:
            view_id = uuid.uuid4()
            viewed_at = now_utc()
            count = random.randint(1, cfg.max_view_count_per_user_post)

            cur.execute(
                """
                INSERT INTO post_views (id, post_id, user_id, first_viewed_at, last_viewed_at, view_count)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (post_id, user_id)
                DO UPDATE SET
                    last_viewed_at = EXCLUDED.last_viewed_at,
                    view_count = GREATEST(post_views.view_count, EXCLUDED.view_count);
                """,
                (str(view_id), str(post_id), str(user_id), viewed_at, viewed_at, count),
            )
            upserts += 1
        if index % step == 0 or index == total_posts:
            print_progress("views/posts", index, total_posts, started_at)
            print(f"[views] upserts so far: {upserts:,}")
    return upserts


def seed_comments(cur, user_ids: List[uuid.UUID], post_ids: List[uuid.UUID], cfg: SeedConfig) -> int:
    inserted = 0
    started_at = time.perf_counter()
    total_posts = len(post_ids)
    step = progress_step(total_posts)

    for index, post_id in enumerate(post_ids, start=1):
        comments_count = random.randint(0, cfg.max_comments_per_post)
        for _ in range(comments_count):
            comment_id = uuid.uuid4()
            user_id = random.choice(user_ids)
            content = random_comment()
            ts = now_utc()

            cur.execute(
                """
                INSERT INTO post_comments (id, post_id, user_id, content, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
                """,
                (str(comment_id), str(post_id), str(user_id), content, ts, ts),
            )
            inserted += 1
        if index % step == 0 or index == total_posts:
            print_progress("comments/posts", index, total_posts, started_at)
            print(f"[comments] inserted so far: {inserted:,}")
    return inserted


def main() -> None:
    cfg = load_config()
    total_started_at = time.perf_counter()
    print_load_estimate(cfg)

    print("Connecting to PostgreSQL...")
    with psycopg2.connect(cfg.database_url) as conn:
        conn.autocommit = False
        with conn.cursor() as cur:
            phase_started_at = time.perf_counter()
            users = seed_users(cur, cfg)
            conn.commit()
            print(f"[phase done] users in {fmt_seconds(time.perf_counter() - phase_started_at)}")

            phase_started_at = time.perf_counter()
            posts = seed_posts(cur, users, cfg)
            conn.commit()
            print(f"[phase done] posts in {fmt_seconds(time.perf_counter() - phase_started_at)}")

            phase_started_at = time.perf_counter()
            likes = seed_likes(cur, users, posts, cfg)
            conn.commit()
            print(f"[phase done] likes in {fmt_seconds(time.perf_counter() - phase_started_at)}")

            phase_started_at = time.perf_counter()
            views = seed_views(cur, users, posts, cfg)
            conn.commit()
            print(f"[phase done] views in {fmt_seconds(time.perf_counter() - phase_started_at)}")

            phase_started_at = time.perf_counter()
            comments = seed_comments(cur, users, posts, cfg)
            conn.commit()
            print(f"[phase done] comments in {fmt_seconds(time.perf_counter() - phase_started_at)}")

    print("Seed completed")
    print(f"- total elapsed: {fmt_seconds(time.perf_counter() - total_started_at)}")
    print(f"- users: {len(users)}")
    print(f"- posts: {len(posts)}")
    print(f"- likes attempts: {likes}")
    print(f"- views upserts: {views}")
    print(f"- comments: {comments}")
    print(f"Default password for seeded users: {cfg.default_password}")


if __name__ == "__main__":
    main()
