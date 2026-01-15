// ============================================
// CONFIGURATION
// ============================================
// Settings are loaded from config.js
// Edit frontend/js/config.js to set your Supabase credentials
// ============================================

const SUPABASE_URL = window.CONFIG?.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = window.CONFIG?.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// App State
let isLoginMode = true;
let accessToken = null;
let currentUser = null;
let deleteBookmarkId = null;

// Pagination State
const ITEMS_PER_PAGE = 5;
let currentPage = 1;
let totalBookmarks = 0;
let currentTab = 'add';
let searchQuery = '';
let searchDebounceTimer = null;
let editBookmarkId = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // Initialize theme
    initTheme();

    // Check if user is logged in
    checkUser();

    // Setup delete modal
    setupDeleteModal();

    // Setup edit modal
    setupEditModal();

    // Setup URL paste listener for auto-fetch title
    setupUrlListener();
});

// ============================================
// THEME MANAGEMENT
// ============================================

function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';

    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';

    themeToggle.addEventListener('change', (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-error',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';

    const iconName = {
        'success': 'check-circle',
        'error': 'x-circle',
        'warning': 'alert-triangle',
        'info': 'info'
    }[type] || 'info';

    const toast = document.createElement('div');
    toast.className = `alert ${alertClass} shadow-lg`;
    toast.innerHTML = `
        <i data-lucide="${iconName}" class="w-5 h-5"></i>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// AUTHENTICATION
// ============================================

function checkUser() {
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
        accessToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showApp();
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;

    const title = document.getElementById('auth-title');
    const btn = document.getElementById('auth-btn');
    const toggleText = document.getElementById('toggle-text');
    const toggleLink = document.getElementById('toggle-link');

    title.textContent = isLoginMode ? 'Login' : 'Sign Up';

    const btnSpan = btn.querySelector('span');
    if (btnSpan) btnSpan.textContent = isLoginMode ? 'Login' : 'Sign Up';

    toggleText.textContent = isLoginMode ? "Don't have an account?" : "Already have an account?";
    toggleLink.textContent = isLoginMode ? 'Sign Up' : 'Login';

    // Update icon
    const icon = btn.querySelector('i[data-lucide]');
    if (icon) {
        icon.setAttribute('data-lucide', isLoginMode ? 'log-in' : 'user-plus');
        lucide.createIcons();
    }

    hideAuthMessage();
}

async function handleAuth() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const authBtn = document.getElementById('auth-btn');

    // Validation
    if (!email || !password) {
        showAuthMessage('Please fill in all fields', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showAuthMessage('Please enter a valid email address', 'error');
        return;
    }

    if (password.length < 6) {
        showAuthMessage('Password must be at least 6 characters', 'error');
        return;
    }

    // Loading state
    authBtn.classList.add('loading');
    authBtn.disabled = true;

    try {
        const endpoint = isLoginMode ? 'login' : 'signup';
        const response = await fetch(`${FUNCTIONS_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showAuthMessage(data.error || 'An error occurred', 'error');
        } else if (!isLoginMode) {
            // Signup successful - auto login
            showAuthMessage('Account created! Logging you in...', 'success');
            isLoginMode = true;
            setTimeout(() => handleAuth(), 1000);
            return;
        } else {
            // Login successful
            accessToken = data.session.access_token;
            currentUser = data.user;
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            showToast('Welcome back!', 'success');
            showApp();
        }
    } catch (error) {
        showAuthMessage('Network error. Please check your connection.', 'error');
    }

    authBtn.classList.remove('loading');
    authBtn.disabled = false;
}

function handleLogout() {
    accessToken = null;
    currentUser = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');

    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('app-section').classList.add('hidden');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';

    showToast('Logged out successfully', 'info');
}

function showAuthMessage(message, type) {
    const messageDiv = document.getElementById('auth-message');
    const alertClass = type === 'error' ? 'alert-error' : 'alert-success';
    const iconName = type === 'error' ? 'x-circle' : 'check-circle';

    messageDiv.className = `alert ${alertClass} mb-4`;
    messageDiv.innerHTML = `
        <i data-lucide="${iconName}" class="w-5 h-5"></i>
        <span>${escapeHtml(message)}</span>
    `;

    lucide.createIcons();
}

function hideAuthMessage() {
    const messageDiv = document.getElementById('auth-message');
    messageDiv.className = 'hidden';
    messageDiv.innerHTML = '';
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eye-icon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.setAttribute('data-lucide', 'eye-off');
    } else {
        passwordInput.type = 'password';
        eyeIcon.setAttribute('data-lucide', 'eye');
    }

    lucide.createIcons();
}

function showApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('user-email').textContent = currentUser.email;

    // Re-initialize icons for app section
    lucide.createIcons();

    // Load bookmark count for the tab badge
    loadBookmarkCount();
}

// ============================================
// TAB MANAGEMENT
// ============================================

function switchTab(tab) {
    currentTab = tab;

    const tabAdd = document.getElementById('tab-add');
    const tabList = document.getElementById('tab-list');
    const contentAdd = document.getElementById('tab-content-add');
    const contentList = document.getElementById('tab-content-list');

    if (tab === 'add') {
        tabAdd.classList.add('tab-active');
        tabList.classList.remove('tab-active');
        contentAdd.classList.remove('hidden');
        contentList.classList.add('hidden');
    } else {
        tabAdd.classList.remove('tab-active');
        tabList.classList.add('tab-active');
        contentAdd.classList.add('hidden');
        contentList.classList.remove('hidden');
        // Reset search and load bookmarks when switching to list tab
        searchQuery = '';
        document.getElementById('search-input').value = '';
        currentPage = 1;
        loadBookmarks();
    }

    lucide.createIcons();
}

async function loadBookmarkCount() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookmarks?select=count`, {
            method: 'HEAD',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${accessToken}`,
                'Prefer': 'count=exact'
            }
        });

        const contentRange = response.headers.get('content-range');
        if (contentRange) {
            const total = contentRange.split('/')[1];
            totalBookmarks = parseInt(total) || 0;
            document.getElementById('bookmark-count').textContent = totalBookmarks;
        }
    } catch (error) {
        console.error('Failed to load bookmark count');
    }
}

function changePage(direction) {
    const totalPages = Math.ceil(totalBookmarks / ITEMS_PER_PAGE);
    const newPage = currentPage + direction;

    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        loadBookmarks();
    }
}

function updatePagination() {
    const totalPages = Math.ceil(totalBookmarks / ITEMS_PER_PAGE) || 1;

    document.getElementById('current-page').textContent = currentPage;
    document.getElementById('total-pages').textContent = totalPages;

    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');

    btnPrev.disabled = currentPage <= 1;
    btnNext.disabled = currentPage >= totalPages;
}

function handleSearch() {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        searchQuery = document.getElementById('search-input').value.trim();
        currentPage = 1; // Reset to first page on new search
        loadBookmarks();
    }, 300);
}

// ============================================
// BOOKMARKS
// ============================================

function setupUrlListener() {
    const urlInput = document.getElementById('url');
    if (!urlInput) return;

    // Debounce timer
    let debounceTimer;

    // Listen for paste event
    urlInput.addEventListener('paste', (e) => {
        // Wait a moment for the paste to complete
        setTimeout(() => {
            const url = urlInput.value.trim();
            if (isValidUrl(url)) {
                fetchTitle(url);
            }
        }, 100);
    });

    // Also listen for input changes (with debounce)
    urlInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const url = urlInput.value.trim();
            if (isValidUrl(url)) {
                fetchTitle(url);
            }
        }, 500);
    });
}

async function fetchTitle(url) {
    const titleInput = document.getElementById('title');
    const faviconPreview = document.getElementById('favicon-preview');
    const faviconImg = document.getElementById('favicon-img');

    // Show favicon immediately
    const domain = getDomain(url);
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    faviconImg.src = faviconUrl;
    faviconPreview.classList.remove('hidden');

    // Don't fetch title if already has a value
    if (titleInput.value.trim()) return;

    // Show loading state in title input
    titleInput.placeholder = 'Fetching title...';

    try {
        const response = await fetch(`${FUNCTIONS_URL}/fetch-title`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (data.title && data.title !== 'No title found') {
            titleInput.value = data.title;
            titleInput.placeholder = 'Bookmark title';
        } else {
            titleInput.value = '';
            titleInput.placeholder = 'Title not found - enter manually';
        }
    } catch (error) {
        titleInput.value = '';
        titleInput.placeholder = 'Title not found - enter manually';
    }
}

async function addBookmark() {
    const title = document.getElementById('title').value.trim();
    const url = document.getElementById('url').value.trim();
    const notes = document.getElementById('notes').value.trim();

    // Validation
    if (!title || !url) {
        showToast('Title and URL are required', 'warning');
        return;
    }

    if (!isValidUrl(url)) {
        showToast('Please enter a valid URL', 'warning');
        return;
    }

    showFormMessage('Saving bookmark...', 'info');

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookmarks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${accessToken}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ title, url, notes: notes || null })
        });

        if (!response.ok) {
            if (response.status === 401) {
                showToast('Session expired. Please login again.', 'error');
                handleLogout();
                return;
            }
            const data = await response.json();
            showToast(data.message || 'Failed to save bookmark', 'error');
        } else {
            showToast('Bookmark saved!', 'success');
            document.getElementById('title').value = '';
            document.getElementById('url').value = '';
            document.getElementById('notes').value = '';
            document.getElementById('title').placeholder = 'Bookmark title';
            document.getElementById('favicon-preview').classList.add('hidden');
            // Update count badge
            loadBookmarkCount();
        }
    } catch (error) {
        showToast('Failed to save bookmark', 'error');
    }

    hideFormMessage();
}

async function loadBookmarks() {
    const listDiv = document.getElementById('bookmarks-list');

    // Show loading
    listDiv.innerHTML = `
        <div class="flex justify-center py-8">
            <span class="loading loading-spinner loading-lg"></span>
        </div>
    `;

    // Calculate range for pagination (0-indexed)
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    // Build URL with search filter if query exists
    let apiUrl = `${SUPABASE_URL}/rest/v1/bookmarks?order=created_at.desc`;
    if (searchQuery) {
        // Search in title or url (case-insensitive)
        const encoded = encodeURIComponent(`%${searchQuery}%`);
        apiUrl += `&or=(title.ilike.${encoded},url.ilike.${encoded},notes.ilike.${encoded})`;
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${accessToken}`,
                'Range': `${from}-${to}`,
                'Prefer': 'count=exact'
            }
        });

        // Get total count from Content-Range header
        const contentRange = response.headers.get('content-range');
        if (contentRange) {
            const total = contentRange.split('/')[1];
            totalBookmarks = parseInt(total) || 0;
            document.getElementById('bookmark-count').textContent = totalBookmarks;
        }

        if (!response.ok) {
            if (response.status === 401) {
                showToast('Session expired. Please login again.', 'error');
                handleLogout();
                return;
            }
            const data = await response.json();
            listDiv.innerHTML = `
                <div class="alert alert-error">
                    <i data-lucide="x-circle" class="w-5 h-5"></i>
                    <span>${escapeHtml(data.message || 'Failed to load bookmarks')}</span>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        const bookmarks = await response.json();

        if (!bookmarks || bookmarks.length === 0) {
            listDiv.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="inbox" class="w-16 h-16 mx-auto"></i>
                    <p class="text-lg font-medium">No bookmarks yet</p>
                    <p class="text-sm">Add your first bookmark using the Add Bookmark tab!</p>
                </div>
            `;
            lucide.createIcons();
            updatePagination();
            return;
        }

        listDiv.innerHTML = bookmarks.map(bookmark => {
            const domain = getDomain(bookmark.url);
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

            return `
            <div class="bookmark-item card card-compact bg-base-200">
                <div class="card-body">
                    <div class="flex items-start gap-4">
                        <div class="flex-shrink-0">
                            <img src="${faviconUrl}"
                                 alt=""
                                 class="w-12 h-12 rounded-lg bg-base-300 p-1"
                                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23888%22 stroke-width=%222%22><path d=%22M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z%22/></svg>'" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="font-semibold text-lg">${escapeHtml(bookmark.title)}</h3>
                            <a href="${escapeHtml(bookmark.url)}" target="_blank"
                               class="bookmark-url link link-primary text-sm flex items-center gap-1 mt-1">
                                <i data-lucide="external-link" class="w-3 h-3 flex-shrink-0"></i>
                                ${escapeHtml(domain)}
                            </a>
                            ${bookmark.notes ? `
                                <p class="text-sm text-base-content/70 mt-2">
                                    <i data-lucide="file-text" class="w-3 h-3 inline mr-1"></i>
                                    ${escapeHtml(bookmark.notes)}
                                </p>
                            ` : ''}
                            <p class="text-xs text-base-content/50 mt-2">
                                <i data-lucide="clock" class="w-3 h-3 inline mr-1"></i>
                                ${formatDate(bookmark.created_at)}
                            </p>
                        </div>
                        <div class="flex gap-1">
                            <button class="btn btn-ghost btn-sm btn-square text-primary"
                                    onclick="openEditModal('${bookmark.id}', '${escapeHtml(bookmark.title).replace(/'/g, "\\'")}', '${escapeHtml(bookmark.url).replace(/'/g, "\\'")}', '${escapeHtml(bookmark.notes || '').replace(/'/g, "\\'")}')">
                                <i data-lucide="edit" class="w-4 h-4"></i>
                            </button>
                            <button class="btn btn-ghost btn-sm btn-square text-error"
                                    onclick="confirmDelete('${bookmark.id}')">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `}).join('');

        lucide.createIcons();
        updatePagination();
    } catch (error) {
        listDiv.innerHTML = `
            <div class="alert alert-error">
                <i data-lucide="x-circle" class="w-5 h-5"></i>
                <span>Failed to load bookmarks</span>
            </div>
        `;
        lucide.createIcons();
    }
}

function setupDeleteModal() {
    const confirmBtn = document.getElementById('confirm-delete-btn');
    confirmBtn.addEventListener('click', () => {
        if (deleteBookmarkId) {
            deleteBookmark(deleteBookmarkId);
            document.getElementById('delete-modal').close();
        }
    });
}

function confirmDelete(id) {
    deleteBookmarkId = id;
    document.getElementById('delete-modal').showModal();
}

function setupEditModal() {
    const confirmBtn = document.getElementById('confirm-edit-btn');
    confirmBtn.addEventListener('click', () => {
        if (editBookmarkId) {
            saveEdit();
        }
    });
}

function openEditModal(id, title, url, notes) {
    editBookmarkId = id;
    document.getElementById('edit-title').value = title;
    document.getElementById('edit-url').value = url;
    document.getElementById('edit-notes').value = notes || '';
    document.getElementById('edit-modal').showModal();
    lucide.createIcons();
}

async function saveEdit() {
    const title = document.getElementById('edit-title').value.trim();
    const url = document.getElementById('edit-url').value.trim();
    const notes = document.getElementById('edit-notes').value.trim();

    if (!title || !url) {
        showToast('Title and URL are required', 'warning');
        return;
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookmarks?id=eq.${editBookmarkId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${accessToken}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ title, url, notes: notes || null })
        });

        if (response.ok) {
            showToast('Bookmark updated!', 'success');
            document.getElementById('edit-modal').close();
            loadBookmarks();
        } else {
            showToast('Failed to update bookmark', 'error');
        }
    } catch (error) {
        showToast('Failed to update bookmark', 'error');
    }

    editBookmarkId = null;
}

async function deleteBookmark(id) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/bookmarks?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'apikey': SUPABASE_ANON_KEY
            }
        });

        if (response.ok) {
            showToast('Bookmark deleted', 'success');
            // Reload bookmarks (will also update count via content-range)
            loadBookmarks();
        } else {
            showToast('Failed to delete bookmark', 'error');
        }
    } catch (error) {
        showToast('Failed to delete bookmark', 'error');
    }

    deleteBookmarkId = null;
}

// ============================================
// FORM MESSAGES
// ============================================

function showFormMessage(message, type) {
    const messageDiv = document.getElementById('form-message');
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-error',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';

    messageDiv.className = `alert ${alertClass}`;
    messageDiv.innerHTML = `
        <span class="loading loading-spinner loading-sm"></span>
        <span>${escapeHtml(message)}</span>
    `;
}

function hideFormMessage() {
    const messageDiv = document.getElementById('form-message');
    messageDiv.className = 'hidden';
    messageDiv.innerHTML = '';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
}

function getDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return url;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
