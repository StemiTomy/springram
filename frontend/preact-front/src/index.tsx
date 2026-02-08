import { render } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import './style.css';

type RoutePath = '/' | '/auth' | '/app' | '/search' | '/status' | '/profile';
type Language = 'es' | 'en';

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
	preferredLanguage: string;
};

type LanguagePreferenceResponse = {
	language: string;
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

type ReadinessResponse = {
	status: string;
	components?: Record<string, { status: string }>;
};

type Session = AuthResponse;

type Messages = {
	loginRegister: string;
	searchPosts: string;
	searchUsers: string;
	searchPlaceholderPosts: string;
	searchPlaceholderUsers: string;
	searching: string;
	searchNoSuggestions: string;
	searchShowMore: string;
	landingKicker: string;
	landingDescription: string;
	createAccount: string;
	signIn: string;
	registerTitle: string;
	loginTitle: string;
	apiConnection: string;
	email: string;
	password: string;
	processing: string;
	registerButton: string;
	loginButton: string;
	feedTitle: string;
	postsCount: string;
	composerPlaceholder: string;
	publishing: string;
	publish: string;
	loadingFeed: string;
	emptyFeed: string;
	commentPlaceholder: string;
	send: string;
	loadMorePosts: string;
	loadingMore: string;
	searchResultsTitle: string;
	searchResultsFor: string;
	backToFeed: string;
	loadingResults: string;
	emptyResults: string;
	loadMoreResults: string;
	statusTitle: string;
	statusDescription: string;
	statusChecking: string;
	statusOkTitle: string;
	statusOkDescription: string;
	statusFailTitle: string;
	statusFailDescription: string;
	checkAgain: string;
	profileTitle: string;
	profileDescription: string;
	profileLanguageLabel: string;
	saveLanguage: string;
	savingLanguage: string;
	logout: string;
	openProfile: string;
	view: string;
	like: string;
	unlike: string;
	comment: string;
	registerSuccess: string;
	loginSuccess: string;
	postPublished: string;
	commentSent: string;
	languageUpdated: string;
	authInvalid: string;
	authConflict: string;
	authFailed: string;
	feedFailed: string;
	profileFailed: string;
	createPostFailed: string;
	commentFailed: string;
	likeFailed: string;
	unlikeFailed: string;
	searchFailed: string;
	viewFailed: string;
	statusButton: string;
	statusEndpointLabel: string;
	statusRequestFailed: string;
	statsPosts: string;
	statsLikes: string;
	statsComments: string;
	statsViews: string;
};

const I18N: Record<Language, Messages> = {
	es: {
		loginRegister: 'Registro / Login',
		searchPosts: 'Posts',
		searchUsers: 'Usuarios',
		searchPlaceholderPosts: 'Buscar posts...',
		searchPlaceholderUsers: 'Buscar usuarios...',
		searching: 'Buscando...',
		searchNoSuggestions: 'Sin sugerencias',
		searchShowMore: 'Ver más resultados',
		landingKicker: 'Backend social con Spring Boot 4',
		landingDescription:
			'Demo full-stack para aprender arquitectura real de API REST social: Spring Boot, JWT, Flyway, PostgreSQL (Neon), Redis, Kafka, Docker Compose y observabilidad con Actuator/Micrometer.',
		createAccount: 'Crear cuenta',
		signIn: 'Iniciar sesión',
		registerTitle: 'Registro',
		loginTitle: 'Login',
		apiConnection: 'Conexión API',
		email: 'Email',
		password: 'Password',
		processing: 'Procesando...',
		registerButton: 'Registrarse',
		loginButton: 'Entrar',
		feedTitle: 'Feed',
		postsCount: 'Publicaciones',
		composerPlaceholder: 'Comparte algo en Springram...',
		publishing: 'Publicando...',
		publish: 'Publicar',
		loadingFeed: 'Cargando feed...',
		emptyFeed: 'No hay posts todavía. Crea uno o carga seed con scripts/main.py.',
		commentPlaceholder: 'Comentar...',
		send: 'Enviar',
		loadMorePosts: 'Más posts',
		loadingMore: 'Cargando más...',
		searchResultsTitle: 'Resultados',
		searchResultsFor: 'para',
		backToFeed: 'Volver al feed',
		loadingResults: 'Cargando resultados...',
		emptyResults: 'No hay resultados para esa búsqueda.',
		loadMoreResults: 'Más resultados',
		statusTitle: 'Estado del servicio',
		statusDescription: 'Comprobación de readiness del backend.',
		statusChecking: 'Comprobando estado...',
		statusOkTitle: 'Servicio operativo',
		statusOkDescription: 'Readiness en UP. El backend está listo para atender tráfico.',
		statusFailTitle: 'Estamos revisando el servicio',
		statusFailDescription: 'Readiness no está en UP o no responde. Lo estamos mirando.',
		checkAgain: 'Comprobar otra vez',
		profileTitle: 'Perfil',
		profileDescription: 'Gestiona tu idioma preferido para la interfaz.',
		profileLanguageLabel: 'Idioma preferido',
		saveLanguage: 'Guardar idioma',
		savingLanguage: 'Guardando...',
		logout: 'Salir',
		openProfile: 'Abrir perfil',
		view: 'Vista',
		like: 'Dar like',
		unlike: 'Quitar like',
		comment: 'Comentar',
		registerSuccess: 'Registro completado.',
		loginSuccess: 'Login correcto.',
		postPublished: 'Post publicado.',
		commentSent: 'Comentario enviado.',
		languageUpdated: 'Idioma actualizado.',
		authInvalid: 'Credenciales o formato inválido.',
		authConflict: 'El email ya existe.',
		authFailed: 'No se pudo completar la operación.',
		feedFailed: 'No se pudo cargar el feed.',
		profileFailed: 'No se pudo cargar el perfil.',
		createPostFailed: 'No se pudo crear el post.',
		commentFailed: 'No se pudo comentar.',
		likeFailed: 'No se pudo dar like.',
		unlikeFailed: 'No se pudo quitar el like.',
		searchFailed: 'No se pudieron cargar resultados de búsqueda.',
		viewFailed: 'No se pudo registrar vista.',
		statusButton: 'Status',
		statusEndpointLabel: 'Endpoint',
		statusRequestFailed: 'No se pudo consultar el endpoint de readiness.',
		statsPosts: 'Posts',
		statsLikes: 'Likes',
		statsComments: 'Comentarios',
		statsViews: 'Vistas',
	},
	en: {
		loginRegister: 'Register / Login',
		searchPosts: 'Posts',
		searchUsers: 'Users',
		searchPlaceholderPosts: 'Search posts...',
		searchPlaceholderUsers: 'Search users...',
		searching: 'Searching...',
		searchNoSuggestions: 'No suggestions',
		searchShowMore: 'See more results',
		landingKicker: 'Social backend with Spring Boot 4',
		landingDescription:
			'Full-stack demo to learn real social REST API architecture: Spring Boot, JWT, Flyway, PostgreSQL (Neon), Redis, Kafka, Docker Compose, and observability with Actuator/Micrometer.',
		createAccount: 'Create account',
		signIn: 'Sign in',
		registerTitle: 'Register',
		loginTitle: 'Login',
		apiConnection: 'API connection',
		email: 'Email',
		password: 'Password',
		processing: 'Processing...',
		registerButton: 'Register',
		loginButton: 'Sign in',
		feedTitle: 'Feed',
		postsCount: 'Posts',
		composerPlaceholder: 'Share something on Springram...',
		publishing: 'Publishing...',
		publish: 'Publish',
		loadingFeed: 'Loading feed...',
		emptyFeed: 'No posts yet. Create one or run seed with scripts/main.py.',
		commentPlaceholder: 'Comment...',
		send: 'Send',
		loadMorePosts: 'More posts',
		loadingMore: 'Loading more...',
		searchResultsTitle: 'Results',
		searchResultsFor: 'for',
		backToFeed: 'Back to feed',
		loadingResults: 'Loading results...',
		emptyResults: 'No results for this query.',
		loadMoreResults: 'More results',
		statusTitle: 'Service status',
		statusDescription: 'Backend readiness check.',
		statusChecking: 'Checking status...',
		statusOkTitle: 'Service is up',
		statusOkDescription: 'Readiness is UP. Backend is ready to serve traffic.',
		statusFailTitle: 'We are investigating service status',
		statusFailDescription: 'Readiness is not UP or is unreachable. We are checking it.',
		checkAgain: 'Check again',
		profileTitle: 'Profile',
		profileDescription: 'Manage your preferred interface language.',
		profileLanguageLabel: 'Preferred language',
		saveLanguage: 'Save language',
		savingLanguage: 'Saving...',
		logout: 'Logout',
		openProfile: 'Open profile',
		view: 'View',
		like: 'Like',
		unlike: 'Unlike',
		comment: 'Comment',
		registerSuccess: 'Registration completed.',
		loginSuccess: 'Login successful.',
		postPublished: 'Post published.',
		commentSent: 'Comment posted.',
		languageUpdated: 'Language updated.',
		authInvalid: 'Invalid credentials or format.',
		authConflict: 'Email already exists.',
		authFailed: 'Operation could not be completed.',
		feedFailed: 'Could not load feed.',
		profileFailed: 'Could not load profile.',
		createPostFailed: 'Could not create post.',
		commentFailed: 'Could not post comment.',
		likeFailed: 'Could not like post.',
		unlikeFailed: 'Could not unlike post.',
		searchFailed: 'Could not load search results.',
		viewFailed: 'Could not register view.',
		statusButton: 'Status',
		statusEndpointLabel: 'Endpoint',
		statusRequestFailed: 'Could not query readiness endpoint.',
		statsPosts: 'Posts',
		statsLikes: 'Likes',
		statsComments: 'Comments',
		statsViews: 'Views',
	},
};

const SESSION_KEY = 'springram_session_v1';
const LANGUAGE_KEY = 'springram_language_v1';
const FEED_PAGE_SIZE = 20;
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8080';
const READINESS_ENDPOINT = `${API_BASE_URL}/actuator/health/readiness`;

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
	if (pathname === '/status') {
		return '/status';
	}
	if (pathname === '/profile') {
		return '/profile';
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

function normalizeLanguage(value?: string): Language {
	return (value || '').trim().toLowerCase() === 'en' ? 'en' : 'es';
}

function readLanguage(): Language {
	const raw = window.localStorage.getItem(LANGUAGE_KEY);
	return normalizeLanguage(raw || 'es');
}

function writeLanguage(language: Language): void {
	window.localStorage.setItem(LANGUAGE_KEY, language);
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
	const [language, setLanguageState] = useState<Language>(readLanguage());
	const [profile, setProfile] = useState<UserResponse | null>(null);
	const [profileLanguageDraft, setProfileLanguageDraft] = useState<Language>('es');
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
	const [loadingLanguageSave, setLoadingLanguageSave] = useState(false);
	const [statusLoading, setStatusLoading] = useState(false);
	const [statusResponse, setStatusResponse] = useState<ReadinessResponse | null>(null);
	const [statusError, setStatusError] = useState<string | null>(null);
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
	const t = I18N[language];

	const setSession = (value: Session | null) => {
		writeSession(value);
		setSessionState(value);
		if (!value) {
			setProfile(null);
		}
	};

	const setLanguage = (value: Language) => {
		writeLanguage(value);
		setLanguageState(value);
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
		if ((route === '/app' || route === '/search' || route === '/profile') && !isAuthenticated) {
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
			throw new Error(t.feedFailed);
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
			const user = (await meRes.json()) as UserResponse;
			const preferredLanguage = normalizeLanguage(user.preferredLanguage);
			setProfile(user);
			setProfileLanguageDraft(preferredLanguage);
			setLanguage(preferredLanguage);
			return;
		}
		throw new Error(t.profileFailed);
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
			setError(err instanceof Error ? err.message : t.feedFailed);
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
			setError(err instanceof Error ? err.message : t.feedFailed);
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
			throw new Error(t.searchFailed);
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
			setError(err instanceof Error ? err.message : t.searchFailed);
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
					? t.authInvalid
					: response.status === 409
						? t.authConflict
						: t.authFailed;
				throw new Error(message);
			}

			const payload = (await response.json()) as Session;
			setSession(payload);
			navigate('/app');
			setInfo(authMode === 'register' ? t.registerSuccess : t.loginSuccess);
			form.reset();
		} catch (err) {
			setError(err instanceof Error ? err.message : t.authFailed);
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
				throw new Error(t.createPostFailed);
			}
			const created = (await response.json()) as PostResponse;
			setFeed((prev) => [created, ...prev]);
			setFeedMeta((prev) => ({ ...prev, totalElements: prev.totalElements + 1 }));
			setPostContent('');
			setInfo(t.postPublished);
		} catch (err) {
			setError(err instanceof Error ? err.message : t.createPostFailed);
		} finally {
			setLoadingPost(false);
		}
	};

	const checkReadiness = async () => {
		setStatusLoading(true);
		setStatusError(null);
		try {
			const response = await fetch(READINESS_ENDPOINT, { method: 'GET' });
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			const payload = (await response.json()) as ReadinessResponse;
			setStatusResponse(payload);
		} catch (err) {
			setStatusResponse(null);
			setStatusError(err instanceof Error ? err.message : t.statusRequestFailed);
		} finally {
			setStatusLoading(false);
		}
	};

	const savePreferredLanguage = async () => {
		if (!session || !profile) {
			return;
		}
		setLoadingLanguageSave(true);
		setError(null);
		setInfo(null);
		try {
			const response = await apiFetch(
				'/api/v1/auth/preferences/language',
				{
					method: 'PUT',
					body: JSON.stringify({ language: profileLanguageDraft }),
				},
				session,
				setSession,
			);
			if (!response.ok) {
				throw new Error(t.authFailed);
			}
			const payload = (await response.json()) as LanguagePreferenceResponse;
			const updated = normalizeLanguage(payload.language);
			setLanguage(updated);
			setProfile((prev) => (prev ? { ...prev, preferredLanguage: updated } : prev));
			setInfo(t.languageUpdated);
		} catch (err) {
			setError(err instanceof Error ? err.message : t.authFailed);
		} finally {
			setLoadingLanguageSave(false);
		}
	};

	useEffect(() => {
		if (route === '/app' && session) {
			void loadProfileAndFeed();
		}
	}, [route, session?.accessToken]);

	useEffect(() => {
		if ((route === '/search' || route === '/profile') && session && !profile) {
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
				setError(err instanceof Error ? err.message : t.searchFailed);
			})
			.finally(() => setSearchResultsLoading(false));
	}, [route, session?.accessToken, activeSearch.query, activeSearch.type]);

	useEffect(() => {
		if (route !== '/status') {
			return;
		}
		void checkReadiness();
	}, [route]);

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
					throw new Error(t.searchFailed);
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
				setError(t.viewFailed);
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
			setError(likedByMe ? t.unlikeFailed : t.likeFailed);
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
			setError(t.commentFailed);
			return;
		}
		setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
		setFeed((prev) =>
			prev.map((item) => (item.id === postId ? { ...item, comments: item.comments + 1 } : item)),
		);
		setInfo(t.commentSent);
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

	const statusIsUp = statusResponse?.status === 'UP';

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
								<option value="posts">{t.searchPosts}</option>
								<option value="users">{t.searchUsers}</option>
							</select>
							<input
								class="search-input"
								value={searchQuery}
								placeholder={searchType === 'posts' ? t.searchPlaceholderPosts : t.searchPlaceholderUsers}
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
									<div class="search-status muted">{t.searching}</div>
								) : searchItems.length === 0 ? (
									<div class="search-status muted">{t.searchNoSuggestions}</div>
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
										{t.searchShowMore}
									</button>
								) : null}
							</div>
						) : null}
					</div>
				) : null}
				{isAuthenticated ? (
					<div class="profile-panel">
						<button class="ghost" onClick={() => navigate('/status')}>{t.statusButton}</button>
						<button class="ghost icon-only" onClick={() => navigate('/profile')} aria-label={t.openProfile}>
							<span class="material-symbols-rounded ui-icon" aria-hidden="true">account_circle</span>
						</button>
						<button class="ghost with-icon" onClick={logout}>
							<span class="material-symbols-rounded ui-icon" aria-hidden="true">exit_to_app</span>
							{t.logout}
						</button>
					</div>
				) : (
					<nav class="top-actions">
						<select
							class="language-switch"
							value={language}
							onChange={(event) => setLanguage((event.currentTarget as HTMLSelectElement).value as Language)}
						>
							<option value="es">ES</option>
							<option value="en">EN</option>
						</select>
						<button class="ghost" onClick={() => navigate('/status')}>{t.statusButton}</button>
						<button class="ghost" onClick={() => navigate('/auth')}>{t.loginRegister}</button>
					</nav>
				)}
			</header>

			<main class="content">
				{route === '/' && (
					<section class="hero-card">
						<p class="kicker">{t.landingKicker}</p>
						<h1>{appTitle}</h1>
						<p>{t.landingDescription}</p>
						<div class="stack-grid">
							<span>Spring Security + JWT</span>
							<span>Flyway + PostgreSQL</span>
							<span>Redis cache</span>
							<span>Kafka eventos async</span>
							<span>Docker/Compose</span>
							<span>OpenAPI + Metrics</span>
						</div>
						<div class="cta-row">
							<button class="solid" onClick={() => { setAuthMode('register'); navigate('/auth'); }}>{t.createAccount}</button>
							<button class="ghost" onClick={() => { setAuthMode('login'); navigate('/auth'); }}>{t.signIn}</button>
						</div>
					</section>
				)}

				{route === '/status' && (
					<section class="panel status-panel">
						<h2>{t.statusTitle}</h2>
						<p class="muted">{t.statusDescription}</p>
						<p class="muted"><strong>{t.statusEndpointLabel}:</strong> <code>{READINESS_ENDPOINT}</code></p>
						<div class={statusIsUp ? 'status-card status-ok' : 'status-card status-fail'}>
							{statusLoading ? (
								<p class="muted loading-line">
									<span class="spinner" aria-hidden="true" /> {t.statusChecking}
								</p>
							) : statusIsUp ? (
								<div class="status-copy">
									<p class="status-title">
										<span class="material-symbols-rounded ui-icon" aria-hidden="true">check_circle</span>
										{t.statusOkTitle}
									</p>
									<p class="muted">{t.statusOkDescription}</p>
									<p class="muted"><code>{JSON.stringify(statusResponse)}</code></p>
								</div>
							) : (
								<div class="status-copy">
									<p class="status-title">
										<span class="material-symbols-rounded ui-icon" aria-hidden="true">error</span>
										{t.statusFailTitle}
									</p>
									<p class="muted">{t.statusFailDescription}</p>
									{statusError ? <p class="muted"><code>{statusError}</code></p> : null}
									{statusResponse ? <p class="muted"><code>{JSON.stringify(statusResponse)}</code></p> : null}
								</div>
							)}
						</div>
						<div class="cta-row">
							<button class="solid" onClick={() => void checkReadiness()}>{t.checkAgain}</button>
							{isAuthenticated ? <button class="ghost" onClick={() => navigate('/app')}>{t.backToFeed}</button> : null}
						</div>
					</section>
				)}

				{route === '/auth' && (
					<section class="panel auth-panel">
						<h2>{authMode === 'register' ? t.registerTitle : t.loginTitle}</h2>
						<p class="muted">{t.apiConnection}: <code>{API_BASE_URL}</code></p>
						<div class="mode-row">
							<button class={authMode === 'register' ? 'tab active' : 'tab'} onClick={() => setAuthMode('register')}>{t.registerTitle}</button>
							<button class={authMode === 'login' ? 'tab active' : 'tab'} onClick={() => setAuthMode('login')}>{t.loginTitle}</button>
						</div>
						<form class="auth-form" onSubmit={submitAuth}>
							<label>
								{t.email}
								<input name="email" type="email" required placeholder="name@domain.com" />
							</label>
							<label>
								{t.password}
								<input name="password" type="password" required minLength={8} placeholder="Password123!" />
							</label>
							<button class="solid with-loader" disabled={loadingAuth} type="submit">
								{loadingAuth ? (
									<>
										<span class="spinner" aria-hidden="true" />
										{t.processing}
									</>
								) : authMode === 'register' ? t.registerButton : t.loginButton}
							</button>
						</form>
					</section>
				)}

				{route === '/profile' && profile && (
					<section class="panel profile-page">
						<div class="profile-head">
							<span class="material-symbols-rounded profile-icon" aria-hidden="true">account_circle</span>
							<div>
								<h2>{t.profileTitle}</h2>
								<p class="muted">{t.profileDescription}</p>
								<p class="muted"><strong>{profile.email}</strong></p>
							</div>
						</div>
						<div class="profile-form">
							<label>
								{t.profileLanguageLabel}
								<select
									value={profileLanguageDraft}
									onChange={(event) => setProfileLanguageDraft((event.currentTarget as HTMLSelectElement).value as Language)}
								>
									<option value="es">Espanol (ES)</option>
									<option value="en">English (EN)</option>
								</select>
							</label>
							<div class="cta-row">
								<button class="solid with-loader" disabled={loadingLanguageSave} onClick={() => void savePreferredLanguage()}>
									{loadingLanguageSave ? (
										<>
											<span class="spinner" aria-hidden="true" />
											{t.savingLanguage}
										</>
									) : t.saveLanguage}
								</button>
								<button class="ghost" onClick={() => navigate('/app')}>{t.backToFeed}</button>
							</div>
						</div>
					</section>
				)}

				{route === '/search' && (
					<section class="panel app-panel">
						<div class="search-results-head">
							<h2>{t.searchResultsTitle}</h2>
							<p class="muted">
								{activeSearch.type === 'posts' ? t.searchPosts : t.searchUsers} {t.searchResultsFor} "<strong>{activeSearch.query}</strong>" · {searchResultsMeta.totalElements}
							</p>
							<button class="ghost" onClick={() => navigate('/app')}>{t.backToFeed}</button>
						</div>

						{searchResultsLoading ? (
							<p class="muted loading-line">
								<span class="spinner" aria-hidden="true" /> {t.loadingResults}
							</p>
						) : null}

						{!searchResultsLoading && searchResults.length === 0 ? (
							<p class="muted search-empty">{t.emptyResults}</p>
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
														aria-label={item.likedByMe ? t.unlike : t.like}
													>
														<span class={item.likedByMe ? 'material-symbols-rounded action-icon filled-icon' : 'material-symbols-rounded action-icon'} aria-hidden="true">favorite</span>
														<span>{item.likes}</span>
													</button>
													<button
														class="action-item neutral"
														onClick={() => void reactToPost(item.id, 'view')}
														aria-label={t.view}
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
													<span>{t.statsPosts}: {item.posts}</span>
													<span>{t.statsLikes}: {item.likes}</span>
													<span>{t.statsComments}: {item.comments}</span>
													<span>{t.statsViews}: {item.views}</span>
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
											{t.loadingMore}
										</>
									) : t.loadMoreResults}
								</button>
							</div>
						) : null}
					</section>
				)}

				{route === '/app' && (
					<section class="panel app-panel">
						<h2>{t.feedTitle}</h2>
						<p class="muted">{t.postsCount}: {feedMeta.totalElements}</p>

						<form class="composer" onSubmit={submitNewPost}>
							<textarea
								value={postContent}
								onInput={(e) => setPostContent((e.currentTarget as HTMLTextAreaElement).value)}
								placeholder={t.composerPlaceholder}
								maxLength={4000}
								required
							/>
							<button class="solid with-loader" type="submit" disabled={loadingPost}>
								{loadingPost ? (
									<>
										<span class="spinner" aria-hidden="true" />
										{t.publishing}
									</>
								) : t.publish}
							</button>
						</form>

						{loadingFeed ? (
							<p class="muted loading-line">
								<span class="spinner" aria-hidden="true" /> {t.loadingFeed}
							</p>
						) : null}
						{!loadingFeed && feed.length === 0 ? (
							<p class="muted">{t.emptyFeed}</p>
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
												<div class="action-item neutral" aria-label={t.comment}>
													<span class="material-symbols-rounded action-icon" aria-hidden="true">comment</span>
													<span>{post.comments}</span>
												</div>
												<button
													class={post.likedByMe ? 'action-item liked' : 'action-item neutral'}
													onClick={() => void toggleLike(post.id, post.likedByMe)}
													aria-label={post.likedByMe ? t.unlike : t.like}
												>
													<span class={post.likedByMe ? 'material-symbols-rounded action-icon filled-icon' : 'material-symbols-rounded action-icon'} aria-hidden="true">favorite</span>
													<span>{post.likes}</span>
												</button>
												<div class="action-item neutral" aria-label={t.view}>
													<span class="material-symbols-rounded action-icon" aria-hidden="true">visibility</span>
													<span>{post.views}</span>
												</div>
											</div>
										</div>
									</div>
									<form class="comment-form" onSubmit={(e) => void submitComment(e, post.id)}>
										<input
											placeholder={t.commentPlaceholder}
											maxLength={2000}
											value={commentDrafts[post.id] || ''}
											onInput={(e) => {
												const value = (e.currentTarget as HTMLInputElement).value;
												setCommentDrafts((prev) => ({ ...prev, [post.id]: value }));
											}}
										/>
										<button class="solid" type="submit">{t.send}</button>
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
											{t.loadingMore}
										</>
									) : t.loadMorePosts}
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
