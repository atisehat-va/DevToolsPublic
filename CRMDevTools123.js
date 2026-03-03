(function () {
	try {
		var raw = localStorage.getItem('devplus_impersonate_session');
		if (!raw) return;
		var data = JSON.parse(raw);
		if (!data || !data.id) return;
		var uid = data.id;
		var API = '/api/data/';
		var HDR = 'MSCRMCallerID';
		if (window.__devplusImpersonating) return;
		window.__devplusImpersonating = true;
		var oFetch = window.fetch;
		window.__devplusOrigFetch = oFetch;
	window.fetch = function (input, init) {
		var url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
		if (!url || url.indexOf(API) === -1) return oFetch.call(window, input, init);
		var opts = init ? Object.assign({}, init) : {};
		var hdrs = {};
		if (input instanceof Request && input.headers) {
			try { input.headers.forEach(function (v, k) { hdrs[k] = v; }); } catch(e) {}
		}
		if (opts.headers instanceof Headers) { opts.headers.forEach(function (v, k) { hdrs[k] = v; }); }
		else if (opts.headers) { Object.assign(hdrs, opts.headers); }
		hdrs[HDR] = uid;
		opts.headers = hdrs;
		return oFetch.call(window, input, opts).then(function (resp) {
			if (resp.status === 403 && typeof window.__devplus403Handler === 'function') {
				window.__devplus403Handler();
			}
			return resp;
		});
	};
		var oOpen = XMLHttpRequest.prototype.open;
		var oSend = XMLHttpRequest.prototype.send;
		window.__devplusOrigXHROpen = oOpen;
		window.__devplusOrigXHRSend = oSend;
		XMLHttpRequest.prototype.open = function () {
			this.__xhrUrl = typeof arguments[1] === 'string' ? arguments[1] : '';
			return oOpen.apply(this, arguments);
		};
		XMLHttpRequest.prototype.send = function () {
			if (this.__xhrUrl && this.__xhrUrl.indexOf(API) !== -1) {
				try { this.setRequestHeader(HDR, uid); } catch (e) {}
			}
			return oSend.apply(this, arguments);
		};
	} catch (e) {}
})();

const baseUrl = 'https://atisehat-va.github.io/DevToolsPublic/';
const cacheBuster = '?v=' + new Date().getTime();

window.devplusTrack = (function() {
  var GA_MEASUREMENT_ID = 'G-ZBR94D8S0S';
  var GA_API_SECRET     = '6CE5enB3RrKmaFLqXsrfgg';
  var GA_ENDPOINT       = 'https://www.google-analytics.com/mp/collect'
                        + '?measurement_id=' + GA_MEASUREMENT_ID
                        + '&api_secret='     + GA_API_SECRET;

  var cid = localStorage.getItem('devplus_ga_cid');
  if (!cid) {
    cid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    localStorage.setItem('devplus_ga_cid', cid);
  }

  return function(eventName, params) {
    try {
      var origFetch = window.__devplusOrigFetch || window.fetch;
      origFetch(GA_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          client_id: cid,
          events: [{ name: eventName, params: Object.assign({ engagement_time_msec: 1 }, params || {}) }]
        })
      }).catch(function() {});
    } catch(e) {}
  };
})();

setTimeout(function() { window.devplusTrack('devplus_launch'); }, 0);


function loadCSS(href) {
  const link = document.createElement('link');
  link.href = baseUrl + href + cacheBuster;
  link.rel = 'stylesheet';
  link.type = 'text/css';
  document.head.appendChild(link); 
}

function loadScript(src, callback) {
  const script = document.createElement('script');
  script.src = baseUrl + src + cacheBuster;
  script.onload = callback;
  document.head.appendChild(script);
}

// Load styles
loadCSS('styles/common.css');
loadCSS('styles/tools.css');
loadCSS('styles/sidebar.css');

// Load util
let utilScriptsLoaded = 0;
const totalUtilScripts = 2;

function onUtilScriptLoaded() {
  utilScriptsLoaded++;
  if (utilScriptsLoaded === totalUtilScripts) {    
    loadScript('tools/advancedFind.js');
    loadScript('tools/entityInfo.js');
    loadScript('tools/entityAutomations.js');
    loadScript('tools/fieldsControl.js');
    loadScript('tools/dirtyFields.js');
    loadScript('tools/copySecurity.js');
    loadScript('tools/personaSwitcher.js');
    loadScript('tools/assignSecurity.js');
    loadScript('tools/securityOperations.js');
    loadScript('tools/dateCalculator.js');
    loadScript('tools/openRecord.js');
    loadScript('tools/openWebApi.js');
    loadScript('tools/cloneRecord.js');
    loadScript('tools/commandChecker.js');
    loadScript('tools/performanceDiagnostics.js');
  }
}

loadScript('utils/api.js', onUtilScriptLoaded);
loadScript('utils/ui.js', onUtilScriptLoaded);

// Helper function for D365
function isD365Context() {
  try {    
    if (typeof Xrm === 'undefined' || !Xrm.Utility || !Xrm.Utility.getGlobalContext) {
      return false;
    }
        
    if (typeof Xrm.Page === 'undefined' || !Xrm.Page.context) {
      return false;
    }
        
    var clientUrl = Xrm.Page.context.getClientUrl();
    if (!clientUrl) {
      return false;
    }
        
    var url = window.location.href.toLowerCase();
    var isD365Url = url.includes('dynamics.com') || 
                    url.includes('crm.dynamics.com') ||
                    url.includes('/main.aspx') ||
                    url.includes('/userdefined/') ||
                    (clientUrl && (clientUrl.includes('dynamics.com') || clientUrl.includes('.crm')));
    
    return isD365Url;
  } catch (error) {
    return false;
  }
}

// Helper function for Sys Admin
function checkSystemAdministratorRole() {
  try {
    var roles = Xrm.Utility.getGlobalContext().userSettings.roles;
    for (var i = 0; i < roles.getLength(); i++) {
      var role = roles.get(i);
      if (role.name === "System Administrator") {
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

var _sidebarWidth = 60;

var _d365Selectors = [
  'div[id*="shell-container"]',
  'div[data-id="AppLandingPage"]',
  'div[id*="ApplicationShell"]',
  'div[id*="app-host"]',
  'header[role="banner"]',
  'div[id*="navbar"]',
  'div[id*="navigation"]',
  'nav[role="navigation"]'
];

function findD365Containers() {
  var containers = [];
  var vw = window.innerWidth;

  _d365Selectors.forEach(function(selector) {
    try {
      document.querySelectorAll(selector).forEach(function(el) {
        if (!el || containers.indexOf(el) !== -1) return;
        var rect = el.getBoundingClientRect();
        if (rect.width < vw * 0.8) return;
        var alreadyContained = containers.some(function(c) { return c.contains(el); });
        if (alreadyContained) return;
        containers = containers.filter(function(c) { return !el.contains(c); });
        containers.push(el);
      });
    } catch(e) {}
  });

  if (containers.length === 0) {
    document.querySelectorAll('body > *').forEach(function(el) {
      if (!(el instanceof HTMLElement) || el.id === 'MenuPopup') return;
      var rect = el.getBoundingClientRect();
      var pos = getComputedStyle(el).position;
      if (rect.width >= vw * 0.8 && (pos === 'fixed' || pos === 'absolute' || pos === 'relative')) {
        containers.push(el);
      }
    });
  }

  return containers;
}

function pushContainer(el) {
  if (!el || !document.body.contains(el)) return;
  if (el.getAttribute('data-adminplus-target') === 'true') return;

  var cs = getComputedStyle(el);
  el.setAttribute('data-adminplus-original-right',      el.style.right     || '');
  el.setAttribute('data-adminplus-original-left',       el.style.left      || '');
  el.setAttribute('data-adminplus-original-position',   el.style.position  || '');
  el.setAttribute('data-adminplus-original-boxsizing',  el.style.boxSizing || '');
  el.setAttribute('data-adminplus-computed-position',   cs.position);
  el.setAttribute('data-adminplus-target', 'true');

  el.style.boxSizing = 'border-box';

  if (cs.position === 'fixed' || cs.position === 'absolute') {
    el.style.right = _sidebarWidth + 'px';
    if (!el.style.left || el.style.left === 'auto') {
      el.style.left = '0';
    }
  } else {
    el.style.marginRight = _sidebarWidth + 'px';
  }
}

function restoreContainer(el) {
  if (!el || el.getAttribute('data-adminplus-target') !== 'true') return;

  var origRight      = el.getAttribute('data-adminplus-original-right');
  var origLeft       = el.getAttribute('data-adminplus-original-left');
  var origPosition   = el.getAttribute('data-adminplus-original-position');
  var origBoxSizing  = el.getAttribute('data-adminplus-original-boxsizing');

  origRight     === '' ? el.style.removeProperty('right')      : (el.style.right     = origRight);
  origLeft      === '' ? el.style.removeProperty('left')       : (el.style.left      = origLeft);
  origPosition  === '' ? el.style.removeProperty('position')   : (el.style.position  = origPosition);
  origBoxSizing === '' ? el.style.removeProperty('box-sizing') : (el.style.boxSizing = origBoxSizing);
  el.style.removeProperty('margin-right');

  el.removeAttribute('data-adminplus-target');
  el.removeAttribute('data-adminplus-original-right');
  el.removeAttribute('data-adminplus-original-left');
  el.removeAttribute('data-adminplus-original-position');
  el.removeAttribute('data-adminplus-original-boxsizing');
  el.removeAttribute('data-adminplus-computed-position');

  void el.offsetHeight;
}

function pushAllD365Containers() {
  findD365Containers().forEach(pushContainer);
}

function restoreAllD365Containers() {
  var byAttr = Array.from(document.querySelectorAll('[data-adminplus-target="true"]'));
  byAttr.forEach(restoreContainer);
}

function openPopup() {
  if (!isD365Context()) {
    if (typeof showToast === 'function') {
      showToast('Dev+ can only run inside Dynamics 365. Please open this tool from within your D365 environment.', 'warning', 4000);
    } else {
      setTimeout(function() {
        if (typeof showToast === 'function') {
          showToast('Dev+ can only run inside Dynamics 365. Please open this tool from within your D365 environment.', 'warning', 4000);
        }
      }, 100);
    }
    return;
  }

  if (document.getElementById('MenuPopup')) {
    closePopup();
    return;
  }

  closeSubPopups();

  var popupHtml = `
    <div class="popup">
	<div class="commonPopup-header" onclick="closePopup();" style="cursor: pointer;" title="Click to close">
	    <span class="header-text">Dev<sup>+</sup></span>
	    <span class="header-close">✖</span>
	</div>
	<div class="button-container">
	  <div class="app-grid">
	    <button onclick="devplusTrack('devplus_tool_use',{tool_name:'advanced_find'}); openUrl('advanceFind');" class="app-button" title="Advanced Find">
	      <span class="app-icon">🕵️</span>
	    </button>
	    <button onclick="devplusTrack('devplus_tool_use',{tool_name:'entity_info'}); setTimeout(fetchEntityFields, 0);" class="app-button" title="Entity Info">
	      <span class="app-icon">📋</span>
	    </button>
	    <button onclick="devplusTrack('devplus_tool_use',{tool_name:'open_record'}); openRecord();" class="app-button" title="Open Record">
	      <span class="app-icon">🔍</span>
	    </button>
	    <button onclick="devplusTrack('devplus_tool_use',{tool_name:'clone_record'}); cloneRecord();" class="app-button" title="Clone Record">
	      <span class="app-icon">🧬</span>
	    </button>
	    <button onclick="devplusTrack('devplus_tool_use',{tool_name:'dirty_fields'}); showDirtyFields();" class="app-button" title="Dirty Fields">
	      <span class="app-icon">✏️</span>
	    </button>
	    <button onclick="devplusTrack('devplus_tool_use',{tool_name:'show_hidden'}); showAllTabsAndSections();" class="app-button" title="Show Hidden Items">
	      <span class="app-icon">👁️</span>
	    </button>
	    <button onclick="devplusTrack('devplus_tool_use',{tool_name:'unlock_fields'}); unlockAllFields();" class="app-button" title="Unlock Fields">
	      <span class="app-icon">🔓</span>
	    </button>
	    <button onclick="devplusTrack('devplus_tool_use',{tool_name:'logical_names'}); renameTabsSectionsFields();" class="app-button" title="Logical Names">
	      <span class="app-icon">🏷️</span>
	    </button>
	    <button onclick="devplusTrack('devplus_tool_use',{tool_name:'table_automations'}); showEntityAutomations();" class="app-button" title="Table Automations">
	      <span class="app-icon">🤖</span>
	    </button>
	    <button onclick="devplusTrack('devplus_tool_use',{tool_name:'persona_switcher'}); personaSwitcher();" class="app-button" title="Persona Switcher">
	      <span class="app-icon">🎭</span>
	    </button>
	    <button onclick="devplusTrack('devplus_tool_use',{tool_name:'assign_security'}); editSecurity();" class="app-button" title="Assign Security">
	      <span class="app-icon">🔑</span>
	    </button>
	    <button onclick="devplusTrack('devplus_tool_use',{tool_name:'copy_security'}); copySecurity();" class="app-button" title="Copy Security">
	      <span class="app-icon">🛡️</span>
	    </button>
	    <button onclick="devplusTrack('devplus_tool_use',{tool_name:'date_calculator'}); dateCalc();" class="app-button" title="Date Calculator">
	      <span class="app-icon">📅</span>
	    </button>
	    <button onclick="devplusTrack('devplus_tool_use',{tool_name:'web_api'}); openWebApi();" class="app-button" title="Open Web API Endpoint">
	      <span class="app-icon">🌐</span>
	    </button>
	    <button onclick="devplusTrack('devplus_tool_use',{tool_name:'command_checker'}); commandChecker();" class="app-button" title="Command Checker">
	      <span class="app-icon">🐛</span>
	    </button>
	    <button onclick="devplusTrack('devplus_tool_use',{tool_name:'performance_diagnostics'}); performanceDiagnostics();" class="app-button" title="Performance Diagnostics">
	      <span class="app-icon">⚡</span>
	    </button>
	  </div>
	</div>
   </div>
  `;

  var newContainer = document.createElement('div');
  newContainer.id = 'MenuPopup';
  newContainer.innerHTML = popupHtml;
  document.body.appendChild(newContainer);

  document.body.classList.add('adminplus-sidebar-open');
  pushAllD365Containers();

  window.adminPlusResizeHandler = function() {
    if (document.getElementById('MenuPopup')) {
      pushAllD365Containers();
    }
  };
  window.addEventListener('resize', window.adminPlusResizeHandler);
}

function closePopup() {
  document.body.classList.remove('adminplus-sidebar-open');

  restoreAllD365Containers();

  if (window.adminPlusResizeHandler) {
    window.removeEventListener('resize', window.adminPlusResizeHandler);
    window.adminPlusResizeHandler = null;
  }

  var menuPopup = document.getElementById('MenuPopup');
  if (menuPopup) menuPopup.remove();

  closeSubPopups();
}

function closeSubPopups() { 
    const popupClasses = ['.commonPopup'];    
    popupClasses.forEach((popupClass) => {
        const popups = document.querySelectorAll(popupClass);
        popups.forEach((popup) => {
            popup.remove();
        });
    });
}

// Global Exports
window.isD365Context = isD365Context;
window.checkSystemAdministratorRole = checkSystemAdministratorRole;
window.fetchEntityFields = fetchEntityFields;
window.showEntityAutomations = showEntityAutomations;
window.unlockAllFields = unlockAllFields;
window.showAllTabsAndSections = showAllTabsAndSections;
window.renameTabsSectionsFields = renameTabsSectionsFields;
window.closePopup = closePopup;
window.openUrl = openUrl;
window.showDirtyFields = showDirtyFields;
window.showToast = showToast;
window.openRecord = openRecord;
window.openWebApi = openWebApi;
window.cloneRecord = cloneRecord;
window.commandChecker = commandChecker;
window.performanceDiagnostics = performanceDiagnostics;
window.dateCalc = dateCalc;
window.personaSwitcher = personaSwitcher;
