import { render } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import './style.css';

type RoutePath = '/' | '/auth' | '/app' | '/search';

type AuthResponse = {
	accessToken: string;
	refreshToken: string;
	tokenType: string;
	accessTokenExpiresAt: number;
	refreshTokenExpiresAt: number;
};

type UserResponse = {
	id: string;
	email: string;
	role: string;
};

type PostResponse = {
	id: string;
	authorDisplayName: string;
	content: string;
	createdAt: string;
	updatedAt: string;
	likes: number;
	views: number;
	comments: number;
	likedByMe: boolean;
};

type FeedResponse = {
	items: PostResponse[];
	page: number;
	size: number;
	totalElements: number;
	totalPages: number;
};

type PostStatsResponse = {
	postId: string;
	likes: number;
	views: number;
	comments: number;
};

type SearchType = 'posts' | 'users';

type SearchSuggestionItem = {
	id: string;
	kind: 'post' | 'user';
	title: string;
	subtitle: string;
};

type SearchSuggestionsResponse = {
	query: string;
	type: SearchType;
	items: SearchSuggestionItem[];
};

type SearchResultItem = {
	id: string;
	kind: 'post' | 'user';
	primaryText: string;
	secondaryText: string;
	createdAt: string;
	posts: number;
	likes: number;
	views: number;
	comments: number;
	likedByMe: boolean;
};

type SearchResultsPageResponse = {
	query: string;
	type: SearchType;
	items: SearchResultItem[];
	page: number;
	size: number;
	totalElements: number;
	totalPages: number;
};

type Session = AuthResponse;

const SESSION_KEY = 'springram_session_v1';
const FEED_PAGE_SIZE = 20;
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8080';

function toHandle(displayName: string): string {
	return displayName
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '')
		.replace(/[^a-z0-9_]/g, '')
		.slice(0, 18) || 'springram';
}

function toAvatarInitial(displayName: string): string {
	const clean = displayName.trim();
	return clean ? clean[0]!.toUpperCase() : 'S';
}

function toSuggestionInitial(item: SearchSuggestionItem): string {
	if (item.kind === 'user') {
		return 'U';
	}
	return 'P';
}

function toRelativeTime(isoDate: string): string {
	const deltaSeconds = Math.max(1, Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000));
	if (deltaSeconds < 60) {
		return `${deltaSeconds}s`;
	}
	const minutes = Math.floor(deltaSeconds / 60);
	if (minutes < 60) {
		return `${minutes}m`;
	}
	const hours = Math.floor(minutes / 60);
	if (hours < 24) {
		return `${hours}h`;
	}
	const days = Math.floor(hours / 24);
	return `${days}d`;
}

function normalizePath(pathname: string): RoutePath {
	if (pathname === '/auth') {
		return '/auth';
	}
	if (pathname === '/app') {
		return '/app';
	}
	if (pathname === '/search') {
		return '/search';
	}
	return '/';
}

function navigate(path: RoutePath): void {
	window.history.pushState({}, '', path);
	window.dispatchEvent(new PopStateEvent('popstate'));
}

function readSession(): Session | null {
	const raw = window.localStorage.getItem(SESSION_KEY);
	if (!raw) {
		return null;
	}
	try {
		return JSON.parse(raw) as Session;
	} catch {
		window.localStorage.removeItem(SESSION_KEY);
		return null;
	}
}

function writeSession(session: Session | null): void {
	if (!session) {
		window.localStorage.removeItem(SESSION_KEY);
		return;
	}
	window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

async function refreshSession(session: Session): Promise<Session | null> {
	const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ refreshToken: session.refreshToken }),
	});

	if (!response.ok) {
		return null;
	}
	return (await response.json()) as Session;
}

async function apiFetch(
	path: string,
	init: RequestInit,
	session: Session | null,
	onSessionChange: (value: Session | null) => void,
): Promise<Response> {
	const headers = new Headers(init.headers || {});
	if (session?.accessToken) {
		headers.set('Authorization', `Bearer ${session.accessToken}`);
	}
	if (!headers.has('Content-Type') && init.body) {
		headers.set('Content-Type', 'application/json');
	}

	const first = await fetch(`${API_BASE_URL}${path}`, {
		...init,
		headers,
	});

	if (first.status !== 401 || !session?.refreshToken) {
		return first;
	}

	const renewed = await refreshSession(session);
	if (!renewed) {
		onSessionChange(null);
		return first;
	}

	onSessionChange(renewed);

	const retryHeaders = new Headers(init.headers || {});
	retryHeaders.set('Authorization', `Bearer ${renewed.accessToken}`);
	if (!retryHeaders.has('Content-Type') && init.body) {
		retryHeaders.set('Content-Type', 'application/json');
	}

	return fetch(`${API_BASE_URL}${path}`, {
		...init,
		headers: retryHeaders,
	});
}

function App() {
	const [route, setRoute] = useState<RoutePath>(normalizePath(window.location.pathname));
	const [session, setSessionState] = useState<Session | null>(readSession());
	const [profile, setProfile] = useState<UserResponse | null>(null);
	const [feed, setFeed] = useState<PostResponse[]>([]);
	const [feedMeta, setFeedMeta] = useState<{ page: number; totalPages: number; totalElements: number }>({
		page: 0,
		totalPages: 0,
		totalElements: 0,
	});
	const [authMode, setAuthMode] = useState<'register' | 'login'>('login');
	const [loadingAuth, setLoadingAuth] = useState(false);
	const [loadingFeed, setLoadingFeed] = useState(false);
	const [loadingPost, setLoadingPost] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [info, setInfo] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [postContent, setPostContent] = useState('');
	const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
	const [searchQuery, setSearchQuery] = useState('');
	const [searchType, setSearchType] = useState<SearchType>('posts');
	const [searchItems, setSearchItems] = useState<SearchSuggestionItem[]>([]);
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchLoading, setSearchLoading] = useState(false);
	const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
	const [searchResultsMeta, setSearchResultsMeta] = useState<{ page: number; totalPages: number; totalElements: number }>({
		page: 0,
		totalPages: 0,
		totalElements: 0,
	});
	const [activeSearch, setActiveSearch] = useState<{ query: string; type: SearchType }>({ query: '', type: 'posts' });
	const [searchResultsLoading, setSearchResultsLoading] = useState(false);
	const [searchResultsLoadingMore, setSearchResultsLoadingMore] = useState(false);
	const searchBoxRef = useRef<HTMLDivElement | null>(null);
	const viewedPostIdsRef = useRef<Set<string>>(new Set());
	const pendingViewTimersRef = useRef<Map<string, number>>(new Map());

	const isAuthenticated = Boolean(session?.accessToken);

	const setSession = (value: Session | null) => {
		writeSession(value);
		setSessionState(value);
		if (!value) {
			setProfile(null);
		}
	};

	useEffect(() => {
		const onPopState = () => setRoute(normalizePath(window.location.pathname));
		window.addEventListener('popstate', onPopState);
		return () => window.removeEventListener('popstate', onPopState);
	}, []);

	useEffect(() => {
		const onMouseDown = (event: MouseEvent) => {
			if (!searchBoxRef.current) {
				return;
			}
			if (!searchBoxRef.current.contains(event.target as Node)) {
				setSearchOpen(false);
			}
		};
		document.addEventListener('mousedown', onMouseDown);
		return () => document.removeEventListener('mousedown', onMouseDown);
	}, []);

	useEffect(() => {
		if ((route === '/app' || route === '/search') && !isAuthenticated) {
			navigate('/auth');
		}
	}, [route, isAuthenticated]);

	useEffect(() => {
		viewedPostIdsRef.current.clear();
		for (const timerId of pendingViewTimersRef.current.values()) {
			window.clearTimeout(timerId);
		}
		pendingViewTimersRef.current.clear();
	}, [session?.accessToken]);

	useEffect(() => {
		if (route !== '/app' && route !== '/search') {
			setSearchOpen(false);
		}
	}, [route]);

	const mergePosts = (current: PostResponse[], incoming: PostResponse[]): PostResponse[] => {
		const known = new Set(current.map((post) => post.id));
		const merged = [...current];
		for (const post of incoming) {
			if (!known.has(post.id)) {
				merged.push(post);
			}
		}
		return merged;
	};

	const loadFeedPage = async (page: number, append: boolean) => {
		if (!session) {
			return;
		}

		const response = await apiFetch(
			`/api/v1/posts/feed?page=${page}&size=${FEED_PAGE_SIZE}`,
			{ method: 'GET' },
			session,
			setSession,
		);

		if (!response.ok) {
			throw new Error('No se pudo cargar el feed.');
		}

		const payload = (await response.json()) as FeedResponse;
		setFeed((prev) => (append ? mergePosts(prev, payload.items) : payload.items));
		setFeedMeta({
			page: payload.page,
			totalPages: payload.totalPages,
			totalElements: payload.totalElements,
		});
	};

	const loadProfile = async () => {
		if (!session) {
			return;
		}
		const meRes = await apiFetch('/api/v1/auth/me', { method: 'GET' }, session, setSession);
		if (meRes.ok) {
			setProfile((await meRes.json()) as UserResponse);
			return;
		}
		throw new Error('No se pudo cargar el perfil.');
	};

	const loadProfileAndFeed = async () => {
		if (!session) {
			return;
		}
		setLoadingFeed(true);
		setError(null);
		try {
			await loadProfile();
			await loadFeedPage(0, false);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error inesperado');
		} finally {
			setLoadingFeed(false);
		}
	};

	const loadMorePosts = async () => {
		if (!session || loadingMore) {
			return;
		}
		if (feedMeta.totalPages === 0 || feedMeta.page + 1 >= feedMeta.totalPages) {
			return;
		}

		setLoadingMore(true);
		setError(null);
		try {
			await loadFeedPage(feedMeta.page + 1, true);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error inesperado');
		} finally {
			setLoadingMore(false);
		}
	};

	const loadSearchPage = async (
		query: string,
		type: SearchType,
		page: number,
		append: boolean,
	) => {
		if (!session) {
			return;
		}
		const response = await apiFetch(
			`/api/v1/search/results?q=${encodeURIComponent(query)}&type=${type}&page=${page}&size=${FEED_PAGE_SIZE}`,
			{ method: 'GET' },
			session,
			setSession,
		);
		if (!response.ok) {
			throw new Error('No se pudieron cargar resultados de búsqueda.');
		}
		const payload = (await response.json()) as SearchResultsPageResponse;
		setSearchResults((prev) => (append ? [...prev, ...payload.items] : payload.items));
		setSearchResultsMeta({
			page: payload.page,
			totalPages: payload.totalPages,
			totalElements: payload.totalElements,
		});
	};

	const openSearchResults = () => {
		const query = searchQuery.trim();
		if (!query) {
			return;
		}
		setActiveSearch({ query, type: searchType });
		setSearchOpen(false);
		navigate('/search');
	};

	const loadMoreSearchResults = async () => {
		if (!session || searchResultsLoadingMore) {
			return;
		}
		if (searchResultsMeta.totalPages === 0 || searchResultsMeta.page + 1 >= searchResultsMeta.totalPages) {
			return;
		}
		setSearchResultsLoadingMore(true);
		setError(null);
		try {
			await loadSearchPage(activeSearch.query, activeSearch.type, searchResultsMeta.page + 1, true);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error inesperado');
		} finally {
			setSearchResultsLoadingMore(false);
		}
	};

	const submitAuth = async (event: Event) => {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		const data = new FormData(form);
		const email = String(data.get('email') || '').trim();
		const password = String(data.get('password') || '');

		setError(null);
		setInfo(null);
		setLoadingAuth(true);
		try {
			const path = authMode === 'register' ? '/api/v1/auth/register' : '/api/v1/auth/login';
			const response = await fetch(`${API_BASE_URL}${path}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				const message = response.status === 400
					? 'Credenciales o formato inválido.'
					: response.status === 409
						? 'El email ya existe.'
						: 'No se pudo completar la operación.';
				throw new Error(message);
			}

			const payload = (await response.json()) as Session;
			setSession(payload);
			navigate('/app');
			setInfo(authMode === 'register' ? 'Registro completado.' : 'Login correcto.');
			form.reset();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error inesperado');
		} finally {
			setLoadingAuth(false);
		}
	};

	const submitNewPost = async (event: Event) => {
		event.preventDefault();
		if (!session || !postContent.trim()) {
			return;
		}
		setError(null);
		setInfo(null);
		setLoadingPost(true);
		try {
			const response = await apiFetch(
				'/api/v1/posts',
				{
					method: 'POST',
					body: JSON.stringify({ content: postContent.trim() }),
				},
				session,
				setSession,
			);
			if (!response.ok) {
				throw new Error('No se pudo crear el post.');
			}
			const created = (await response.json()) as PostResponse;
			setFeed((prev) => [created, ...prev]);
			setFeedMeta((prev) => ({ ...prev, totalElements: prev.totalElements + 1 }));
			setPostContent('');
			setInfo('Post publicado.');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error inesperado');
		} finally {
			setLoadingPost(false);
		}
	};

	useEffect(() => {
		if (route === '/app' && session) {
			void loadProfileAndFeed();
		}
	}, [route, session?.accessToken]);

	useEffect(() => {
		if (route === '/search' && session && !profile) {
			void loadProfile().catch(() => {
				// handled by auth/session flow if token is invalid
			});
		}
	}, [route, session?.accessToken, profile?.id]);

	useEffect(() => {
		if (route !== '/search' || !session || !activeSearch.query) {
			return;
		}
		setSearchResultsLoading(true);
		setError(null);
		void loadSearchPage(activeSearch.query, activeSearch.type, 0, false)
			.catch((err) => {
				setError(err instanceof Error ? err.message : 'Error inesperado');
			})
			.finally(() => setSearchResultsLoading(false));
	}, [route, session?.accessToken, activeSearch.query, activeSearch.type]);

	useEffect(() => {
		if ((route !== '/app' && route !== '/search') || !session) {
			return;
		}

		const query = searchQuery.trim();
		if (!query) {
			setSearchItems([]);
			setSearchLoading(false);
			return;
		}

		setSearchLoading(true);
		const timer = window.setTimeout(async () => {
			try {
				const response = await apiFetch(
					`/api/v1/search/suggestions?q=${encodeURIComponent(query)}&type=${searchType}&limit=10`,
					{ method: 'GET' },
					session,
					setSession,
				);
				if (!response.ok) {
					throw new Error('No se pudieron cargar sugerencias.');
				}
				const payload = (await response.json()) as SearchSuggestionsResponse;
				setSearchItems(payload.items);
				setSearchOpen(true);
			} catch {
				setSearchItems([]);
			} finally {
				setSearchLoading(false);
			}
		}, 240);

		return () => window.clearTimeout(timer);
	}, [route, session?.accessToken, searchQuery, searchType]);


	const updatePostStats = (stats: PostStatsResponse) => {
		setFeed((prev) =>
			prev.map((item) =>
				item.id === stats.postId
					? { ...item, likes: stats.likes, views: stats.views, comments: stats.comments }
					: item,
			),
		);
	};

	const updateSearchResultStats = (stats: PostStatsResponse) => {
		setSearchResults((prev) =>
			prev.map((item) =>
				item.id === stats.postId && item.kind === 'post'
					? { ...item, likes: stats.likes, views: stats.views, comments: stats.comments }
					: item,
			),
		);
	};

	const registerPostView = async (postId: string, silent = false) => {
		if (!session) {
			return;
		}
		const response = await apiFetch(`/api/v1/posts/${postId}/view`, { method: 'POST' }, session, setSession);
		if (!response.ok) {
			if (!silent) {
				setError('No se pudo registrar vista.');
			}
			return;
		}
		const stats = (await response.json()) as PostStatsResponse;
		updatePostStats(stats);
		updateSearchResultStats(stats);
	};

	const reactToPost = async (postId: string, action: 'view') => {
		if (action === 'view') {
			setError(null);
			await registerPostView(postId);
		}
	};

	const toggleLike = async (postId: string, likedByMe: boolean) => {
		if (!session) {
			return;
		}
		setError(null);
		const response = await apiFetch(
			`/api/v1/posts/${postId}/like`,
			{ method: likedByMe ? 'DELETE' : 'POST' },
			session,
			setSession,
		);
		if (!response.ok) {
			setError(`No se pudo ${likedByMe ? 'quitar el like' : 'dar like'}.`);
			return;
		}
		const stats = (await response.json()) as PostStatsResponse;
		updatePostStats(stats);
		updateSearchResultStats(stats);
		setFeed((prev) => prev.map((item) => (item.id === postId ? { ...item, likedByMe: !likedByMe } : item)));
		setSearchResults((prev) =>
			prev.map((item) =>
				item.id === postId && item.kind === 'post'
					? { ...item, likedByMe: !likedByMe }
					: item,
			),
		);
	};

	const submitComment = async (event: Event, postId: string) => {
		event.preventDefault();
		const content = (commentDrafts[postId] || '').trim();
		if (!session || !content) {
			return;
		}
		setError(null);
		const response = await apiFetch(
			`/api/v1/posts/${postId}/comments`,
			{
				method: 'POST',
				body: JSON.stringify({ content }),
			},
			session,
			setSession,
		);
		if (!response.ok) {
			setError('No se pudo comentar.');
			return;
		}
		setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
		setFeed((prev) =>
			prev.map((item) => (item.id === postId ? { ...item, comments: item.comments + 1 } : item)),
		);
		setInfo('Comentario enviado.');
	};

	const logout = () => {
		setSession(null);
		setSearchQuery('');
		setSearchItems([]);
		setSearchOpen(false);
		viewedPostIdsRef.current.clear();
		for (const timerId of pendingViewTimersRef.current.values()) {
			window.clearTimeout(timerId);
		}
		pendingViewTimersRef.current.clear();
		navigate('/');
	};

	const onSelectSuggestion = (item: SearchSuggestionItem) => {
		setSearchQuery(item.title);
		setSearchOpen(false);
		if (item.kind === 'post') {
			const element = document.getElementById(`post-${item.id}`);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth', block: 'center' });
			} else {
				setActiveSearch({ query: searchQuery.trim() || item.title, type: 'posts' });
				navigate('/search');
			}
			return;
		}
		setActiveSearch({ query: searchQuery.trim() || item.title, type: 'users' });
		navigate('/search');
	};

	const appTitle = useMemo(() => 'Springram by Stelut Tomoiaga', []);
	const handleBrandClick = () => {
		navigate(isAuthenticated ? '/app' : '/');
	};

	useEffect(() => {
		if (route !== '/app' || !session || feed.length === 0) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const target = entry.target as HTMLElement;
					const postId = target.dataset.feedPostId;
					if (!postId) {
						continue;
					}

					if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
						if (viewedPostIdsRef.current.has(postId) || pendingViewTimersRef.current.has(postId)) {
							continue;
						}
						const timerId = window.setTimeout(() => {
							pendingViewTimersRef.current.delete(postId);
							if (viewedPostIdsRef.current.has(postId)) {
								return;
							}
							viewedPostIdsRef.current.add(postId);
							void registerPostView(postId, true);
						}, 250);
						pendingViewTimersRef.current.set(postId, timerId);
						continue;
					}

					const timerId = pendingViewTimersRef.current.get(postId);
					if (timerId) {
						window.clearTimeout(timerId);
						pendingViewTimersRef.current.delete(postId);
					}
				}
			},
			{ threshold: [0.6] },
		);

		const elements = document.querySelectorAll<HTMLElement>('[data-feed-post-id]');
		elements.forEach((element) => observer.observe(element));

		return () => {
			observer.disconnect();
			for (const timerId of pendingViewTimersRef.current.values()) {
				window.clearTimeout(timerId);
			}
			pendingViewTimersRef.current.clear();
		};
	}, [route, session?.accessToken, feed]);

	return (
		<div class="shell">
			<header class="topbar">
				<button class="brand" onClick={handleBrandClick}>{appTitle}</button>
				{(route === '/app' || route === '/search') && isAuthenticated ? (
					<div class="search-box" ref={searchBoxRef}>
						<div class="search-controls">
							<select
								class="search-type"
								value={searchType}
								onChange={(event) => setSearchType((event.currentTarget as HTMLSelectElement).value as SearchType)}
							>
								<option value="posts">Posts</option>
								<option value="users">Usuarios</option>
							</select>
							<input
								class="search-input"
								value={searchQuery}
								placeholder={searchType === 'posts' ? 'Buscar posts...' : 'Buscar usuarios...'}
								onInput={(event) => setSearchQuery((event.currentTarget as HTMLInputElement).value)}
								onKeyDown={(event) => {
									if ((event as KeyboardEvent).key === 'Enter') {
										event.preventDefault();
										openSearchResults();
									}
								}}
								onFocus={() => {
									if (searchQuery.trim()) {
										setSearchOpen(true);
									}
								}}
							/>
						</div>
						{searchOpen ? (
							<div class="search-dropdown">
								{searchLoading ? (
									<div class="search-status muted">Buscando...</div>
								) : searchItems.length === 0 ? (
									<div class="search-status muted">Sin sugerencias</div>
								) : (
									searchItems.map((item) => (
										<button
											key={`${item.kind}-${item.id}`}
											type="button"
											class="search-item"
											onClick={() => onSelectSuggestion(item)}
										>
											<span class={item.kind === 'post' ? 'search-avatar avatar-post' : 'search-avatar avatar-user'}>
												{toSuggestionInitial(item)}
											</span>
											<span class="search-copy">
												<strong>{item.title}</strong>
												{item.subtitle ? <small>{item.subtitle}</small> : null}
											</span>
										</button>
									))
								)}
								{searchQuery.trim() ? (
									<button type="button" class="search-more" onClick={openSearchResults}>
										Ver más resultados
									</button>
								) : null}
							</div>
						) : null}
					</div>
				) : null}
				{(route === '/app' || route === '/search') && profile ? (
					<div class="profile-panel">
						<span>{profile.email}</span>
						<button class="ghost with-icon" onClick={logout}>
							<span class="material-symbols-rounded ui-icon" aria-hidden="true">exit_to_app</span>
							Salir
						</button>
					</div>
				) : (
					<nav class="top-actions">
						<button class="ghost" onClick={() => navigate('/auth')}>Registro / Login</button>
					</nav>
				)}
			</header>

			<main class="content">
				{route === '/' && (
					<section class="hero-card">
						<p class="kicker">Backend social con Spring Boot 4</p>
						<h1>{appTitle}</h1>
						<p>
							Demo full-stack para aprender arquitectura real de API REST social: Spring Boot, JWT,
							Flyway, PostgreSQL (Neon), Redis, Kafka, Docker Compose y observabilidad con Actuator/Micrometer.
						</p>
						<div class="stack-grid">
							<span>Spring Security + JWT</span>
							<span>Flyway + PostgreSQL</span>
							<span>Redis cache</span>
							<span>Kafka eventos async</span>
							<span>Docker/Compose</span>
							<span>OpenAPI + Metrics</span>
						</div>
						<div class="cta-row">
							<button class="solid" onClick={() => { setAuthMode('register'); navigate('/auth'); }}>Crear cuenta</button>
							<button class="ghost" onClick={() => { setAuthMode('login'); navigate('/auth'); }}>Iniciar sesión</button>
						</div>
					</section>
				)}

				{route === '/auth' && (
					<section class="panel auth-panel">
						<h2>{authMode === 'register' ? 'Registro' : 'Login'}</h2>
						<p class="muted">Conexión API: <code>{API_BASE_URL}</code></p>
						<div class="mode-row">
							<button class={authMode === 'register' ? 'tab active' : 'tab'} onClick={() => setAuthMode('register')}>Registro</button>
							<button class={authMode === 'login' ? 'tab active' : 'tab'} onClick={() => setAuthMode('login')}>Login</button>
						</div>
						<form class="auth-form" onSubmit={submitAuth}>
							<label>
								Email
								<input name="email" type="email" required placeholder="name@domain.com" />
							</label>
							<label>
								Password
								<input name="password" type="password" required minLength={8} placeholder="Password123!" />
							</label>
							<button class="solid with-loader" disabled={loadingAuth} type="submit">
								{loadingAuth ? (
									<>
										<span class="spinner" aria-hidden="true" />
										Procesando...
									</>
								) : authMode === 'register' ? 'Registrarse' : 'Entrar'}
							</button>
						</form>
					</section>
				)}

				{route === '/search' && (
					<section class="panel app-panel">
							<div class="search-results-head">
								<h2>Resultados</h2>
								<p class="muted">
									{activeSearch.type === 'posts' ? 'Posts' : 'Usuarios'} para "<strong>{activeSearch.query}</strong>" · {searchResultsMeta.totalElements}
								</p>
							<button class="ghost" onClick={() => navigate('/app')}>Volver al feed</button>
						</div>

						{searchResultsLoading ? (
							<p class="muted loading-line">
								<span class="spinner" aria-hidden="true" /> Cargando resultados...
							</p>
						) : null}

						{!searchResultsLoading && searchResults.length === 0 ? (
							<p class="muted search-empty">No hay resultados para esa búsqueda.</p>
						) : null}

						<div class="feed-list">
							{searchResults.map((item) => (
								item.kind === 'post' ? (
									<article class="post" key={`search-${item.kind}-${item.id}`} id={`post-${item.id}`}>
										<div class="post-layout">
											<div class="avatar">{toAvatarInitial(item.secondaryText)}</div>
											<div class="post-main">
												<div class="post-head">
													<strong>{item.secondaryText}</strong>
													<span class="handle">@{toHandle(item.secondaryText)}</span>
													<span class="separator">·</span>
													<time>{toRelativeTime(item.createdAt)}</time>
												</div>
												<p class="post-text">{item.primaryText}</p>
												<div class="post-actions">
													<div class="action-item neutral">
														<span class="material-symbols-rounded action-icon" aria-hidden="true">comment</span>
														<span>{item.comments}</span>
													</div>
													<button
														class={item.likedByMe ? 'action-item liked' : 'action-item neutral'}
														onClick={() => void toggleLike(item.id, item.likedByMe)}
														aria-label={item.likedByMe ? 'Quitar like' : 'Dar like'}
													>
														<span class={item.likedByMe ? 'material-symbols-rounded action-icon filled-icon' : 'material-symbols-rounded action-icon'} aria-hidden="true">favorite</span>
														<span>{item.likes}</span>
													</button>
													<button
														class="action-item neutral"
														onClick={() => void reactToPost(item.id, 'view')}
														aria-label="Registrar vista"
													>
														<span class="material-symbols-rounded action-icon" aria-hidden="true">visibility</span>
														<span>{item.views}</span>
													</button>
												</div>
											</div>
										</div>
									</article>
								) : (
									<article class="post user-result" key={`search-${item.kind}-${item.id}`}>
										<div class="post-layout">
											<div class="avatar">{toAvatarInitial(item.primaryText)}</div>
											<div class="post-main">
												<div class="post-head">
													<strong>{item.primaryText}</strong>
													<span class="handle">{item.secondaryText}</span>
													<span class="separator">·</span>
													<time>{toRelativeTime(item.createdAt)}</time>
												</div>
												<div class="stats-row user-stats-row">
													<span>Posts: {item.posts}</span>
													<span>Likes: {item.likes}</span>
													<span>Comments: {item.comments}</span>
													<span>Views: {item.views}</span>
												</div>
											</div>
										</div>
									</article>
								)
							))}
						</div>

						{searchResultsMeta.page + 1 < searchResultsMeta.totalPages ? (
							<div class="load-more-wrap">
								<button class="ghost with-loader" onClick={() => void loadMoreSearchResults()} disabled={searchResultsLoadingMore}>
									{searchResultsLoadingMore ? (
										<>
											<span class="spinner" aria-hidden="true" />
											Cargando más...
										</>
									) : 'Más resultados'}
								</button>
							</div>
						) : null}
					</section>
				)}

				{route === '/app' && (
					<section class="panel app-panel">
						<h2>Feed</h2>
						<p class="muted">Publicaciones: {feedMeta.totalElements}</p>

						<form class="composer" onSubmit={submitNewPost}>
							<textarea
								value={postContent}
								onInput={(e) => setPostContent((e.currentTarget as HTMLTextAreaElement).value)}
								placeholder="Comparte algo en Springram..."
								maxLength={4000}
								required
							/>
							<button class="solid with-loader" type="submit" disabled={loadingPost}>
								{loadingPost ? (
									<>
										<span class="spinner" aria-hidden="true" />
										Publicando...
									</>
								) : 'Publicar'}
							</button>
						</form>

						{loadingFeed ? (
							<p class="muted loading-line">
								<span class="spinner" aria-hidden="true" /> Cargando feed...
							</p>
						) : null}
						{!loadingFeed && feed.length === 0 ? (
							<p class="muted">No hay posts todavía. Crea uno o carga seed con `scripts/main.py`.</p>
						) : null}

						<div class="feed-list">
							{feed.map((post) => (
								<article class="post" key={post.id} id={`post-${post.id}`} data-feed-post-id={post.id}>
									<div class="post-layout">
										<div class="avatar">{toAvatarInitial(post.authorDisplayName)}</div>
										<div class="post-main">
											<div class="post-head">
												<strong>{post.authorDisplayName}</strong>
												<span class="handle">@{toHandle(post.authorDisplayName)}</span>
												<span class="separator">·</span>
												<time>{toRelativeTime(post.createdAt)}</time>
											</div>
											<p class="post-text">{post.content}</p>
											<div class="post-actions">
												<div class="action-item neutral">
													<span class="material-symbols-rounded action-icon" aria-hidden="true">comment</span>
													<span>{post.comments}</span>
												</div>
												<button
													class={post.likedByMe ? 'action-item liked' : 'action-item neutral'}
													onClick={() => void toggleLike(post.id, post.likedByMe)}
													aria-label={post.likedByMe ? 'Quitar like' : 'Dar like'}
												>
													<span class={post.likedByMe ? 'material-symbols-rounded action-icon filled-icon' : 'material-symbols-rounded action-icon'} aria-hidden="true">favorite</span>
													<span>{post.likes}</span>
												</button>
												<div class="action-item neutral" aria-label="Vistas">
													<span class="material-symbols-rounded action-icon" aria-hidden="true">visibility</span>
													<span>{post.views}</span>
												</div>
											</div>
										</div>
									</div>
									<form class="comment-form" onSubmit={(e) => void submitComment(e, post.id)}>
										<input
											placeholder="Comentar..."
											maxLength={2000}
											value={commentDrafts[post.id] || ''}
											onInput={(e) => {
												const value = (e.currentTarget as HTMLInputElement).value;
												setCommentDrafts((prev) => ({ ...prev, [post.id]: value }));
											}}
										/>
										<button class="solid" type="submit">Enviar</button>
									</form>
								</article>
							))}
						</div>

						{feedMeta.page + 1 < feedMeta.totalPages ? (
							<div class="load-more-wrap">
								<button class="ghost with-loader" onClick={() => void loadMorePosts()} disabled={loadingMore}>
									{loadingMore ? (
										<>
											<span class="spinner" aria-hidden="true" />
											Cargando más...
										</>
									) : 'Más posts'}
								</button>
							</div>
						) : null}
					</section>
				)}

				{info ? <p class="info">{info}</p> : null}
				{error ? <p class="error">{error}</p> : null}
			</main>
		</div>
	);
}

render(<App />, document.getElementById('app')!);
