import { render } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Filler,
	Legend,
	LineElement,
	LinearScale,
	PointElement,
	Tooltip as ChartTooltip,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

import './style.css';

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ChartTooltip,
	Legend,
	Filler,
);

type RoutePath = '/' | '/auth' | '/app' | '/search' | '/status' | '/profile' | '/summary' | '/post' | '/user';
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
	authorId: string;
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

type PostCommentResponse = {
	id: string;
	postId: string;
	userId: string;
	userDisplayName: string;
	content: string;
	createdAt: string;
	updatedAt: string;
};

type PostCommentsPageResponse = {
	items: PostCommentResponse[];
	page: number;
	size: number;
	totalElements: number;
	totalPages: number;
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
	userId: string;
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

type UserPublicProfileResponse = {
	id: string;
	email: string;
	role: string;
	preferredLanguage: string;
	createdAt: string;
	posts: number;
	likes: number;
	comments: number;
	views: number;
	recentPosts: PostResponse[];
};

type ReadinessResponse = {
	status: string;
	components?: Record<string, { status: string }>;
};

type AnalyticsWord = {
	word: string;
	count: number;
};

type AnalyticsTopPost = {
	postId: string;
	authorDisplayName: string;
	contentPreview: string;
	createdAt: string;
	likes: number;
	views: number;
	comments: number;
};

type AnalyticsHourly = {
	hour: number;
	posts: number;
};

type AnalyticsDaily = {
	day: string;
	posts: number;
};

type AnalyticsSummaryResponse = {
	generatedAt: string;
	totalPosts: number;
	totalUsers: number;
	averageWordLength: number;
	averageUserEmailLength: number;
	topWords: AnalyticsWord[];
	topPosts: AnalyticsTopPost[];
	hourlyHeatmap: AnalyticsHourly[];
	postsEvolution: AnalyticsDaily[];
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
	postDetailTitle: string;
	postCommentsTitle: string;
	loadingPostDetail: string;
	postDetailFailed: string;
	commentsFailed: string;
	loadMoreComments: string;
	loadingCommentsMore: string;
	userPublicTitle: string;
	userPublicSubtitle: string;
	loadingUserProfile: string;
	userProfileFailed: string;
	memberSince: string;
	recentPostsTitle: string;
	summaryButton: string;
	summaryTitle: string;
	summaryDescription: string;
	summaryLoading: string;
	summaryError: string;
	summaryGeneratedAt: string;
	summaryTotalPosts: string;
	summaryTotalUsers: string;
	summaryAvgWordLength: string;
	summaryAvgUserEmailLength: string;
	summaryTopWords: string;
	summaryTopPosts: string;
	summaryHourlyHeatmap: string;
	summaryPostsEvolution: string;
	summaryNoData: string;
	summarySeriesPosts: string;
	summarySeriesHourlyPosts: string;
	examplesTitle: string;
	examplesSubtitle: string;
	exampleLazyTitle: string;
	exampleStatelessTitle: string;
	examplePrototypeTitle: string;
	tryMeTitle: string;
	tryMeSubtitle: string;
	tryMeRegister: string;
	tryMeDemoLogin: string;
	demoEmailLabel: string;
	demoPasswordLabel: string;
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
		postDetailTitle: 'Detalle del post',
		postCommentsTitle: 'Comentarios',
		loadingPostDetail: 'Cargando detalle...',
		postDetailFailed: 'No se pudo cargar el detalle del post.',
		commentsFailed: 'No se pudieron cargar los comentarios.',
		loadMoreComments: 'Mas comentarios',
		loadingCommentsMore: 'Cargando comentarios...',
		userPublicTitle: 'Perfil publico',
		userPublicSubtitle: 'Resumen del usuario y sus posts recientes.',
		loadingUserProfile: 'Cargando perfil de usuario...',
		userProfileFailed: 'No se pudo cargar el perfil publico.',
		memberSince: 'Miembro desde',
		recentPostsTitle: 'Posts recientes',
		summaryButton: 'Estadistica de la red social (lazy)',
		summaryTitle: 'Estadistica de la red social (lazy)',
		summaryDescription: 'Resumen global calculado bajo demanda desde el endpoint lazy.',
		summaryLoading: 'Generando resumen (lazy)...',
		summaryError: 'No se pudo cargar el resumen.',
		summaryGeneratedAt: 'Generado',
		summaryTotalPosts: 'Total posts',
		summaryTotalUsers: 'Total usuarios',
		summaryAvgWordLength: 'Media longitud palabra',
		summaryAvgUserEmailLength: 'Media longitud usuario',
		summaryTopWords: 'Top palabras',
		summaryTopPosts: 'Top posts',
		summaryHourlyHeatmap: 'Heatmap por hora',
		summaryPostsEvolution: 'Evolucion diaria (30 dias)',
		summaryNoData: 'Sin datos suficientes para mostrar.',
		summarySeriesPosts: 'Posts',
		summarySeriesHourlyPosts: 'Posts por hora',
		examplesTitle: 'Ejemplos de Beans en este proyecto',
		examplesSubtitle: 'Lazy para estadisticas pesadas, stateless para logica reutilizable y prototype para estado por usuario sin choques.',
		exampleLazyTitle: 'Lazy Bean: analytics bajo demanda',
		exampleStatelessTitle: 'Stateless Bean: servicio sin estado compartido',
		examplePrototypeTitle: 'Prototype Bean: preferencia de idioma por usuario',
		tryMeTitle: '¡Pruébame!',
		tryMeSubtitle: 'Entra rapido a Springram con registro o login demo.',
		tryMeRegister: 'Registro',
		tryMeDemoLogin: 'Login demo',
		demoEmailLabel: 'Demo email',
		demoPasswordLabel: 'Demo password',
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
		postDetailTitle: 'Post detail',
		postCommentsTitle: 'Comments',
		loadingPostDetail: 'Loading post detail...',
		postDetailFailed: 'Could not load post detail.',
		commentsFailed: 'Could not load comments.',
		loadMoreComments: 'More comments',
		loadingCommentsMore: 'Loading comments...',
		userPublicTitle: 'Public profile',
		userPublicSubtitle: 'User summary and recent posts.',
		loadingUserProfile: 'Loading user profile...',
		userProfileFailed: 'Could not load public profile.',
		memberSince: 'Member since',
		recentPostsTitle: 'Recent posts',
		summaryButton: 'Social network stats (lazy)',
		summaryTitle: 'Social network stats (lazy)',
		summaryDescription: 'Global summary computed on demand from the lazy endpoint.',
		summaryLoading: 'Generating summary (lazy)...',
		summaryError: 'Could not load summary.',
		summaryGeneratedAt: 'Generated',
		summaryTotalPosts: 'Total posts',
		summaryTotalUsers: 'Total users',
		summaryAvgWordLength: 'Avg word length',
		summaryAvgUserEmailLength: 'Avg user length',
		summaryTopWords: 'Top words',
		summaryTopPosts: 'Top posts',
		summaryHourlyHeatmap: 'Hourly heatmap',
		summaryPostsEvolution: 'Daily evolution (30 days)',
		summaryNoData: 'Not enough data to display.',
		summarySeriesPosts: 'Posts',
		summarySeriesHourlyPosts: 'Posts per hour',
		examplesTitle: 'Bean examples in this project',
		examplesSubtitle: 'Lazy for heavy analytics, stateless for reusable logic, and prototype for per-user state without collisions.',
		exampleLazyTitle: 'Lazy Bean: on-demand analytics',
		exampleStatelessTitle: 'Stateless Bean: service with no shared mutable state',
		examplePrototypeTitle: 'Prototype Bean: user language preference',
		tryMeTitle: 'Try me!',
		tryMeSubtitle: 'Jump into Springram quickly with register or demo login.',
		tryMeRegister: 'Register',
		tryMeDemoLogin: 'Demo login',
		demoEmailLabel: 'Demo email',
		demoPasswordLabel: 'Demo password',
	},
};

const SESSION_KEY = 'springram_session_v1';
const LANGUAGE_KEY = 'springram_language_v1';
const FEED_PAGE_SIZE = 20;
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8080';
const READINESS_ENDPOINT = `${API_BASE_URL}/actuator/health/readiness`;
const ANALYTICS_SUMMARY_ENDPOINT = `${API_BASE_URL}/api/v1/analytics/summary`;
const DEMO_EMAIL = 'test@test.test';
const DEMO_PASSWORD = 'Password123!';

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

function buildWordFontSize(count: number, maxCount: number): number {
	if (maxCount <= 0) {
		return 14;
	}
	const ratio = count / maxCount;
	return Math.round(13 + ratio * 14);
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
	if (pathname === '/summary') {
		return '/summary';
	}
	if (pathname === '/post') {
		return '/post';
	}
	if (pathname === '/user') {
		return '/user';
	}
	return '/';
}

function navigate(path: RoutePath): void {
	window.history.pushState({}, '', path);
	window.dispatchEvent(new PopStateEvent('popstate'));
}

function navigateWithQuery(path: '/post' | '/user', key: 'id', value: string): void {
	const query = `${key}=${encodeURIComponent(value)}`;
	window.history.pushState({}, '', `${path}?${query}`);
	window.dispatchEvent(new PopStateEvent('popstate'));
}

function readRouteEntityId(path: '/post' | '/user'): string | null {
	if (window.location.pathname !== path) {
		return null;
	}
	const raw = new URLSearchParams(window.location.search).get('id');
	if (!raw) {
		return null;
	}
	const value = raw.trim();
	return value ? value : null;
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
	const [authEmail, setAuthEmail] = useState('');
	const [authPassword, setAuthPassword] = useState('');
	const [loadingAuth, setLoadingAuth] = useState(false);
	const [loadingFeed, setLoadingFeed] = useState(false);
	const [loadingPost, setLoadingPost] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [loadingLanguageSave, setLoadingLanguageSave] = useState(false);
	const [statusLoading, setStatusLoading] = useState(false);
	const [statusResponse, setStatusResponse] = useState<ReadinessResponse | null>(null);
	const [statusError, setStatusError] = useState<string | null>(null);
	const [summaryLoading, setSummaryLoading] = useState(false);
	const [summaryResponse, setSummaryResponse] = useState<AnalyticsSummaryResponse | null>(null);
	const [summaryError, setSummaryError] = useState<string | null>(null);
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
	const [activePostId, setActivePostId] = useState<string | null>(readRouteEntityId('/post'));
	const [activeUserId, setActiveUserId] = useState<string | null>(readRouteEntityId('/user'));
	const [postDetail, setPostDetail] = useState<PostResponse | null>(null);
	const [postDetailLoading, setPostDetailLoading] = useState(false);
	const [postDetailError, setPostDetailError] = useState<string | null>(null);
	const [postComments, setPostComments] = useState<PostCommentResponse[]>([]);
	const [postCommentsMeta, setPostCommentsMeta] = useState<{ page: number; totalPages: number; totalElements: number }>({
		page: 0,
		totalPages: 0,
		totalElements: 0,
	});
	const [postCommentsLoading, setPostCommentsLoading] = useState(false);
	const [postCommentsLoadingMore, setPostCommentsLoadingMore] = useState(false);
	const [postCommentsError, setPostCommentsError] = useState<string | null>(null);
	const [publicUserProfile, setPublicUserProfile] = useState<UserPublicProfileResponse | null>(null);
	const [publicUserProfileLoading, setPublicUserProfileLoading] = useState(false);
	const [publicUserProfileError, setPublicUserProfileError] = useState<string | null>(null);
	const [showScrollTop, setShowScrollTop] = useState(false);
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
		const onPopState = () => {
			setRoute(normalizePath(window.location.pathname));
			setActivePostId(readRouteEntityId('/post'));
			setActiveUserId(readRouteEntityId('/user'));
		};
		window.addEventListener('popstate', onPopState);
		return () => window.removeEventListener('popstate', onPopState);
	}, []);

	useEffect(() => {
		const onScroll = () => {
			setShowScrollTop(window.scrollY > 420);
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
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
		if ((route === '/app' || route === '/search' || route === '/profile' || route === '/post' || route === '/user') && !isAuthenticated) {
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

	const loadPostDetail = async (postId: string) => {
		if (!session) {
			return;
		}
		const response = await apiFetch(`/api/v1/posts/${postId}`, { method: 'GET' }, session, setSession);
		if (!response.ok) {
			throw new Error(t.postDetailFailed);
		}
		const payload = (await response.json()) as PostResponse;
		setPostDetail(payload);
	};

	const loadPostCommentsPage = async (postId: string, page: number, append: boolean) => {
		if (!session) {
			return;
		}
		const response = await apiFetch(
			`/api/v1/posts/${postId}/comments?page=${page}&size=20`,
			{ method: 'GET' },
			session,
			setSession,
		);
		if (!response.ok) {
			throw new Error(t.commentsFailed);
		}
		const payload = (await response.json()) as PostCommentsPageResponse;
		setPostComments((prev) => {
			if (!append) {
				return payload.items;
			}
			const existingIds = new Set(prev.map((item) => item.id));
			const merged = [...prev];
			for (const item of payload.items) {
				if (!existingIds.has(item.id)) {
					merged.push(item);
				}
			}
			return merged;
		});
		setPostCommentsMeta({
			page: payload.page,
			totalPages: payload.totalPages,
			totalElements: payload.totalElements,
		});
	};

	const loadPublicUserProfile = async (userId: string) => {
		if (!session) {
			return;
		}
		const response = await apiFetch(`/api/v1/users/${userId}?recentPostsLimit=20`, { method: 'GET' }, session, setSession);
		if (!response.ok) {
			throw new Error(t.userProfileFailed);
		}
		const payload = (await response.json()) as UserPublicProfileResponse;
		setPublicUserProfile(payload);
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

	const loadMorePostComments = async () => {
		if (!session || !activePostId || postCommentsLoadingMore) {
			return;
		}
		if (postCommentsMeta.totalPages === 0 || postCommentsMeta.page + 1 >= postCommentsMeta.totalPages) {
			return;
		}
		setPostCommentsLoadingMore(true);
		setPostCommentsError(null);
		try {
			await loadPostCommentsPage(activePostId, postCommentsMeta.page + 1, true);
		} catch (err) {
			setPostCommentsError(err instanceof Error ? err.message : t.commentsFailed);
		} finally {
			setPostCommentsLoadingMore(false);
		}
	};

	const submitAuth = async (event: Event) => {
		event.preventDefault();
		const email = authEmail.trim();
		const password = authPassword;

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
			setAuthEmail('');
			setAuthPassword('');
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

	const loadAnalyticsSummary = async () => {
		setSummaryLoading(true);
		setSummaryError(null);
		try {
			const response = await fetch(ANALYTICS_SUMMARY_ENDPOINT, { method: 'GET' });
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			const payload = (await response.json()) as AnalyticsSummaryResponse;
			setSummaryResponse(payload);
		} catch (err) {
			setSummaryResponse(null);
			setSummaryError(err instanceof Error ? err.message : t.summaryError);
		} finally {
			setSummaryLoading(false);
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
		if ((route === '/search' || route === '/profile' || route === '/post' || route === '/user') && session && !profile) {
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
		if (route !== '/post' || !session) {
			return;
		}
		if (!activePostId) {
			navigate('/app');
			return;
		}

		setPostDetailLoading(true);
		setPostDetailError(null);
		setPostCommentsLoading(true);
		setPostCommentsError(null);

		void Promise.all([
			loadPostDetail(activePostId),
			loadPostCommentsPage(activePostId, 0, false),
			registerPostView(activePostId, true),
		])
			.catch((err) => {
				const message = err instanceof Error ? err.message : t.postDetailFailed;
				setPostDetailError(message);
				setPostCommentsError(message);
			})
			.finally(() => {
				setPostDetailLoading(false);
				setPostCommentsLoading(false);
			});
	}, [route, session?.accessToken, activePostId]);

	useEffect(() => {
		if (route !== '/user' || !session) {
			return;
		}
		if (!activeUserId) {
			navigate('/app');
			return;
		}
		setPublicUserProfileLoading(true);
		setPublicUserProfileError(null);
		void loadPublicUserProfile(activeUserId)
			.catch((err) => {
				setPublicUserProfileError(err instanceof Error ? err.message : t.userProfileFailed);
			})
			.finally(() => setPublicUserProfileLoading(false));
	}, [route, session?.accessToken, activeUserId]);

	useEffect(() => {
		if (route !== '/status') {
			return;
		}
		void checkReadiness();
	}, [route]);

	useEffect(() => {
		if (!info) {
			return;
		}
		const timer = window.setTimeout(() => setInfo(null), 2600);
		return () => window.clearTimeout(timer);
	}, [info]);

	useEffect(() => {
		if (route !== '/summary') {
			return;
		}
		void loadAnalyticsSummary();
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
		setPostDetail((prev) =>
			prev && prev.id === stats.postId
				? { ...prev, likes: stats.likes, views: stats.views, comments: stats.comments }
				: prev,
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
		setPostDetail((prev) =>
			prev && prev.id === postId
				? { ...prev, likedByMe: !likedByMe }
				: prev,
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
		const createdComment = (await response.json()) as PostCommentResponse;
		setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
		setFeed((prev) =>
			prev.map((item) => (item.id === postId ? { ...item, comments: item.comments + 1 } : item)),
		);
		setSearchResults((prev) =>
			prev.map((item) =>
				item.id === postId && item.kind === 'post'
					? { ...item, comments: item.comments + 1 }
					: item,
			),
		);
		setPostDetail((prev) => (prev && prev.id === postId ? { ...prev, comments: prev.comments + 1 } : prev));
		setPostComments((prev) => {
			if (!prev.length) {
				return [createdComment];
			}
			const exists = prev.some((item) => item.id === createdComment.id);
			return exists ? prev : [...prev, createdComment];
		});
		setPostCommentsMeta((prev) => ({ ...prev, totalElements: prev.totalElements + 1 }));
		setInfo(t.commentSent);
	};

	const logout = () => {
		setSession(null);
		setInfo(null);
		setError(null);
		setPostDetail(null);
		setPostComments([]);
		setPublicUserProfile(null);
		setActivePostId(null);
		setActiveUserId(null);
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

	const openPostDetail = (postId: string) => {
		setActivePostId(postId);
		navigateWithQuery('/post', 'id', postId);
	};

	const openUserProfile = (userId: string) => {
		setActiveUserId(userId);
		navigateWithQuery('/user', 'id', userId);
	};

	const onSelectSuggestion = (item: SearchSuggestionItem) => {
		setSearchQuery(item.title);
		setSearchOpen(false);
		if (item.kind === 'post') {
			openPostDetail(item.id);
			return;
		}
		openUserProfile(item.id);
	};

	const appTitle = useMemo(() => 'Springram by Stelut Tomoiaga', []);
	const handleBrandClick = () => {
		navigate(isAuthenticated ? '/app' : '/');
	};
	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};
	const openRegister = () => {
		setAuthMode('register');
		setAuthEmail('');
		setAuthPassword('');
		navigate('/auth');
	};
	const openDemoLogin = () => {
		setAuthMode('login');
		setAuthEmail(DEMO_EMAIL);
		setAuthPassword(DEMO_PASSWORD);
		navigate('/auth');
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
	const localeTag = language === 'en' ? 'en-US' : 'es-ES';

	const dailyChartData = useMemo(() => {
		if (!summaryResponse) {
			return null;
		}
		return {
			labels: summaryResponse.postsEvolution.map((item) =>
				new Date(`${item.day}T00:00:00Z`).toLocaleDateString(localeTag, { month: 'short', day: '2-digit' }),
			),
			datasets: [
				{
					label: t.summarySeriesPosts,
					data: summaryResponse.postsEvolution.map((item) => item.posts),
					borderColor: '#4caf50',
					backgroundColor: 'rgba(76, 175, 80, 0.2)',
					borderWidth: 2,
					pointRadius: 2,
					fill: true,
					tension: 0.35,
				},
			],
		};
	}, [summaryResponse, t.summarySeriesPosts, localeTag]);

	const hourlyBarData = useMemo(() => {
		if (!summaryResponse) {
			return null;
		}
		return {
			labels: summaryResponse.hourlyHeatmap.map((item) => `${item.hour.toString().padStart(2, '0')}:00`),
			datasets: [
				{
					label: t.summarySeriesHourlyPosts,
					data: summaryResponse.hourlyHeatmap.map((item) => item.posts),
					backgroundColor: 'rgba(29, 155, 240, 0.6)',
					borderColor: '#1d9bf0',
					borderWidth: 1,
					borderRadius: 4,
				},
			],
		};
	}, [summaryResponse, t.summarySeriesHourlyPosts]);

	const commonChartOptions = useMemo(
		() => ({
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					labels: { color: '#c6d7e8' },
				},
			},
			scales: {
				x: {
					ticks: { color: '#95abc0', maxRotation: 0 },
					grid: { color: 'rgba(255,255,255,0.08)' },
				},
				y: {
					beginAtZero: true,
					ticks: { color: '#95abc0' },
					grid: { color: 'rgba(255,255,255,0.08)' },
				},
			},
		}),
		[],
	);

	const beanExamples = useMemo(() => {
		if (language === 'en') {
			return {
				lazy: `@Component
@Lazy
public class HeavyAnalyticsEngine {
  public AnalyticsSummaryResponse computeSummary() {
    // topWords, topPosts, hourlyHeatmap, postsEvolution
    return ...;
  }
}`,
				stateless: `@Service
public class AnalyticsService {
  private final HeavyAnalyticsEngine engine;

  public AnalyticsSummaryResponse summary() {
    return engine.computeSummary(); // no mutable shared state
  }
}`,
				prototype: `@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public class UserLanguagePreferenceState {
  private UUID userId;
  private String language; // es | en
}

// in singleton service:
UserLanguagePreferenceState state = provider.getObject();
state.initialize(userId, currentLanguage);
state.apply(requestedLanguage);`,
			};
		}
		return {
			lazy: `@Component
@Lazy
public class HeavyAnalyticsEngine {
  public AnalyticsSummaryResponse computeSummary() {
    // topWords, topPosts, hourlyHeatmap, postsEvolution
    return ...;
  }
}`,
			stateless: `@Service
public class AnalyticsService {
  private final HeavyAnalyticsEngine engine;

  public AnalyticsSummaryResponse summary() {
    return engine.computeSummary(); // sin estado mutable compartido
  }
}`,
			prototype: `@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public class UserLanguagePreferenceState {
  private UUID userId;
  private String language; // es | en
}

// dentro de un servicio singleton:
UserLanguagePreferenceState state = provider.getObject();
state.initialize(userId, currentLanguage);
state.apply(requestedLanguage);`,
		};
	}, [language]);

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
						<button class="ghost" onClick={() => navigate('/summary')}>{t.summaryButton}</button>
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
						<button class="ghost" onClick={() => navigate('/summary')}>{t.summaryButton}</button>
						<button class="ghost" onClick={() => navigate('/status')}>{t.statusButton}</button>
						<button class="ghost" onClick={openRegister}>{t.tryMeRegister}</button>
					</nav>
				)}
			</header>

			<main class="content">
				{route === '/' && (
					<section class="hero-card">
						<p class="kicker">{t.landingKicker}</p>
						<h1>{appTitle}</h1>
						<p>{t.landingDescription}</p>
						<div class="trial-banner">
							<div>
								<strong>{t.tryMeTitle}</strong>
								<small>{t.tryMeSubtitle}</small>
							</div>
							<div class="trial-actions">
								<button class="solid" onClick={openRegister}>{t.tryMeRegister}</button>
								<button class="ghost" onClick={openDemoLogin}>{t.tryMeDemoLogin}</button>
							</div>
						</div>
						<div class="stack-grid">
							<span>Spring Security + JWT</span>
							<span>Flyway + PostgreSQL</span>
							<span>Redis cache</span>
							<span>Kafka eventos async</span>
							<span>Docker/Compose</span>
							<span>OpenAPI + Metrics</span>
						</div>
						<section class="examples-panel">
							<h3>{t.examplesTitle}</h3>
							<p class="muted">{t.examplesSubtitle}</p>
							<div class="examples-grid">
								<article class="example-card">
									<h4>{t.exampleLazyTitle}</h4>
									<pre><code>{beanExamples.lazy}</code></pre>
								</article>
								<article class="example-card">
									<h4>{t.exampleStatelessTitle}</h4>
									<pre><code>{beanExamples.stateless}</code></pre>
								</article>
								<article class="example-card">
									<h4>{t.examplePrototypeTitle}</h4>
									<pre><code>{beanExamples.prototype}</code></pre>
								</article>
							</div>
						</section>
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

				{route === '/summary' && (
					<section class="panel summary-panel">
						<h2>{t.summaryTitle}</h2>
						<p class="muted">{t.summaryDescription}</p>
						<p class="muted"><strong>Endpoint:</strong> <code>{ANALYTICS_SUMMARY_ENDPOINT}</code></p>

						{summaryLoading ? (
							<>
								<p class="muted loading-line">
									<span class="spinner" aria-hidden="true" /> {t.summaryLoading}
								</p>
								<div class="summary-skeleton-grid">
									<div class="summary-skeleton-box" />
									<div class="summary-skeleton-box" />
									<div class="summary-skeleton-box" />
								</div>
							</>
						) : null}

						{!summaryLoading && summaryError ? (
							<p class="error">{t.summaryError} ({summaryError})</p>
						) : null}

						{!summaryLoading && !summaryError && summaryResponse ? (
							<>
								<div class="summary-kpis">
									<article class="summary-kpi">
										<strong>{t.summaryTotalPosts}</strong>
										<span>{summaryResponse.totalPosts}</span>
									</article>
									<article class="summary-kpi">
										<strong>{t.summaryTotalUsers}</strong>
										<span>{summaryResponse.totalUsers}</span>
									</article>
									<article class="summary-kpi">
										<strong>{t.summaryAvgWordLength}</strong>
										<span>{summaryResponse.averageWordLength.toFixed(2)}</span>
									</article>
									<article class="summary-kpi">
										<strong>{t.summaryAvgUserEmailLength}</strong>
										<span>{summaryResponse.averageUserEmailLength.toFixed(2)}</span>
									</article>
									<article class="summary-kpi">
										<strong>{t.summaryGeneratedAt}</strong>
										<span>{new Date(summaryResponse.generatedAt).toLocaleString(localeTag)}</span>
									</article>
								</div>

								<div class="summary-grid">
									<section class="summary-box">
										<h3>{t.summaryTopWords}</h3>
										{summaryResponse.topWords.length === 0 ? (
											<p class="muted">{t.summaryNoData}</p>
										) : (
											<div class="word-cloud">
												{summaryResponse.topWords.map((item) => (
													<span
														key={item.word}
														class="word-chip"
														style={{ fontSize: `${buildWordFontSize(item.count, summaryResponse.topWords[0]?.count ?? 0)}px` }}
													>
														{item.word} ({item.count})
													</span>
												))}
											</div>
										)}
									</section>

									<section class="summary-box">
										<h3>{t.summaryTopPosts}</h3>
										{summaryResponse.topPosts.length === 0 ? (
											<p class="muted">{t.summaryNoData}</p>
										) : (
											<ul class="summary-list summary-posts">
												{summaryResponse.topPosts.map((post) => (
													<li key={post.postId}>
														<div>
															<strong>{post.authorDisplayName}</strong>
															<p>{post.contentPreview}</p>
														</div>
														<small>
															L {post.likes} · V {post.views} · C {post.comments}
														</small>
													</li>
												))}
											</ul>
										)}
									</section>

									<section class="summary-box">
										<h3>{t.summaryHourlyHeatmap}</h3>
										{!hourlyBarData ? (
											<p class="muted">{t.summaryNoData}</p>
										) : (
											<div class="chart-wrap">
												<Bar data={hourlyBarData} options={commonChartOptions} />
											</div>
										)}
									</section>

									<section class="summary-box">
										<h3>{t.summaryPostsEvolution}</h3>
										{!dailyChartData ? (
											<p class="muted">{t.summaryNoData}</p>
										) : (
											<div class="chart-wrap">
												<Line data={dailyChartData} options={commonChartOptions} />
											</div>
										)}
									</section>
								</div>
							</>
						) : null}
					</section>
				)}

				{route === '/auth' && (
					<section class="panel auth-panel">
						<h2>{authMode === 'register' ? t.registerTitle : t.loginTitle}</h2>
						<p class="muted">{t.apiConnection}: <code>{API_BASE_URL}</code></p>
						<div class="mode-row">
							<button
								class={authMode === 'register' ? 'tab active' : 'tab'}
								onClick={() => {
									setAuthMode('register');
									setAuthEmail('');
									setAuthPassword('');
								}}
							>
								{t.registerTitle}
							</button>
							<button
								class={authMode === 'login' ? 'tab active' : 'tab'}
								onClick={() => {
									setAuthMode('login');
									if (!authEmail && !authPassword) {
										setAuthEmail(DEMO_EMAIL);
										setAuthPassword(DEMO_PASSWORD);
									}
								}}
							>
								{t.loginTitle}
							</button>
						</div>
						<form class="auth-form" onSubmit={submitAuth}>
							<label>
								{t.email}
								<input
									name="email"
									type="email"
									required
									placeholder="name@domain.com"
									value={authEmail}
									onInput={(event) => setAuthEmail((event.currentTarget as HTMLInputElement).value)}
								/>
							</label>
							<label>
								{t.password}
								<input
									name="password"
									type="password"
									required
									minLength={8}
									placeholder="Password123!"
									value={authPassword}
									onInput={(event) => setAuthPassword((event.currentTarget as HTMLInputElement).value)}
								/>
							</label>
							{authMode === 'login' ? (
								<p class="muted auth-demo-hint">
									{t.demoEmailLabel}: <code>{DEMO_EMAIL}</code> · {t.demoPasswordLabel}: <code>{DEMO_PASSWORD}</code>
								</p>
							) : null}
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

				{route === '/post' && (
					<section class="panel app-panel">
						<div class="search-results-head">
							<h2>{t.postDetailTitle}</h2>
							<button class="ghost" onClick={() => navigate('/app')}>{t.backToFeed}</button>
						</div>

						{postDetailLoading ? (
							<p class="muted loading-line">
								<span class="spinner" aria-hidden="true" /> {t.loadingPostDetail}
							</p>
						) : null}

						{!postDetailLoading && postDetailError ? (
							<p class="error-inline">{postDetailError}</p>
						) : null}

						{!postDetailLoading && !postDetailError && postDetail ? (
							<div class="feed-list">
								<article class="post" key={`detail-${postDetail.id}`}>
									<div class="post-layout">
										<div class="avatar">{toAvatarInitial(postDetail.authorDisplayName)}</div>
										<div class="post-main">
											<div class="post-head">
												<button class="text-link" onClick={() => openUserProfile(postDetail.authorId)}>
													<strong>{postDetail.authorDisplayName}</strong>
												</button>
												<span class="handle">@{toHandle(postDetail.authorDisplayName)}</span>
												<span class="separator">·</span>
												<time>{toRelativeTime(postDetail.createdAt)}</time>
											</div>
											<p class="post-text">{postDetail.content}</p>
											<div class="post-actions">
												<div class="action-item neutral">
													<span class="material-symbols-rounded action-icon" aria-hidden="true">comment</span>
													<span>{postDetail.comments}</span>
												</div>
												<button
													class={postDetail.likedByMe ? 'action-item liked' : 'action-item neutral'}
													onClick={() => void toggleLike(postDetail.id, postDetail.likedByMe)}
													aria-label={postDetail.likedByMe ? t.unlike : t.like}
												>
													<span class={postDetail.likedByMe ? 'material-symbols-rounded action-icon filled-icon' : 'material-symbols-rounded action-icon'} aria-hidden="true">favorite</span>
													<span>{postDetail.likes}</span>
												</button>
												<div class="action-item neutral" aria-label={t.view}>
													<span class="material-symbols-rounded action-icon" aria-hidden="true">visibility</span>
													<span>{postDetail.views}</span>
												</div>
											</div>
										</div>
									</div>
									<form class="comment-form" onSubmit={(event) => void submitComment(event, postDetail.id)}>
										<input
											placeholder={t.commentPlaceholder}
											maxLength={2000}
											value={commentDrafts[postDetail.id] || ''}
											onInput={(event) => {
												const value = (event.currentTarget as HTMLInputElement).value;
												setCommentDrafts((prev) => ({ ...prev, [postDetail.id]: value }));
											}}
										/>
										<button class="solid" type="submit">{t.send}</button>
									</form>
								</article>
							</div>
						) : null}

						<div class="post-comments-wrap">
							<h3>{t.postCommentsTitle}</h3>
							{postCommentsLoading ? (
								<p class="muted loading-line">
									<span class="spinner" aria-hidden="true" /> {t.loadingCommentsMore}
								</p>
							) : null}
							{!postCommentsLoading && postCommentsError ? <p class="error-inline">{postCommentsError}</p> : null}
							{!postCommentsLoading && !postCommentsError ? (
								<ul class="comments-list">
									{postComments.map((comment) => (
										<li key={comment.id} class="comment-item">
											<button class="text-link" onClick={() => openUserProfile(comment.userId)}>
												<strong>{comment.userDisplayName}</strong>
											</button>
											<span class="comment-time">{toRelativeTime(comment.createdAt)}</span>
											<p>{comment.content}</p>
										</li>
									))}
								</ul>
							) : null}
							{postCommentsMeta.page + 1 < postCommentsMeta.totalPages ? (
								<div class="load-more-wrap">
									<button class="ghost with-loader" onClick={() => void loadMorePostComments()} disabled={postCommentsLoadingMore}>
										{postCommentsLoadingMore ? (
											<>
												<span class="spinner" aria-hidden="true" />
												{t.loadingCommentsMore}
											</>
										) : t.loadMoreComments}
									</button>
								</div>
							) : null}
						</div>
					</section>
				)}

				{route === '/user' && (
					<section class="panel app-panel">
						<div class="search-results-head">
							<h2>{t.userPublicTitle}</h2>
							<button class="ghost" onClick={() => navigate('/app')}>{t.backToFeed}</button>
						</div>
						{publicUserProfileLoading ? (
							<p class="muted loading-line">
								<span class="spinner" aria-hidden="true" /> {t.loadingUserProfile}
							</p>
						) : null}
						{!publicUserProfileLoading && publicUserProfileError ? (
							<p class="error-inline">{publicUserProfileError}</p>
						) : null}
						{!publicUserProfileLoading && !publicUserProfileError && publicUserProfile ? (
							<>
								<div class="public-user-head">
									<div class="avatar">{toAvatarInitial(publicUserProfile.email)}</div>
									<div>
										<h3>{publicUserProfile.email}</h3>
										<p class="muted">{t.userPublicSubtitle}</p>
										<p class="muted">{t.memberSince}: {new Date(publicUserProfile.createdAt).toLocaleDateString(localeTag)}</p>
									</div>
								</div>
								<div class="stats-row user-stats-row public-user-stats">
									<span>{t.statsPosts}: {publicUserProfile.posts}</span>
									<span>{t.statsLikes}: {publicUserProfile.likes}</span>
									<span>{t.statsComments}: {publicUserProfile.comments}</span>
									<span>{t.statsViews}: {publicUserProfile.views}</span>
								</div>
								<div class="search-results-head section-head-inline">
									<h3>{t.recentPostsTitle}</h3>
								</div>
								<div class="feed-list">
									{publicUserProfile.recentPosts.map((post) => (
										<article class="post" key={`user-post-${post.id}`}>
											<div class="post-layout">
												<div class="avatar">{toAvatarInitial(post.authorDisplayName)}</div>
												<div class="post-main">
													<div class="post-head">
														<button class="text-link" onClick={() => openUserProfile(post.authorId)}>
															<strong>{post.authorDisplayName}</strong>
														</button>
														<span class="handle">@{toHandle(post.authorDisplayName)}</span>
														<span class="separator">·</span>
														<time>{toRelativeTime(post.createdAt)}</time>
													</div>
													<button class="post-text-button" onClick={() => openPostDetail(post.id)}>
														<p class="post-text">{post.content}</p>
													</button>
													<div class="post-actions">
														<button class="action-item neutral" onClick={() => openPostDetail(post.id)}>
															<span class="material-symbols-rounded action-icon" aria-hidden="true">comment</span>
															<span>{post.comments}</span>
														</button>
														<button
															class={post.likedByMe ? 'action-item liked' : 'action-item neutral'}
															onClick={() => void toggleLike(post.id, post.likedByMe)}
															aria-label={post.likedByMe ? t.unlike : t.like}
														>
															<span class={post.likedByMe ? 'material-symbols-rounded action-icon filled-icon' : 'material-symbols-rounded action-icon'} aria-hidden="true">favorite</span>
															<span>{post.likes}</span>
														</button>
														<div class="action-item neutral">
															<span class="material-symbols-rounded action-icon" aria-hidden="true">visibility</span>
															<span>{post.views}</span>
														</div>
													</div>
												</div>
											</div>
										</article>
									))}
								</div>
							</>
						) : null}
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
													<button class="text-link" onClick={() => openUserProfile(item.userId)}>
														<strong>{item.secondaryText}</strong>
													</button>
													<span class="handle">@{toHandle(item.secondaryText)}</span>
													<span class="separator">·</span>
													<time>{toRelativeTime(item.createdAt)}</time>
												</div>
												<button class="post-text-button" onClick={() => openPostDetail(item.id)}>
													<p class="post-text">{item.primaryText}</p>
												</button>
												<div class="post-actions">
													<button class="action-item neutral" onClick={() => openPostDetail(item.id)}>
														<span class="material-symbols-rounded action-icon" aria-hidden="true">comment</span>
														<span>{item.comments}</span>
													</button>
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
													<button class="text-link" onClick={() => openUserProfile(item.userId)}>
														<strong>{item.primaryText}</strong>
													</button>
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
												<button class="text-link" onClick={() => openUserProfile(post.authorId)}>
													<strong>{post.authorDisplayName}</strong>
												</button>
												<span class="handle">@{toHandle(post.authorDisplayName)}</span>
												<span class="separator">·</span>
												<time>{toRelativeTime(post.createdAt)}</time>
											</div>
											<button class="post-text-button" onClick={() => openPostDetail(post.id)}>
												<p class="post-text">{post.content}</p>
											</button>
											<div class="post-actions">
												<button class="action-item neutral" aria-label={t.comment} onClick={() => openPostDetail(post.id)}>
													<span class="material-symbols-rounded action-icon" aria-hidden="true">comment</span>
													<span>{post.comments}</span>
												</button>
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
			{showScrollTop ? (
				<button class="scroll-top-btn" onClick={scrollToTop} aria-label="Volver arriba">
					<span class="material-symbols-rounded" aria-hidden="true">keyboard_arrow_up</span>
				</button>
			) : null}
		</div>
	);
}

render(<App />, document.getElementById('app')!);
