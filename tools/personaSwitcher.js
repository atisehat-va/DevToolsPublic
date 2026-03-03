(function () {
	const CALLER_HEADER = 'MSCRMCallerID';
	const SESSION_KEY   = 'devplus_impersonate_session';
	const HISTORY_KEY   = 'devplus_impersonate_history';
	const BANNER_ID     = 'devplus-impersonate-banner';
	const API_PATH      = '/api/data/';
	const MAX_HISTORY   = 10;

	function getSession() {
		try {
			const d = localStorage.getItem(SESSION_KEY);
			return d ? JSON.parse(d) : null;
		} catch (e) { return null; }
	}

	function setSession(userId, userName) {
		localStorage.setItem(SESSION_KEY, JSON.stringify({
			id: userId, name: userName, timestamp: new Date().toISOString()
		}));
	}

	function clearSession() {
		try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
	}

	function getHistory() {
		try {
			const d = localStorage.getItem(HISTORY_KEY);
			return d ? JSON.parse(d) : [];
		} catch (e) { return []; }
	}

	function addToHistory(userId, userName) {
		let h = getHistory().filter(x => x.id !== userId);
		h.unshift({ id: userId, name: userName, lastUsed: new Date().toISOString() });
		if (h.length > MAX_HISTORY) h = h.slice(0, MAX_HISTORY);
		localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
	}

	function applyPatches(userId) {
		const w = window;
		if (w.__devplusImpersonating) return;

		w.__devplusImpersonating = true;
		w.__devplusOrigFetch   = w.fetch;
		w.__devplusOrigXHROpen = w.XMLHttpRequest.prototype.open;
		w.__devplusOrigXHRSend = w.XMLHttpRequest.prototype.send;

		w.XMLHttpRequest.prototype.open = function () {
			this.__xhrUrl = (typeof arguments[1] === 'string') ? arguments[1] : '';
			return w.__devplusOrigXHROpen.apply(this, arguments);
		};

		w.XMLHttpRequest.prototype.send = function () {
			if (this.__xhrUrl && this.__xhrUrl.indexOf(API_PATH) !== -1) {
				try { this.setRequestHeader(CALLER_HEADER, userId); } catch (e) {}
			}
			return w.__devplusOrigXHRSend.apply(this, arguments);
		};

		w.fetch = function (input, init) {
			var url = (typeof input === 'string') ? input
				: (input instanceof Request ? input.url : '');
			if (!url || url.indexOf(API_PATH) === -1) {
				return w.__devplusOrigFetch.call(w, input, init);
			}
			var opts = init ? Object.assign({}, init) : {};
			var hdrs = {};
			if (input instanceof Request && input.headers) {
				try { input.headers.forEach(function (v, k) { hdrs[k] = v; }); } catch(e) {}
			}
			if (opts.headers instanceof Headers) {
				opts.headers.forEach(function (v, k) { hdrs[k] = v; });
			} else if (opts.headers) {
				Object.assign(hdrs, opts.headers);
			}
			hdrs[CALLER_HEADER] = userId;
			opts.headers = hdrs;
			return w.__devplusOrigFetch.call(w, input, opts).then(function (resp) {
				if (resp.status === 403 && typeof w.__devplus403Handler === 'function') {
					w.__devplus403Handler();
				}
				return resp;
			});
		};
	}

	function removePatches() {
		const w = window;
		try {
			if (w.__devplusOrigFetch) {
				w.fetch = w.__devplusOrigFetch;
				delete w.__devplusOrigFetch;
			}
			if (w.__devplusOrigXHROpen) {
				w.XMLHttpRequest.prototype.open = w.__devplusOrigXHROpen;
				delete w.__devplusOrigXHROpen;
			}
			if (w.__devplusOrigXHRSend) {
				w.XMLHttpRequest.prototype.send = w.__devplusOrigXHRSend;
				delete w.__devplusOrigXHRSend;
			}
			delete w.__devplusImpersonating;
		} catch (e) {}
	}

	var bannerObserver = null;

	function showBanner(userName) {
		removeBanner(true);

		const banner = document.createElement('div');
		banner.id = BANNER_ID;
		banner.style.cssText = `
			position: fixed; top: 6px; left: 50%; transform: translateX(-50%); z-index: 999998;
			background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
			color: white; padding: 5px 10px 5px 16px; border-radius: 24px;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
			font-size: 12px; display: flex; align-items: center; gap: 12px;
			box-shadow: 0 2px 12px rgba(220, 38, 38, 0.45);
			animation: devplus-banner-in 0.3s ease-out;
			white-space: nowrap;
		`;
		banner.innerHTML = `
			<div style="display:flex;align-items:center;gap:8px;">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
					<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
				</svg>
				<span>Impersonating: <strong>${userName}</strong></span>
			</div>
			<button id="devplus-banner-stop" style="
				background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.4);
				color:white; padding:3px 12px; border-radius:14px; font-size:11px;
				font-weight:600; cursor:pointer; transition:all 0.2s;
			">Stop</button>
		`;

		if (!document.getElementById('devplus-banner-style')) {
			const s = document.createElement('style');
			s.id = 'devplus-banner-style';
			s.textContent = `
				@keyframes devplus-banner-in {
					from { opacity:0; transform:translateX(-50%) translateY(-20px); }
					to   { opacity:1; transform:translateX(-50%) translateY(0); }
				}
			`;
			document.head.appendChild(s);
		}

		document.body.appendChild(banner);

		const btn = document.getElementById('devplus-banner-stop');
		btn.addEventListener('click', function (e) {
			e.stopPropagation();
			engine.stop();
		});
		btn.addEventListener('mouseenter', function () { this.style.background = 'rgba(255,255,255,0.35)'; });
		btn.addEventListener('mouseleave', function () { this.style.background = 'rgba(255,255,255,0.2)'; });

		if (bannerObserver) bannerObserver.disconnect();
		bannerObserver = new MutationObserver(function () {
			if (!document.getElementById(BANNER_ID)) {
				showBanner(userName);
			}
		});
		bannerObserver.observe(document.body, { childList: true });
	}

	function removeBanner(keepObserver) {
		if (!keepObserver && bannerObserver) { bannerObserver.disconnect(); bannerObserver = null; }
		const b = document.getElementById(BANNER_ID);
		if (b) b.remove();
	}

	function showAccessDeniedOverlay(userName) {
		const OVERLAY_ID = 'devplus-access-denied';
		const prev = document.getElementById(OVERLAY_ID);
		if (prev) prev.remove();

		const el = document.createElement('div');
		el.id = OVERLAY_ID;
		el.style.cssText = `
			position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
			z-index: 999997; background: #1e293b; color: white;
			padding: 24px 28px; border-radius: 10px; border-left: 5px solid #f87171;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
			font-size: 14px; display: flex; align-items: flex-start; gap: 16px;
			box-shadow: 0 8px 40px rgba(0,0,0,0.5); max-width: 480px; width: 90%;
		`;
		el.innerHTML = `
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" style="flex-shrink:0">
				<circle cx="12" cy="12" r="10"/>
				<line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
			</svg>
			<span style="flex:1;line-height:1.5">
				<strong style="color:#f87171">Access Denied</strong> —
				<em>${userName}</em> does not have permission to view this page.
			</span>
			<button id="devplus-access-denied-close" style="
				background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2);
				color:white; padding:4px 12px; border-radius:4px; font-size:11px;
				cursor:pointer; flex-shrink:0; white-space:nowrap;
			">Dismiss</button>
		`;
		document.body.appendChild(el);

		document.getElementById('devplus-access-denied-close')
			.addEventListener('click', () => el.remove());

		const autoDismiss = setTimeout(() => el.remove(), 8000);
		window.addEventListener('popstate', function onNav() {
			clearTimeout(autoDismiss);
			el.remove();
			window.removeEventListener('popstate', onNav);
		});
	}

	function setupAccessDeniedHandler(userName) {
		var timer = null;
		var count = 0;
		window.__devplus403Handler = function () {
			count++;
			clearTimeout(timer);
			timer = setTimeout(function () {
				if (count >= 2) showAccessDeniedOverlay(userName);
				count = 0;
			}, 1500);
		};
	}

	function clearAccessDeniedHandler() {
		window.__devplus403Handler = null;
		const el = document.getElementById('devplus-access-denied');
		if (el) el.remove();
	}

	var _beforeUnload = null;
	var _keyDown      = null;

	function enableRefreshGuard() {
		if (_keyDown) return;

		_beforeUnload = function (e) {
			e.preventDefault();
			e.returnValue = '';
		};

		_keyDown = function (e) {
			var isRefresh = e.key === 'F5' ||
				((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r');
			if (!isRefresh) return;
			e.preventDefault();
			e.stopPropagation();
			if (typeof showToast === 'function') {
				showToast('Refresh blocked — stop impersonation first, then refresh.', 'warning', 3500);
			}
		};

		window.addEventListener('beforeunload', _beforeUnload);
		window.addEventListener('keydown', _keyDown, true);
	}

	function disableRefreshGuard() {
		if (_beforeUnload) { window.removeEventListener('beforeunload', _beforeUnload); _beforeUnload = null; }
		if (_keyDown)      { window.removeEventListener('keydown', _keyDown, true);     _keyDown      = null; }
	}

	function resolveUrlParams() {
		var sources = [window.location.search];
		try { if (window.parent && window.parent !== window) sources.push(window.parent.location.search); } catch (e) {}
		for (var i = 0; i < sources.length; i++) {
			if (!sources[i]) continue;
			var p = new URLSearchParams(sources[i]);
			if (p.get('pagetype') || p.get('etn')) return p;
		}
		return new URLSearchParams(window.location.search);
	}

	function refreshCurrentPage() {
		try {
			if (typeof Xrm === 'undefined') return;

			var params   = resolveUrlParams();
			var pagetype = params.get('pagetype');
			var etn      = params.get('etn');
			var id       = (params.get('id') || '').replace(/[{}]/g, '');

			if (pagetype === 'entityrecord' && etn && id) {
				Xrm.Navigation.openForm({ entityName: etn, entityId: id });
				return;
			}

			if (pagetype === 'entitylist' && etn) {
				Xrm.Navigation.navigateTo({ pageType: 'entitylist', entityName: etn });
				return;
			}

			if (pagetype === 'dashboard') {
				var dashTarget = { pageType: 'dashboard' };
				if (id) dashTarget.dashboardId = id;
				Xrm.Navigation.navigateTo(dashTarget);
				return;
			}

			if (Xrm.Page && Xrm.Page.data && Xrm.Page.data.refresh) {
				Xrm.Page.data.refresh(false).then(function () {
					try { Xrm.Page.ui.refreshRibbon(); } catch (e) {}
				});
			}
		} catch (e) {
			console.warn('[Dev+] Page refresh failed:', e);
		}
	}

	const engine = {
		isActive:   function () { return !!window.__devplusImpersonating; },
		getSession: getSession,
		getHistory: getHistory,

		start: function (userId, userName) {
			applyPatches(userId);
			setSession(userId, userName);
			addToHistory(userId, userName);
			showBanner(userName);
			setupAccessDeniedHandler(userName);
			enableRefreshGuard();
		},

		stop: function (silent) {
			disableRefreshGuard();
			clearAccessDeniedHandler();
			removePatches();
			clearSession();
			removeBanner();
			if (!silent) {
				if (typeof showToast === 'function') {
					showToast('Impersonation stopped. Refreshing page...', 'info', 2000);
				}
				setTimeout(refreshCurrentPage, 800);
			}
		},

		refreshPage: refreshCurrentPage
	};

	const existing = getSession();
	if (existing) {
		applyPatches(existing.id);
		setupAccessDeniedHandler(existing.name);
		enableRefreshGuard();
		var ready = function () {
			showBanner(existing.name);
			setTimeout(refreshCurrentPage, 1000);
		};
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', ready);
		} else {
			ready();
		}
	}

	window.__devplusPersonaEngine = engine;
})();


function personaSwitcher() {
	if (!checkSystemAdministratorRole()) {
		showToast('System Administrator role required for this action.', 'error', 4000);
		return;
	}

	const engine = window.__devplusPersonaEngine;
	const currentUserId = Xrm.Utility.getGlobalContext().userSettings.userId.replace(/[{}]/g, '');

	let selectedUser = null;

	function createPopup() {
		document.querySelectorAll('.commonPopup').forEach(p => p.remove());

		const popup = document.createElement('div');
		popup.className = 'commonPopup';
		popup.setAttribute('data-popup-id', 'personaSwitcher');

		popup.innerHTML = `
			<div class="commonPopup-header">
				<span style="color: white;">Persona Switcher</span>
				<span class="close-button">&times;</span>
			</div>
			<div class="popup-body">
				<div class="persona-layout" id="personaContent">
					<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-style:italic;font-size:14px;">
						Loading...
					</div>
				</div>
			</div>
		`;

		document.body.appendChild(popup);

		const closeBtn = popup.querySelector('.close-button');
		closeBtn.addEventListener('click', () => popup.remove());
		closeBtn.addEventListener('mouseenter', function () { this.style.backgroundColor = '#e81123'; });
		closeBtn.addEventListener('mouseleave', function () { this.style.backgroundColor = 'transparent'; });

		makePopupMovable(popup);
		return popup;
	}

	function renderContent() {
		const content = document.getElementById('personaContent');
		if (engine.isActive()) {
			renderActiveView(content);
		} else {
			renderSelectionView(content);
		}
	}

	function renderActiveView(content) {
		const session = engine.getSession();
		const startedAt = session ? new Date(session.timestamp).toLocaleString() : '';

		content.innerHTML = `
			<div class="persona-header-bar" style="border-bottom-color:#dc2626;">
				<div class="persona-user-badge">
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
						<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
					</svg>
					<span class="persona-badge-name">${session.name}</span>
					<span class="persona-badge-status" style="background:#fee2e2;color:#991b1b;border:1px solid #dc2626;">Impersonating</span>
				</div>
			</div>

			<div class="persona-alert-banner" style="background:#fef2f2;border-bottom-color:#dc2626;">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" style="flex-shrink:0;">
					<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
					<line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
				</svg>
				<div>
					<strong style="color:#991b1b;">Impersonation is active.</strong>
					<span style="color:#b91c1c;">All API calls execute as this user. Started ${startedAt}</span>
				</div>
			</div>

			<div class="persona-body">
				<div class="persona-section">
					<div class="persona-section-title">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2b2b2b" stroke-width="2">
							<path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
							<path d="M8 11V7a4 4 0 118 0v4"/>
						</svg>
						User's Security Roles
					</div>
					<div class="persona-roles-grid" id="activeUserRoles">
						<div class="empty-message" style="grid-column:1/-1;">Loading roles...</div>
					</div>
				</div>

				<div class="persona-info-note">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" style="flex-shrink:0;">
						<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
					</svg>
					<span>Navigate to a different page or form to fully see the impersonated user's experience. Your admin roles are untouched.</span>
				</div>
			</div>

			<div class="persona-footer persona-footer-restore">
				<button id="personaSwitchUserBtn" class="btn-secondary">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
					</svg>
					Switch User
				</button>
				<button id="personaStopBtn" class="btn-primary" style="background:#dc2626!important;">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
					</svg>
					Stop Impersonation
				</button>
			</div>
		`;

		loadUserRoles(session.id).then(roles => {
			const grid = document.getElementById('activeUserRoles');
			if (!grid) return;
			grid.innerHTML = roles.length > 0
				? roles.map(r => `
					<div class="persona-role-chip persona-chip-basic">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5">
							<polyline points="20 6 9 17 4 12"/>
						</svg>
						${r.name}
					</div>`).join('')
				: '<div class="empty-message" style="grid-column:1/-1;">No roles found</div>';
		});

		document.getElementById('personaStopBtn').addEventListener('click', () => {
			document.querySelectorAll('.commonPopup[data-popup-id="personaSwitcher"]').forEach(p => p.remove());
			engine.stop();
		});

		document.getElementById('personaSwitchUserBtn').addEventListener('click', () => {
			engine.stop(true);
			renderSelectionView(document.getElementById('personaContent'));
		});
	}

	function renderSelectionView(content) {
		const history = engine.getHistory();

		content.innerHTML = `
			<div class="persona-header-bar">
				<div class="persona-user-badge">
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2b2b2b" stroke-width="2">
						<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
					</svg>
					<span class="persona-badge-name">Select a User to Impersonate</span>
				</div>
			</div>

			${history.length > 0 ? `
				<div class="persona-recent-bar">
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#444" stroke-width="2" style="flex-shrink:0;">
						<polyline points="12 8 12 12 14 14"/><circle cx="12" cy="12" r="10"/>
					</svg>
					<span style="font-size:11px;font-weight:600;color:#444;text-transform:uppercase;letter-spacing:0.4px;flex-shrink:0;">Recent</span>
					<div class="persona-recent-chips" id="personaRecentChips">
						${history.map(h => `
							<div class="persona-recent-chip" data-user-id="${h.id}" data-user-name="${h.name}">
								${h.name}
							</div>
						`).join('')}
					</div>
				</div>
			` : ''}

			<div class="persona-split">
				<div class="persona-split-left">
					<div class="persona-split-search">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" style="flex-shrink:0;">
							<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
						</svg>
						<input type="text" id="personaUserSearch" placeholder="Search users..." class="persona-split-search-input">
					</div>
					<div class="persona-user-list" id="personaUserList">
						<div class="empty-message">Loading users...</div>
					</div>
				</div>

				<div class="persona-split-right" id="personaUserDetails">
					<div class="persona-split-empty" id="personaDetailEmpty">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d0d0d0" stroke-width="1.5">
							<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
						</svg>
						<span>Select a user</span>
					</div>
					<div id="personaDetailContent" style="display:none;">
						<div class="persona-detail-name" id="personaDetailName"></div>
						<div class="persona-detail-bu" id="personaDetailBU"></div>
						<div class="persona-section-title" style="margin-top:14px;margin-bottom:8px;">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2b2b2b" stroke-width="2">
								<path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
								<path d="M8 11V7a4 4 0 118 0v4"/>
							</svg>
							Security Roles
						</div>
						<div class="persona-roles-grid" id="personaDetailRoles">
							<div class="empty-message" style="grid-column:1/-1;">Loading...</div>
						</div>
					</div>
				</div>
			</div>

			<div class="persona-footer">
				<button id="personaImpersonateBtn" class="btn-primary" disabled style="opacity:0.5;">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
					</svg>
					Start Impersonation
				</button>
			</div>
		`;

		loadUsers();

		const searchInput = document.getElementById('personaUserSearch');
		if (searchInput) {
			searchInput.addEventListener('input', function () {
				const q = this.value.toLowerCase().trim();
				document.querySelectorAll('.persona-user-item').forEach(el => {
					el.style.display = el.dataset.searchText.includes(q) ? 'flex' : 'none';
				});
			});
		}

		document.querySelectorAll('#personaRecentChips .persona-recent-chip').forEach(chip => {
			chip.addEventListener('click', function () {
				selectUser(this.dataset.userId, this.dataset.userName);
			});
		});

		document.getElementById('personaImpersonateBtn').addEventListener('click', handleImpersonate);
	}

	function loadUsers() {
		fetchUsers(function (response) {
			const list = document.getElementById('personaUserList');
			if (!list || !response || !response.entities) return;

			const users = response.entities
				.filter(u => u.systemuserid !== currentUserId)
				.map(u => ({
					id: u.systemuserid,
					name: `${u.firstname || ''} ${u.lastname || ''}`.trim() || u.fullname || 'Unknown'
				}))
				.sort((a, b) => a.name.localeCompare(b.name));

			list.innerHTML = users.map(u => `
				<div class="persona-user-item selectable-item" data-user-id="${u.id}" data-user-name="${u.name}" data-search-text="${u.name.toLowerCase()}">
					<span>${u.name}</span>
				</div>
			`).join('');

			list.querySelectorAll('.persona-user-item').forEach(el => {
				el.addEventListener('click', function () {
					selectUser(this.dataset.userId, this.dataset.userName);
				});
			});
		});
	}

	function loadUserRoles(userId) {
		return new Promise(resolve => {
			fetchRolesForUser(userId, async function (response) {
				const roles = [];
				if (response && response.entities) {
					await Promise.all(response.entities.map(r =>
						Xrm.WebApi.retrieveRecord('role', r.roleid, '?$select=name,roleid')
							.then(d => roles.push({ id: d.roleid, name: d.name }))
					));
					roles.sort((a, b) => a.name.localeCompare(b.name));
				}
				resolve(roles);
			});
		});
	}

	async function selectUser(userId, userName) {
		document.querySelectorAll('.persona-user-item,.persona-recent-chip').forEach(el => el.classList.remove('selected'));
		const el = document.querySelector(`.persona-user-item[data-user-id="${userId}"]`);
		if (el) el.classList.add('selected');
		const chip = document.querySelector(`.persona-recent-chip[data-user-id="${userId}"]`);
		if (chip) chip.classList.add('selected');

		selectedUser = { id: userId, name: userName };

		const btn = document.getElementById('personaImpersonateBtn');
		btn.disabled = false;
		btn.style.opacity = '1';

		const emptyEl = document.getElementById('personaDetailEmpty');
		const contentEl = document.getElementById('personaDetailContent');
		if (emptyEl) emptyEl.style.display = 'none';
		if (contentEl) contentEl.style.display = 'block';

		document.getElementById('personaDetailName').textContent = userName;

		const buEl = document.getElementById('personaDetailBU');
		buEl.innerHTML = '<span style="color:#999;font-size:12px;">Loading...</span>';
		fetchBusinessUnitName(userId, function (res) {
			if (res && res.entities && res.entities[0]) {
				const buName = res.entities[0].businessunitid?.name || 'N/A';
				buEl.innerHTML = `<span style="color:#10b981;">&#9679;</span> ${buName}`;
			}
		});

		const rolesGrid = document.getElementById('personaDetailRoles');
		rolesGrid.innerHTML = '<div class="empty-message" style="grid-column:1/-1;">Loading...</div>';
		const roles = await loadUserRoles(userId);
		rolesGrid.innerHTML = roles.length > 0
			? roles.map(r => `
				<div class="persona-role-chip">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
						<polyline points="20 6 9 17 4 12"/>
					</svg>
					${r.name}
				</div>`).join('')
			: '<div class="empty-message" style="grid-column:1/-1;">No roles assigned</div>';
	}

	function handleImpersonate() {
		if (!selectedUser) {
			showToast('Please select a user first.', 'warning', 3000);
			return;
		}

		engine.start(selectedUser.id, selectedUser.name);
		document.querySelectorAll('.commonPopup[data-popup-id="personaSwitcher"]').forEach(p => p.remove());
		showToast(`Impersonating ${selectedUser.name}. Refreshing page...`, 'success', 2000);
		setTimeout(engine.refreshPage, 800);
	}

	createPopup();
	renderContent();
}
