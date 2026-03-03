function editSecurity() {
	// Check if user is Sys Admin
	if (!checkSystemAdministratorRole()) {
		showToast('System Administrator role required for this action.', 'error', 4000);
		return;
	}
	
	// State management
	let selectedUserId = null;
	let selectedUserFullName = null;	
	let selectedBusinessUnitId = null;
	let currentBusinessUnitName = null;
	
	// Tab states
	let activeTab = 'businessunit';
	
	// Business Unit state
	let newBusinessUnitId = null;
	let businessUnitAction = null; 
	
	// Teams state
	let currentTeamIds = [];
	let teamsToAdd = [];
	let teamsToRemove = [];
	let teamAction = null; 
	
	// Roles state
	let currentRoleIds = [];
	let rolesToAdd = [];
	let rolesToRemove = [];
	let roleAction = null; 
	
	// Data cache
	let allBusinessUnits = [];
	let allTeams = [];
	let allRoles = [];
	
	/*Create the main popup with modern tabbed interface */
	function createSecurityPopup() {
		const popup = document.createElement('div');
		popup.className = 'commonPopup';
		
		popup.innerHTML = `
	    <div class="commonPopup-header">
	      <span style="color: white;">Assign User Security</span>
	      <span class="close-button">&times;</span>
	    </div>
		<div class="popup-body">
			<div class="assignSecurity-layout" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;">
					<!-- User Selection Panel -->
					<div class="user-selection-panel">
						<div class="panel-header">
							<h3>Select User</h3>
							<input type="text" id="userSearchInput" placeholder="Search users..." class="search-input">
	              </div>
						<div class="user-list-scroll" id="userList"></div>
						<div class="selected-user-info" id="selectedUserInfo" style="display: none;">
							<div class="info-label">Selected User:</div>
							<div class="info-value" id="selectedUserName"></div>
	              </div>
	            </div> 					
					<!-- Security Management Panel -->
					<div class="security-panel">
						<div id="securityContent" class="security-empty-state">
							<div class="empty-state-icon">
								<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
									<path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
									<path d="M8 11V7a4 4 0 118 0v4"/>
	                    </svg>
	                </div>
							<h3>Select a User to Manage Security</h3>
							<p>Choose a user from the list to view and modify their security settings</p>
	          </div>
	        </div>
	      </div>
	    </div>
	  `;
	  
		// Remove existing popups
		document.querySelectorAll('.commonPopup').forEach(p => p.remove());
		
		popup.setAttribute('data-popup-id', 'assignSecurity');
		document.body.appendChild(popup);
		
		// Close button
		const closeButton = popup.querySelector('.close-button');
		closeButton.addEventListener('click', () => popup.remove());
	  closeButton.addEventListener('mouseenter', function() {
	    this.style.backgroundColor = '#e81123';
	  });
	  closeButton.addEventListener('mouseleave', function() {
	    this.style.backgroundColor = 'transparent';
	  });
	  
		makePopupMovable(popup);
		
		return popup;
	}
	
	//Load and display users in the left panel
	function loadUsers(users) {
		const userList = document.getElementById('userList');
		if (!userList || !users || !users.entities) return;
		
		// Format and sort users
		users.entities.forEach(user => {
			const firstName = user.firstname || '';
			const lastName = user.lastname || '';
			user.displayName = `${firstName} ${lastName}`.trim() || user.fullname || 'Unknown User';
		});
		
		users.entities.sort((a, b) => a.displayName.localeCompare(b.displayName));
		
		// Render user list
		userList.innerHTML = '';
		users.entities.forEach(user => {
			const userDiv = document.createElement('div');
			userDiv.className = 'user-item';
			userDiv.dataset.userId = user.systemuserid;
			userDiv.dataset.searchText = user.displayName.toLowerCase();
			userDiv.innerHTML = `
				<div class="user-name">${user.displayName}</div>
			`;
			
			userDiv.addEventListener('click', () => selectUser(user));
			userList.appendChild(userDiv);
		});
		
		// Search functionality
		const searchInput = document.getElementById('userSearchInput');
		searchInput.addEventListener('input', function() {
			const query = this.value.toLowerCase().trim();
			document.querySelectorAll('.user-item').forEach(item => {
				const matches = item.dataset.searchText.includes(query);
				item.style.display = matches ? 'flex' : 'none';
			});
		});
	}
	
	//Handle user selection
	async function selectUser(user, preserveTab = false) {
		// Update UI
		document.querySelectorAll('.user-item').forEach(el => el.classList.remove('selected'));
		const userDiv = document.querySelector(`[data-user-id="${user.systemuserid}"]`);
		if (userDiv) userDiv.classList.add('selected');
		
		// Update state
		selectedUserId = user.systemuserid;
		selectedUserFullName = user.displayName || user.fullname;
		selectedBusinessUnitId = user._businessunitid_value;
		
		// Show selected user info
		document.getElementById('selectedUserInfo').style.display = 'block';
		document.getElementById('selectedUserName').textContent = selectedUserFullName;
		
		// Store current tab if preserving
		const currentTab = preserveTab ? activeTab : null;
		
		// Reset all states
		resetAllStates();
		
		// Restore tab if preserving
		if (currentTab) {
			activeTab = currentTab;
		}
		
		// Load user security data
		showLoadingDialog('Loading user security information...');
		
		try {
			await Promise.all([
				loadUserBusinessUnit(user.systemuserid),
				loadUserTeams(user.systemuserid),
				loadUserRoles(user.systemuserid)
			]);
			
			closeLoadingDialog();
			
			// Show security management interface
			renderSecurityManagement();
		} catch (error) {
			closeLoadingDialog();
			console.error('Error loading user security:', error);
			showToast('Error loading user security information', 'error', 3000);
		}
	}
	
	//Reset all state variables
	function resetAllStates() {
		activeTab = 'businessunit';
		newBusinessUnitId = null;
		businessUnitAction = null;
		
		teamsToAdd = [];
		teamsToRemove = [];
		teamAction = null;
		
		rolesToAdd = [];
		rolesToRemove = [];
		roleAction = null;
	}
	
	//Clear selections  
	function clearTabSelections(tabName) {
		if (tabName === 'businessunit') {
			newBusinessUnitId = null;
			businessUnitAction = null;
		} else if (tabName === 'teams') {
			teamsToAdd = [];
			teamsToRemove = [];
			teamAction = null;
		} else if (tabName === 'roles') {
			rolesToAdd = [];
			rolesToRemove = [];
			roleAction = null;
		}
		updateActionButtons();
	}
	
	//Reset 
	function resetModifications() {
		// Reset Business Unit modifications
		newBusinessUnitId = null;
		businessUnitAction = null;
		
		// Reset Team modifications
		teamsToAdd = [];
		teamsToRemove = [];
		teamAction = null;
		
		// Reset Role modifications
		rolesToAdd = [];
		rolesToRemove = [];
		roleAction = null;
		
		// Clear visual selections
		document.querySelectorAll('.bu-item').forEach(el => el.classList.remove('selected'));
		document.querySelectorAll('.team-item').forEach(el => el.classList.remove('selected'));
		document.querySelectorAll('.role-item').forEach(el => el.classList.remove('selected'));
		
		// Uncheck all radio buttons
		document.querySelectorAll('input[name="buAction"]').forEach(radio => radio.checked = false);
		document.querySelectorAll('input[name="teamAction"]').forEach(radio => radio.checked = false);
		document.querySelectorAll('input[name="roleAction"]').forEach(radio => radio.checked = false);
		
		// Update counters
		updateSelectionCounter('teams');
		updateSelectionCounter('roles');
	}
	
	//Load business unit
	function loadUserBusinessUnit(userId) {
		return new Promise((resolve) => {
			fetchBusinessUnitName(userId, function(response) {
				if (response && response.entities && response.entities[0]) {
					currentBusinessUnitName = response.entities[0].businessunitid?.name || 'N/A';
				}
				resolve();
			});
		});
	}
	
	//Load teams
	function loadUserTeams(userId) {
		return new Promise((resolve) => {
			fetchTeamsForUser(userId, function(response) {
				currentTeamIds = [];
				if (response && response.entities && response.entities[0]) {
					const teams = response.entities[0].teammembership_association || [];
					currentTeamIds = teams.map(team => ({
						id: team.teamid,
						name: team.name,
						type: team['teamtype@OData.Community.Display.V1.FormattedValue'] || 'Unknown'
					}));
				}
				resolve();
			});
		});
	}
	
	//Load roles	 
	function loadUserRoles(userId) {
		return new Promise((resolve) => {
			fetchRolesForUser(userId, async function(response) {
				currentRoleIds = [];
				if (response && response.entities) {
					const rolePromises = response.entities.map(role => {
						return Xrm.WebApi.retrieveRecord("role", role.roleid, "?$select=name,roleid")
							.then(roleDetail => {
								currentRoleIds.push({
									id: roleDetail.roleid,
									name: roleDetail.name
								});
							});
					});
					await Promise.all(rolePromises);
					currentRoleIds.sort((a, b) => a.name.localeCompare(b.name));
				}
				resolve();
			});
		});
	}
	
	//Render the main security
	function renderSecurityManagement() {
		const securityContent = document.getElementById('securityContent');
		
		// Check if tabs already exist
		const existingTabs = securityContent.querySelector('.tab-navigation');		
		if (!existingTabs) {			
			securityContent.className = 'security-content';			
			securityContent.innerHTML = `
			<!-- Tab Navigation -->
			<div class="tab-navigation">
				<div class="tabs-left">
					<button class="tab-btn ${activeTab === 'businessunit' ? 'active' : ''}" data-tab="businessunit">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
						</svg>
						Business Unit
					</button>
					<button class="tab-btn ${activeTab === 'teams' ? 'active' : ''}" data-tab="teams">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
							<circle cx="9" cy="7" r="4"/>
							<path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
						</svg>
						Teams
					</button>
					<button class="tab-btn ${activeTab === 'roles' ? 'active' : ''}" data-tab="roles">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
							<path d="M8 11V7a4 4 0 118 0v4"/>
						</svg>
						Security Roles
					</button>
				</div>
				<div class="update-indicator" id="updateIndicator" style="display: none;">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
						<polyline points="20 6 9 17 4 12"/>
					</svg>
					<span id="updateIndicatorText">Updated</span>
				</div>
			</div>
				
				<!-- Tab Content -->
				<div class="tab-content" id="tabContent"></div>
				
				<!-- Action Buttons -->
				<div class="action-buttons">
					<button id="applyChangesBtn" class="btn-primary" style="display: none;">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="20 6 9 17 4 12"/>
						</svg>
						Apply Changes
					</button>
					<button id="resetChangesBtn" class="btn-secondary" style="display: none;">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"/>
							<path d="M21 3v5h-5"/>
						</svg>
						Reset
					</button>
				</div>
			`;
			
			//Click handlers
			securityContent.querySelectorAll('.tab-btn').forEach(btn => {
				btn.addEventListener('click', () => {
					const previousTab = activeTab;
					activeTab = btn.dataset.tab;
					
					// Clear selections 
					if (previousTab !== activeTab) {
						clearTabSelections(previousTab);
					}					
					updateActiveTab();
						});
					});
					
			// Attach button handlers
			document.getElementById('applyChangesBtn').addEventListener('click', handleApplyChanges);
			document.getElementById('resetChangesBtn').addEventListener('click', handleResetChanges);
		}
		
		// Render active tab
		updateActiveTab();
	}
	
	//Update the active tab display
	function updateActiveTab() {		
		document.querySelectorAll('.tab-btn').forEach(btn => {
			btn.classList.toggle('active', btn.dataset.tab === activeTab);
		});
		
		// Render tab content
		const tabContent = document.getElementById('tabContent');
		switch (activeTab) {
			case 'businessunit':
				renderBusinessUnitTab(tabContent);
				break;
			case 'teams':
				renderTeamsTab(tabContent);
				break;
			case 'roles':
				renderRolesTab(tabContent);
				break;
		}
		
		updateActionButtons();
	}
	
	//Render Business Unit tab
	function renderBusinessUnitTab(container) {
		container.innerHTML = `
			<div class="tab-panel">
				<div class="panel-section current-section-inline">
					<h4>Current Business Unit: <span class="current-value-inline">${currentBusinessUnitName || 'N/A'}</span></h4>
				</div>
				
				<div class="panel-section">
					<h4>Change Business Unit</h4>
					<input type="text" id="buSearchInput" placeholder="Search business units..." class="search-input">
					<div class="selection-list" id="buList"></div>
				</div>
			</div>
		`;		
		
		businessUnitAction = 'change';				
		allBusinessUnits = [];
		fetchBusinessUnits(function(response) {
			if (response && response.entities) {
				allBusinessUnits = response.entities.sort((a, b) => a.name.localeCompare(b.name));
				renderBusinessUnitList();
			}
		});
	}
	
	//Render business unit
	function renderBusinessUnitList() {
		const buList = document.getElementById('buList');
		if (!buList) return;		
		buList.innerHTML = '';
		allBusinessUnits.forEach(bu => {
			const buDiv = document.createElement('div');
			buDiv.className = 'bu-item selectable-item';
			if (newBusinessUnitId === bu.businessunitid) {
				buDiv.classList.add('selected');
			}
			buDiv.dataset.searchText = bu.name.toLowerCase();
			buDiv.innerHTML = `<span>${bu.name}</span>`;
			
			buDiv.addEventListener('click', () => {
				newBusinessUnitId = bu.businessunitid;
				document.querySelectorAll('.bu-item').forEach(el => el.classList.remove('selected'));
				buDiv.classList.add('selected');
				updateActionButtons();
			});
			
			buList.appendChild(buDiv);
		});
		
		//Search
		const searchInput = document.getElementById('buSearchInput');
		if (searchInput) {
			searchInput.addEventListener('input', function() {
				const query = this.value.toLowerCase().trim();
				document.querySelectorAll('.bu-item').forEach(item => {
					const matches = item.dataset.searchText.includes(query);
					item.style.display = matches ? 'flex' : 'none';
				});
			});
		}
	}
	
	//Render Teams tab
	function renderTeamsTab(container) {
		container.innerHTML = `
			<div class="tab-panel">
				<div class="panel-section current-section">
					<h4>Current Teams</h4>
					<div class="current-items-list">
						${currentTeamIds.length > 0 
							? currentTeamIds.map(team => `
								<div class="current-item">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
										<polyline points="20 6 9 17 4 12"/>
									</svg>
									<span>${team.name} <em>(${team.type})</em></span>
								</div>
							`).join('')
							: '<div class="empty-message">No teams assigned</div>'
						}
					</div>
				</div>
				
				<div class="panel-section">
					<div class="section-title-with-actions">
						<h4>Modify Teams</h4>
						<div class="action-selector inline">
							<label class="radio-option">
								<input type="radio" name="teamAction" value="add" ${teamAction === 'add' ? 'checked' : ''}>
								<span>Add</span>
							</label>
							<label class="radio-option">
								<input type="radio" name="teamAction" value="remove" ${teamAction === 'remove' ? 'checked' : ''}>
								<span>Remove</span>
							</label>
							<label class="radio-option">
								<input type="radio" name="teamAction" value="replace" ${teamAction === 'replace' ? 'checked' : ''}>
								<span>Replace All</span>
							</label>
						</div>
						<div class="selection-counter" id="teamsCounter" style="display: none;">
							<span id="teamsCounterText">0 selected</span>
						</div>
					</div>
					
					<div id="teamSelectionArea" style="display: ${teamAction ? 'block' : 'none'};">
						<input type="text" id="teamSearchInput" placeholder="Search teams..." class="search-input">
						<div class="selection-list" id="teamList"></div>
					</div>
				</div>
			</div>
		`;
		
		//Load teams & clear cache
		allTeams = [];
		fetchTeams(function(response) {
			if (response && response.entities) {
				allTeams = response.entities
					.map(team => ({
						id: team.teamid,
						name: team.name,
						businessUnit: team.businessunitid?.name || 'N/A'
					}))
					.sort((a, b) => a.name.localeCompare(b.name));
				renderTeamList();
			}
		});
		
		//Event handlers
		container.querySelectorAll('input[name="teamAction"]').forEach(radio => {
			radio.addEventListener('change', function() {
				teamAction = this.value;
				const selectionArea = document.getElementById('teamSelectionArea');
				selectionArea.style.display = 'block';
				teamsToAdd = [];
				teamsToRemove = [];
				document.querySelectorAll('.team-item').forEach(el => el.classList.remove('selected'));
				renderTeamList(); 
				updateSelectionCounter('teams');
				updateActionButtons();
			});
		});
	}
	
	//Render team list
	function renderTeamList() {
		const teamList = document.getElementById('teamList');
		if (!teamList) return;		
		teamList.innerHTML = '';
		allTeams.forEach(team => {
			const teamDiv = document.createElement('div');
			teamDiv.className = 'team-item selectable-item';
			teamDiv.dataset.teamId = team.id;
			teamDiv.dataset.searchText = `${team.name} ${team.businessUnit}`.toLowerCase();
			
			//if selected
			const isAddSelected = teamsToAdd.includes(team.id);
			const isRemoveSelected = teamsToRemove.includes(team.id);
			if (isAddSelected || isRemoveSelected) {
				teamDiv.classList.add('selected');
			}			
			teamDiv.innerHTML = `
				<span>${team.name}</span>
				<small>BU: ${team.businessUnit}</small>
			`;
			
			teamDiv.addEventListener('click', () => {
				if (teamAction === 'add' || teamAction === 'replace') {
					const index = teamsToAdd.indexOf(team.id);
					if (index > -1) {
						teamsToAdd.splice(index, 1);
						teamDiv.classList.remove('selected');
					} else {
						teamsToAdd.push(team.id);
						teamDiv.classList.add('selected');
					}
				} else if (teamAction === 'remove') {
					const index = teamsToRemove.indexOf(team.id);
					if (index > -1) {
						teamsToRemove.splice(index, 1);
						teamDiv.classList.remove('selected');
					} else {
						teamsToRemove.push(team.id);
						teamDiv.classList.add('selected');
					}
				}
				updateSelectionCounter('teams');
				updateActionButtons();
			});
			
			teamList.appendChild(teamDiv);
		});
		
		//Search
		const searchInput = document.getElementById('teamSearchInput');
		if (searchInput) {
			searchInput.addEventListener('input', function() {
				const query = this.value.toLowerCase().trim();
				document.querySelectorAll('.team-item').forEach(item => {
					const matches = item.dataset.searchText.includes(query);
					item.style.display = matches ? 'flex' : 'none';
				});
			});
		}
	}
	
	//Render Roles
	function renderRolesTab(container) {
		container.innerHTML = `
			<div class="tab-panel">
				<div class="panel-section current-section">
					<h4>Current Security Roles</h4>
					<div class="current-items-list">
						${currentRoleIds.length > 0 
							? currentRoleIds.map(role => `
								<div class="current-item">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
										<polyline points="20 6 9 17 4 12"/>
									</svg>
									<span>${role.name}</span>
								</div>
							`).join('')
							: '<div class="empty-message">No roles assigned</div>'
						}
					</div>
				</div>
				
				<div class="panel-section">
					<div class="section-title-with-actions">
						<h4>Modify Security Roles</h4>
						<div class="action-selector inline">
							<label class="radio-option">
								<input type="radio" name="roleAction" value="add" ${roleAction === 'add' ? 'checked' : ''}>
								<span>Add</span>
							</label>
							<label class="radio-option">
								<input type="radio" name="roleAction" value="remove" ${roleAction === 'remove' ? 'checked' : ''}>
								<span>Remove</span>
							</label>
							<label class="radio-option">
								<input type="radio" name="roleAction" value="replace" ${roleAction === 'replace' ? 'checked' : ''}>
								<span>Replace All</span>
							</label>
						</div>
						<div class="selection-counter" id="rolesCounter" style="display: none;">
							<span id="rolesCounterText">0 selected</span>
						</div>
					</div>
					
					<div id="roleSelectionArea" style="display: ${roleAction ? 'block' : 'none'};">
						<input type="text" id="roleSearchInput" placeholder="Search roles..." class="search-input">
						<div class="selection-list" id="roleList"></div>
					</div>
				</div>
			</div>
		`;
		
		//Load roles based on current or new business unit
		const targetBU = newBusinessUnitId || selectedBusinessUnitId;
		if (targetBU) {
			// Clear the cache
			allRoles = [];
			
			fetchSecurityRoles(targetBU, function(response) {
				if (response && response.entities) {
					allRoles = response.entities
						.map(role => ({
							id: role.roleid,
							name: role.name
						}))
						.sort((a, b) => a.name.localeCompare(b.name));
					renderRoleList();
				}
			});
		}
		
		//Event handlers
		container.querySelectorAll('input[name="roleAction"]').forEach(radio => {
			radio.addEventListener('change', function() {
				roleAction = this.value;
				const selectionArea = document.getElementById('roleSelectionArea');
				selectionArea.style.display = 'block';
				rolesToAdd = [];
				rolesToRemove = [];
				document.querySelectorAll('.role-item').forEach(el => el.classList.remove('selected'));
				renderRoleList(); // Re-render to clear selections
				updateSelectionCounter('roles');
				updateActionButtons();
			});
		});
	}
	
	//Render role list
	function renderRoleList() {
		const roleList = document.getElementById('roleList');
		if (!roleList) return;
		
		roleList.innerHTML = '';
		allRoles.forEach(role => {
			const roleDiv = document.createElement('div');
			roleDiv.className = 'role-item selectable-item';
			roleDiv.dataset.roleId = role.id;
			roleDiv.dataset.searchText = role.name.toLowerCase();
			
			//If selected
			const isAddSelected = rolesToAdd.includes(role.id);
			const isRemoveSelected = rolesToRemove.includes(role.id);
			if (isAddSelected || isRemoveSelected) {
				roleDiv.classList.add('selected');
			}			
			roleDiv.innerHTML = `<span>${role.name}</span>`;			
			roleDiv.addEventListener('click', () => {
				if (roleAction === 'add' || roleAction === 'replace') {
					const index = rolesToAdd.indexOf(role.id);
					if (index > -1) {
						rolesToAdd.splice(index, 1);
						roleDiv.classList.remove('selected');
					} else {
						rolesToAdd.push(role.id);
						roleDiv.classList.add('selected');
					}
				} else if (roleAction === 'remove') {
					const index = rolesToRemove.indexOf(role.id);
					if (index > -1) {
						rolesToRemove.splice(index, 1);
						roleDiv.classList.remove('selected');
					} else {
						rolesToRemove.push(role.id);
						roleDiv.classList.add('selected');
					}
				}
				updateSelectionCounter('roles');
				updateActionButtons();
			});
			
			roleList.appendChild(roleDiv);
		});
		
		// Search functionality
		const searchInput = document.getElementById('roleSearchInput');
		if (searchInput) {
			searchInput.addEventListener('input', function() {
				const query = this.value.toLowerCase().trim();
				document.querySelectorAll('.role-item').forEach(item => {
					const matches = item.dataset.searchText.includes(query);
					item.style.display = matches ? 'flex' : 'none';
				});
			});
		}
	}
	
	//Show update indicator
	function showUpdateIndicator(updatedItems) {
		const indicator = document.getElementById('updateIndicator');
		const indicatorText = document.getElementById('updateIndicatorText');		
		if (!indicator || !indicatorText) return;		
		
		let message = 'Updated';
		if (updatedItems.length > 0) {
			message = `${updatedItems.join(' & ')} Updated`;
		}
		
		indicatorText.textContent = message;
		indicator.style.display = 'flex';
		
		// Animation class
		indicator.classList.add('show-indicator');
		
		// Hide after 4Sec
		setTimeout(() => {
			indicator.classList.remove('show-indicator');
			setTimeout(() => {
				indicator.style.display = 'none';
			}, 300);
		}, 4000);
	}
	
	//Update selection counter
	function updateSelectionCounter(type) {
		if (type === 'teams') {
			const counter = document.getElementById('teamsCounter');
			const counterText = document.getElementById('teamsCounterText');
			if (counter && counterText) {
				const count = teamsToAdd.length + teamsToRemove.length;
				if (count > 0) {
					counterText.textContent = `${count} selected`;
					counter.style.display = 'flex';
				} else {
					counter.style.display = 'none';
				}
			}
		} else if (type === 'roles') {
			const counter = document.getElementById('rolesCounter');
			const counterText = document.getElementById('rolesCounterText');
			if (counter && counterText) {
				const count = rolesToAdd.length + rolesToRemove.length;
				if (count > 0) {
					counterText.textContent = `${count} selected`;
					counter.style.display = 'flex';
				} else {
					counter.style.display = 'none';
				}
			}
		}
	}
	
	//Update action buttons visibility
	function updateActionButtons() {
		const applyBtn = document.getElementById('applyChangesBtn');
		const resetBtn = document.getElementById('resetChangesBtn');		
		if (!applyBtn || !resetBtn) return;		
		const hasChanges = 
			(businessUnitAction === 'change' && newBusinessUnitId) ||
			(teamAction === 'add' && teamsToAdd.length > 0) ||
			(teamAction === 'remove' && teamsToRemove.length > 0) ||
			(teamAction === 'replace' && teamsToAdd.length > 0) ||
			(roleAction === 'add' && rolesToAdd.length > 0) ||
			(roleAction === 'remove' && rolesToRemove.length > 0) ||
			(roleAction === 'replace' && rolesToAdd.length > 0);
		
		applyBtn.style.display = hasChanges ? 'flex' : 'none';
		resetBtn.style.display = hasChanges ? 'flex' : 'none';
	}
	
	//Apply changes
	async function handleApplyChanges() {
		if (!selectedUserId) {
			showToast('Please select a user first.', 'warning', 3000);
			return;
		}		
		const hasValidChanges = validateChanges();
		if (!hasValidChanges) {
			showToast('Please select at least one valid change to apply.', 'warning', 3000);
	        return;
	    }		
		try {
			showLoadingDialog('Applying security changes...');						
			let updatedItems = [];						
			if (businessUnitAction === 'change' && newBusinessUnitId) {
				await updateUserDetails(selectedUserId, newBusinessUnitId, [], [], 'ChangeBU');
				updatedItems.push('Business Unit');
			}			
			// Apply team changes
			if (teamAction === 'add' && teamsToAdd.length > 0) {
				await updateUserDetails(selectedUserId, null, teamsToAdd, [], 'AddTeams');
				updatedItems.push('Teams');
			} else if (teamAction === 'remove' && teamsToRemove.length > 0) {
				await updateUserDetails(selectedUserId, null, teamsToRemove, [], 'RemoveTeams');
				updatedItems.push('Teams');
			} else if (teamAction === 'replace' && teamsToAdd.length > 0) {
				await updateUserDetails(selectedUserId, null, [], [], 'RemoveAllTeams');
				await updateUserDetails(selectedUserId, null, teamsToAdd, [], 'AddTeams');
				updatedItems.push('Teams');
			}			
			// Apply role changes
			if (roleAction === 'add' && rolesToAdd.length > 0) {
				await updateUserDetails(selectedUserId, null, [], rolesToAdd, 'AddRoles');
				updatedItems.push('Security Roles');
			} else if (roleAction === 'remove' && rolesToRemove.length > 0) {
				await updateUserDetails(selectedUserId, null, [], rolesToRemove, 'RemoveRoles');
				updatedItems.push('Security Roles');
			} else if (roleAction === 'replace' && rolesToAdd.length > 0) {
				await updateUserDetails(selectedUserId, null, [], [], 'RemoveAllRoles');
				await updateUserDetails(selectedUserId, null, [], rolesToAdd, 'AddRoles');
				updatedItems.push('Security Roles');
			}
			
			closeLoadingDialog();						
			showUpdateIndicator(updatedItems);
			
			// Reload user data
			const user = { 
				systemuserid: selectedUserId, 
				displayName: selectedUserFullName,
				_businessunitid_value: selectedBusinessUnitId
			};
			await selectUser(user, true); 			
		} catch (error) {
			closeLoadingDialog();
			console.error('Error applying changes:', error);
			showToast('Error applying security changes. Please try again.', 'error', 4000);
		}
	}
	
	//Validate changes
	function validateChanges() {
		if (businessUnitAction === 'change' && newBusinessUnitId) return true;
		if (teamAction === 'add' && teamsToAdd.length > 0) return true;
		if (teamAction === 'remove' && teamsToRemove.length > 0) return true;
		if (teamAction === 'replace' && teamsToAdd.length > 0) return true;
		if (roleAction === 'add' && rolesToAdd.length > 0) return true;
		if (roleAction === 'remove' && rolesToRemove.length > 0) return true;
		if (roleAction === 'replace' && rolesToAdd.length > 0) return true;
		return false;
	}
	
	//Reset changes
	function handleResetChanges() {
		resetModifications();
		updateActiveTab();
	}
	
	// Initialize popup
	createSecurityPopup();
	
	// Initial data
	 Promise.all([
	    new Promise(resolve => fetchUsers(resolve)),
		new Promise(resolve => fetchBusinessUnits(resolve))
	]).then(([users, businessUnits]) => {
	    if (!users || !users.entities || users.entities.length === 0) {
	        showToast('No users found. Please check your permissions.', 'error', 3000);
	        return;
	    }		
		loadUsers(users);		
		if (businessUnits && businessUnits.entities) {
			allBusinessUnits = businessUnits.entities.sort((a, b) => a.name.localeCompare(b.name));
		}
	 }).catch(error => {
	    console.error('Error initializing Assign Security:', error);
	    showToast('Failed to load security data. Please check your permissions and try again.', 'error', 4000);
	 });
}
