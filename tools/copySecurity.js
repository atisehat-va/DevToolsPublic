function copySecurity() {
	// Check if Sys Admin
	if (!checkSystemAdministratorRole()) {
		showToast('System Administrator role required for this action.', 'error', 4000);
		return;
	}
	
	let selectedUserId2 = null; 
	let selectedUserName2 = '';
	let selectedUserId = null;
	let selectedUserName = '';
	let selectedBusinessUnitId = null; 
	let selectedTeamIds = []; 
	let selectedRoleIds = [];	
	
	function createAppendSecurityPopup() {		
		var newContainer = document.createElement('div');		
		newContainer.className = 'commonPopup';
		
		newContainer.innerHTML =  `
		  <div class="commonPopup-header">
		    <span style="color: white;">Copy User Security</span>
		    <span class="close-button">&times;</span>
		  </div>
		  <div class="popup-body">
		    <div class="copySecurity-layout" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;">
		      <!-- FROM User Panel -->
		      <div class="user-selection-panel from-panel">
		        <div class="panel-header from-header">
		          <h3>FROM User</h3>
		          <input type="text" id="searchInput1" placeholder="Search users..." class="search-input">
		        </div>
		        <div class="user-list-scroll" id="userList1"></div>
		        <div class="selected-user-info" id="fromUserInfo" style="display: none;">
		          <div class="info-label">Selected:</div>
		          <div class="info-value" id="fromUserName"></div>
		        </div>
		      </div>
		      
		      <!-- Security Details Panel -->
		      <div class="security-details-panel">
		        <div id="securityContent" class="security-empty-state">
		          <div class="empty-state-icon">
		            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
		              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
		              <path d="M8 11V7a4 4 0 118 0v4"/>
		            </svg>
		          </div>
		          <h3 style="font-size: 16px; margin: 10px 0 8px 0;">Select Both Users</h3>
		          <p style="font-size: 13px; margin: 0;">Choose FROM and TO users to compare security</p>
		        </div>
		      </div>
		      
		      <!-- TO User Panel -->
		      <div class="user-selection-panel to-panel">
		        <div class="panel-header to-header">
		          <h3>TO User</h3>
		          <input type="text" id="searchInput2" placeholder="Search users..." class="search-input">
		        </div>
		        <div class="user-list-scroll" id="userList2"></div>
		        <div class="selected-user-info" id="toUserInfo" style="display: none;">
		          <div class="info-label">Selected:</div>
		          <div class="info-value" id="toUserName"></div>
		        </div>
		      </div>
		    </div>
		  </div>
		`;
		
		// Close all popups
		const existingPopups = document.querySelectorAll('.commonPopup');
		existingPopups.forEach(popup => popup.remove());		
		newContainer.setAttribute('data-popup-id', 'copySecurity');
		document.body.appendChild(newContainer);
		
		// Close Btn
		const closeButton = newContainer.querySelector('.close-button');
		closeButton.addEventListener('click', () => {
		  newContainer.remove();
		});
		
		// Hover effect for Close Btn
		closeButton.addEventListener('mouseenter', function() {
		  this.style.backgroundColor = '#e81123';
		});
		closeButton.addEventListener('mouseleave', function() {
		  this.style.backgroundColor = 'transparent';
		});		
		makePopupMovable(newContainer);	
}

	function renderUserList(users, selectUserCallback, sectionId, searchInputId) {
		const userListDiv = document.getElementById(sectionId);
		users.forEach(user => {
			const userDiv = document.createElement('div');
			userDiv.className = 'user-item';
			// Format name as First Name + Last Name
			const firstName = user.firstname || '';
			const lastName = user.lastname || '';
			const displayName = `${firstName} ${lastName}`.trim() || user.fullname || 'Unknown User';
			
			userDiv.dataset.searchText = displayName.toLowerCase();
			userDiv.innerHTML = `<div class="user-name">${displayName}</div>`;
			userDiv.dataset.id = user.systemuserid;
			userDiv.onclick = () => selectUserCallback(user);
			userListDiv.appendChild(userDiv);
		});
	}

	function updateSubmitButtonVisibility() {
		const submitButton = document.getElementById("submitButton");
		
		if (selectedUserId && selectedUserId2) {
			if (submitButton) submitButton.style.display = 'flex';
		} else {
			if (submitButton) submitButton.style.display = 'none';
		}
	}

	function selectUser(user, sectionPrefix) {		
		try {	
			// Update selection visual
			const listId = 'userList' + sectionPrefix;
			document.querySelectorAll(`#${listId} .user-item`).forEach(el => {
				el.classList.remove('selected');
			});
			const userDiv = document.getElementById(listId).querySelector(`[data-id='${user.systemuserid}']`);
			userDiv.classList.add('selected');

			// Update state
			if (sectionPrefix === '1') {
				selectedUserId = user.systemuserid;
				selectedUserName = user.fullname;
				selectedBusinessUnitId = user._businessunitid_value;
				document.getElementById('fromUserInfo').style.display = 'block';
				document.getElementById('fromUserName').textContent = user.fullname;
			} else {
				selectedUserId2 = user.systemuserid;
				selectedUserName2 = user.fullname;
				document.getElementById('toUserInfo').style.display = 'block';
				document.getElementById('toUserName').textContent = user.fullname;
			}

			// Check if both users selected
			if (selectedUserId && selectedUserId2) {
				renderSecurityComparison();
			}
		} catch (e) {
			console.error('Error in selectUser function', e);
		}
	}
	
	async function renderSecurityComparison() {
		const securityContent = document.getElementById('securityContent');
		securityContent.className = 'security-content';
		
		securityContent.innerHTML = `
			<div class="comparison-header">
				<div class="comparison-title">
					<h2>Security to Copy</h2>
					<p>From <strong>${selectedUserName}</strong> to <strong>${selectedUserName2}</strong></p>
				</div>
				<div class="update-indicator" id="copyUpdateIndicator" style="display: none;">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
						<polyline points="20 6 9 17 4 12"/>
					</svg>
					<span id="copyUpdateIndicatorText">Security Copied Successfully</span>
				</div>
			</div>
			
			<div class="comparison-content">
				<!-- Business Unit Section -->
				<div class="comparison-section compact-section">
					<div class="section-title-bar">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
						</svg>
						<span>Business Unit</span>
					</div>
					<div class="horizontal-comparison">
						<div class="comparison-column">
							<div class="comparison-label from-label">FROM</div>
							<div class="comparison-value from-value" id="fromBusinessUnit">
								<div class="loading-spinner">Loading...</div>
							</div>
						</div>
						<div class="arrow-right">→</div>
						<div class="comparison-column">
							<div class="comparison-label to-label">TO</div>
							<div class="comparison-value to-value" id="toBusinessUnit">
								<div class="loading-spinner">Loading...</div>
							</div>
						</div>
					</div>
				</div>
				
				<!-- Teams Section -->
				<div class="comparison-section">
					<div class="section-title-bar">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
							<circle cx="9" cy="7" r="4"/>
							<path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
						</svg>
						<span>Teams <em style="font-size: 12px; font-weight: normal; color: #666;">(Only Owner/Access teams will be copied)</em></span>
					</div>
					<div class="horizontal-comparison">
						<div class="comparison-column">
							<div class="comparison-label from-label">FROM</div>
							<div class="comparison-value from-value scrollable-multi" id="fromTeams">
								<div class="loading-spinner">Loading...</div>
							</div>
						</div>
						<div class="arrow-right">→</div>
						<div class="comparison-column">
							<div class="comparison-label to-label">TO</div>
							<div class="comparison-value to-value scrollable-multi" id="toTeams">
								<div class="loading-spinner">Loading...</div>
							</div>
						</div>
					</div>
				</div>
				
				<!-- Security Roles Section -->
				<div class="comparison-section">
					<div class="section-title-bar">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
							<path d="M8 11V7a4 4 0 118 0v4"/>
						</svg>
						<span>Security Roles</span>
					</div>
					<div class="horizontal-comparison">
						<div class="comparison-column">
							<div class="comparison-label from-label">FROM</div>
							<div class="comparison-value from-value scrollable-multi" id="fromRoles">
								<div class="loading-spinner">Loading...</div>
							</div>
						</div>
						<div class="arrow-right">→</div>
						<div class="comparison-column">
							<div class="comparison-label to-label">TO</div>
							<div class="comparison-value to-value scrollable-multi" id="toRoles">
								<div class="loading-spinner">Loading...</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<div class="action-buttons">
				<div class="action-note">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
						<circle cx="12" cy="12" r="10"/>
						<line x1="12" y1="16" x2="12" y2="12"/>
						<line x1="12" y1="8" x2="12.01" y2="8"/>
					</svg>
					<span>This action replaces all TO user's security with FROM user's security.</span>
				</div>
				<button id="submitButton" class="btn-primary" style="display: none;">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M5 12h14M12 5l7 7-7 7"/>
					</svg>
					Copy Security
				</button>
			</div>
		`;
		
		// Load data for both users
		try {
			await Promise.all([
				loadUserData(selectedUserId, 'from'),
				loadUserData(selectedUserId2, 'to')
			]);
			updateSubmitButtonVisibility();
		} catch (error) {
			console.error('Error loading user data:', error);
			showToast('Error loading user security data', 'error', 3000);
		}
		
		// Attach submit button handler
		const submitButton = document.getElementById('submitButton');
		if (submitButton) {
			submitButton.addEventListener('click', handleSubmit);
		}
	}
	
	async function loadUserData(userId, prefix) {
		// Load Business Unit
		fetchBusinessUnitName(userId, function(response) {
			const buDiv = document.getElementById(prefix + 'BusinessUnit');
			if (!response || !response.entities[0] || !response.entities[0].businessunitid) {
				buDiv.innerHTML = '<span style="color: #999; font-style: italic;">Not found</span>';
				return;
			}
			const businessUnitName = response.entities[0].businessunitid.name;
			buDiv.innerHTML = `<span style="font-weight: 500;">${businessUnitName}</span>`;
		});
		
		// Load Teams
		fetchTeamsForUser(userId, function(response) {
			const teamsDiv = document.getElementById(prefix + 'Teams');
			if (!response || !response.entities || !response.entities[0]?.teammembership_association) {
				teamsDiv.innerHTML = '<span style="color: #999; font-style: italic;">No teams assigned</span>';
				teamsDiv.classList.remove('scrollable-multi');
				return;
			}
			
			const teams = response.entities[0].teammembership_association;
			if (teams.length === 0) {
				teamsDiv.innerHTML = '<span style="color: #999; font-style: italic;">No teams assigned</span>';
				teamsDiv.classList.remove('scrollable-multi');
				return;
			}
			
			// Store team IDs if FROM user
			if (prefix === 'from') {
				selectedTeamIds = teams.map(t => t.teamid);
			}
			
			teams.sort((a, b) => a.name.localeCompare(b.name));
			
			teamsDiv.innerHTML = teams.map(team => {
				const teamType = team['teamtype@OData.Community.Display.V1.FormattedValue'];
				const isAssignable = teamType === 'Owner' || teamType === 'Access';
				const icon = isAssignable ? '✓' : '○';
				const iconColor = isAssignable ? '#10b981' : '#999';
				return `
					<div class="value-item ${!isAssignable ? 'disabled' : ''}">
						<span style="color: ${iconColor}; font-weight: bold;">${icon}</span>
						<span style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis;" title="${team.name}">${team.name}</span>
					</div>
				`;
			}).join('');
		});
		
		// Load Roles
		fetchRolesForUser(userId, function(roles) {
			const rolesDiv = document.getElementById(prefix + 'Roles');
			if (!roles || !roles.entities || roles.entities.length === 0) {
				rolesDiv.innerHTML = '<span style="color: #999; font-style: italic;">No roles assigned</span>';
				rolesDiv.classList.remove('scrollable-multi');
				return;
			}
			
			// Store role IDs if FROM user
			if (prefix === 'from') {
				selectedRoleIds = [];
			}
			
			const rolePromises = roles.entities.map(role => {
				const roleId = role['roleid'];
				if (prefix === 'from') {
					selectedRoleIds.push(roleId);
				}
				return Xrm.WebApi.retrieveRecord("role", roleId, "?$select=name,roleid");
			});
			
			Promise.all(rolePromises).then(roleDetails => {
				roleDetails.sort((a, b) => a.name.localeCompare(b.name));
				rolesDiv.innerHTML = roleDetails.map(role => `
					<div class="value-item">
						<span style="color: #10b981; font-weight: bold;">✓</span>
						<span style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis;" title="${role.name}">${role.name}</span>
					</div>
				`).join('');
			});
		});
	}
	
	function showCopyUpdateIndicator() {
		const indicator = document.getElementById('copyUpdateIndicator');
		const indicatorText = document.getElementById('copyUpdateIndicatorText');
		
		if (!indicator || !indicatorText) return;
		
		indicatorText.textContent = 'Security Copied Successfully';
		indicator.style.display = 'flex';
		
		indicator.classList.add('show-indicator');
		
		setTimeout(() => {
			indicator.classList.remove('show-indicator');
			setTimeout(() => {
				indicator.style.display = 'none';
			}, 300);
		}, 4000);
	}
	
	function showCustomConfirmDialog(title, message) {
		return new Promise((resolve) => {
			const overlay = document.createElement('div');
			overlay.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(0, 0, 0, 0.5);
				display: flex;
				align-items: center;
				justify-content: center;
				z-index: 10001;
			`;
			
			const dialog = document.createElement('div');
			dialog.style.cssText = `
				background: white;
				border-radius: 8px;
				box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
				max-width: 480px;
				width: 90%;
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
			`;
			
			dialog.innerHTML = `
				<div style="padding: 20px 24px; border-bottom: 2px solid #e0e0e0; background: #f8f9fa; border-radius: 8px 8px 0 0;">
					<h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #2b2b2b;">${title}</h3>
				</div>
				<div style="padding: 24px; line-height: 1.6; color: #2b2b2b; font-size: 14px;">
					${message}
				</div>
				<div style="padding: 16px 24px; border-top: 2px solid #e0e0e0; display: flex; gap: 12px; justify-content: flex-end; background: #f8f9fa; border-radius: 0 0 8px 8px;">
					<button id="confirmCancel" style="
						padding: 10px 20px;
						font-size: 14px;
						font-weight: 600;
						border: none;
						border-radius: 6px;
						cursor: pointer;
						background: #e0e0e0;
						color: #2b2b2b;
						transition: all 0.2s;
					">Cancel</button>
					<button id="confirmProceed" style="
						padding: 10px 20px;
						font-size: 14px;
						font-weight: 600;
						border: none;
						border-radius: 6px;
						cursor: pointer;
						background: #d97706;
						color: white;
						transition: all 0.2s;
					">Proceed</button>
				</div>
			`;
			
			overlay.appendChild(dialog);
			document.body.appendChild(overlay);
			
			const cancelBtn = dialog.querySelector('#confirmCancel');
			const proceedBtn = dialog.querySelector('#confirmProceed');
			
			cancelBtn.addEventListener('mouseenter', function() {
				this.style.background = '#d0d0d0';
			});
			cancelBtn.addEventListener('mouseleave', function() {
				this.style.background = '#e0e0e0';
			});
			
			proceedBtn.addEventListener('mouseenter', function() {
				this.style.background = '#b45309';
			});
			proceedBtn.addEventListener('mouseleave', function() {
				this.style.background = '#d97706';
			});
			
			cancelBtn.addEventListener('click', () => {
				overlay.remove();
				resolve(false);
			});
			
			proceedBtn.addEventListener('click', () => {
				overlay.remove();
				resolve(true);
			});
			
			overlay.addEventListener('click', (e) => {
				if (e.target === overlay) {
					overlay.remove();
					resolve(false);
				}
			});
		});
	}
	
	async function handleSubmit() {
		var userId = Xrm.Utility.getGlobalContext().userSettings.userId;
		userId = userId.replace(/[{}]/g, "");

		if (selectedUserId === selectedUserId2) {
			showCustomAlert("The FROM user and TO user cannot be the same. Please select different users.");
			return;
		}

		if (selectedUserId2.toLowerCase() === userId.toLowerCase()) {
			const confirmed = await showCustomConfirmDialog(
				"⚠️ Warning: Confirm Security Change",
				"You are about to change your own security settings. This may result in loss of access or being locked out of the system. Are you sure you want to proceed?"
			);
			if (!confirmed) {
			return;
			}
		}

		// Disable button during processing
		const submitButton = document.getElementById("submitButton");
		submitButton.disabled = true;
		submitButton.style.opacity = '0.6';
		submitButton.style.cursor = 'not-allowed';
		submitButton.innerHTML = `
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
				<path d="M21 12a9 9 0 11-6.219-8.56"/>
			</svg>
			Processing...
		`;

		showLoadingDialog("Copying security settings, please wait...");
		const actionType = "Change BUTR"; // BUTR = Business Unit, Teams, Roles
		let updateWasSuccessful = true;

		if (typeof updateUserDetails === "function") {
			try {
				await updateUserDetails(selectedUserId2, selectedBusinessUnitId, selectedTeamIds, selectedRoleIds, actionType);
			} catch (error) {
				console.error("An error occurred during the update process:", error);
				showCustomAlert(`An error occurred: ${error.message}`);
				updateWasSuccessful = false;
			} finally {
				closeLoadingDialog();
				// Re-enable button
				submitButton.disabled = false;
				submitButton.style.opacity = '1';
				submitButton.style.cursor = 'pointer';
				submitButton.innerHTML = `
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M5 12h14M12 5l7 7-7 7"/>
					</svg>
					Copy Security
				`;
			}

			if (updateWasSuccessful) {
				showCopyUpdateIndicator();

				// Refresh the TO user's data to show updated security
				setTimeout(() => {
					loadUserData(selectedUserId2, 'to');
				}, 1000);
			}
		} else {
			updateWasSuccessful = false;
			closeLoadingDialog();
			submitButton.disabled = false;
			submitButton.style.opacity = '1';
			submitButton.style.cursor = 'pointer';
			submitButton.innerHTML = `
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M5 12h14M12 5l7 7-7 7"/>
				</svg>
				Copy Security
			`;
			showCustomAlert("Failed to update security settings. Please check the logs for more details.");
		}
	}

	function setupSearchFilterScoped(searchInputId, userListId) {
		const searchInput = document.getElementById(searchInputId);
		const userList = document.getElementById(userListId);
		
		if (!searchInput || !userList) return;
		
		searchInput.addEventListener('input', function() {
			const query = this.value.toLowerCase().trim();
			const userItems = userList.querySelectorAll('.user-item');
			
			userItems.forEach(item => {
				const searchText = (item.dataset.searchText || '').toLowerCase();
				const matches = searchText.includes(query);
				item.style.display = matches ? 'flex' : 'none';
			});
		});
	}
	
	function displayPopup(users) {
	    // Sort users alphabetically by first name then last name
	    users.entities.forEach(user => {
			const firstName = user.firstname || '';
			const lastName = user.lastname || '';
			user.displayName = `${firstName} ${lastName}`.trim() || user.fullname || 'Unknown User';
		});
		users.entities.sort((a, b) => a.displayName.localeCompare(b.displayName));
		
	    const newContainer = createAppendSecurityPopup();
	    renderUserList(users.entities, user => selectUser(user, '1'), 'userList1', 'searchInput1');
	    renderUserList(users.entities, user => selectUser(user, '2'), 'userList2', 'searchInput2');
	    
	    // Setup search filters with scoped selectors
	    setupSearchFilterScoped('searchInput1', 'userList1');
	    setupSearchFilterScoped('searchInput2', 'userList2');
	}
	
	// Fetch users and display
	fetchUsers(function(users) {
		displayPopup(users);
	});
}

