function copySecurity() {	
	let selectedUserId2 = null; 
	let selectedUserName2 = '';
	let selectedUserId = null;
	let selectedBusinessUnitId = null; 
	let selectedTeamIds = []; 
	let selectedRoleIds = [];	
	
	function createAppendSecurityPopup() {		
		var newContainer = document.createElement('div');		
		newContainer.className = 'commonPopup';		
		newContainer.innerHTML =  `    			
			  <div class="commonPopup-header">Copy User Security</div>
	    		  <button class="commonback-button" id="commonback-button">Back</button>		  
			  <div class="securityPopup-row">
			    <div class="commonSection user-section" id="section1">
			      <h3>FROM</h3>
			      <input type="text" id="searchInput1" placeholder="Search Users">
			      <div class="user-list-container">
			        <div id="userList1"></div>
			      </div>
			    </div>
			    <div class="commonSection user-section" id="section2">
			      <h3>TO</h3>
			      <input type="text" id="searchInput2" placeholder="Search Users">
			      <div class="user-list-container">
			        <div id="userList2"></div>
			      </div>
			    </div>
			  </div>
			  <div id="sectionsRow1" class="securityPopup-row">
			    <div class="commonSection details-section-row" id="section3">
			      <h3>Business Unit & Teams</h3>
			      <div class="roles-and-teams-list-row">
			        <ul></ul>
			      </div>
			    </div>
			    <div class="commonSection details-section-row" id="section5">
			      <h3>Business Unit & Teams</h3>
			      <div class="roles-and-teams-list-row">
			        <ul></ul>
			      </div>
			    </div>
			  </div>
			  <div id="sectionsRow2" class="securityPopup-row">
			    <div class="commonSection details-section-row" id="section4">
			      <h3>Security Roles</h3>
			      <div class="roles-and-teams-list-row">
			        <ul></ul>
			      </div>
			    </div>
			    <div class="commonSection details-section-row" id="section6">
			      <h3>Security Roles</h3>
			      <div class="roles-and-teams-list-row">
			        <ul></ul>
			      </div>
			    </div>
			  </div>
			  <div class="submit-button-container">
			    <button id="submitButton">Submit</button>
			  </div>
		    `;		
			document.body.appendChild(newContainer);
			document.getElementById('commonback-button').addEventListener('click', function() {
			    newContainer.remove();
			    openPopup();  
			});		
		makePopupMovable(newContainer);	
	}

	function renderUserList(users, selectUserCallback, sectionId, searchInputId) {
		const userListDiv = document.getElementById(sectionId);
		users.forEach(user => {
			const userDiv = document.createElement('div');
			userDiv.className = `user${sectionId.charAt(sectionId.length - 1)}`;
			userDiv.textContent = user.fullname;
			userDiv.dataset.id = user.systemuserid;
			userDiv.onclick = () => selectUserCallback(user);
			userListDiv.appendChild(userDiv);
		});
	}

	function updateSubmitButtonVisibility() {
		const submitButton = document.getElementById("submitButton");
		if (selectedUserId && selectedUserId2) {
			submitButton.style.display = 'block';
		} else {
			submitButton.style.display = 'none';
		}
	}

	function selectUser(user, sectionPrefix) {		
		try {		

			document.querySelectorAll('.user' + sectionPrefix).forEach(el => el.classList.remove('selected'));
			const userDiv = document.getElementById('userList' + sectionPrefix).querySelector(`[data-id='${user.systemuserid}']`);
			userDiv.classList.add('selected');

			if (sectionPrefix === '1') {
				selectedUserId = user.systemuserid;
			}
			if (sectionPrefix === '2') {
				selectedUserId2 = user.systemuserid;
			}
			if (sectionPrefix === '2') {
				selectedUserName2 = user.fullname;
			}
			updateSubmitButtonVisibility();

			const businessUnitAndTeamsList = document.getElementById('section' + (3 + (sectionPrefix - 1) * 2)).querySelector('ul');
			businessUnitAndTeamsList.innerHTML = '';
			let businessUnitListItem = null;
			let teamListItems = [];

			const appendLists = () => {
			 	if (businessUnitListItem) {
					businessUnitAndTeamsList.appendChild(businessUnitListItem);
				}
				teamListItems.forEach(item => businessUnitAndTeamsList.appendChild(item));
			};

			fetchBusinessUnitName(user.systemuserid, function(response) {
				if (!response || !response.entities[0] || !response.entities[0].businessunitid || !response.entities[0].businessunitid.name) {
					console.error('Business unit not found');
					return;
				}

				const businessUnitName = response.entities[0].businessunitid.name;

				if (sectionPrefix === '1') {
					selectedBusinessUnitId = user._businessunitid_value;
				}

				businessUnitListItem = document.createElement('li');
				businessUnitListItem.textContent = 'Business Unit: ' + businessUnitName;

				appendLists();
			});

			fetchTeamsForUser(user.systemuserid, function(response) {
				if (!response || !response.entities || !response.entities[0].teammembership_association) {
					console.error('Teams not found');
					return;
				}
				if (sectionPrefix === '1') {
					selectedTeamIds = [];
				}
				teamListItems = response.entities[0].teammembership_association.map(team => {

					if (sectionPrefix === '1') {
						selectedTeamIds.push(team.teamid);
					}

					const listItem = document.createElement('li');
					listItem.textContent = 'Team: ' + team.name;
					return listItem;
				});

				appendLists();
			});

			fetchRolesForUser(user.systemuserid, function(roles) {
				if (!roles || !roles.entities) {
					console.error('Roles not found');
					return;
				}
				if (sectionPrefix === '1') {
					selectedRoleIds = [];
				}
				const rolesList = document.getElementById('section' + (4 + (sectionPrefix - 1) * 2)).querySelector('ul');
				rolesList.innerHTML = '';

				const roleDetailsArr = [];

				const rolePromises = roles.entities.map(role => {
				  const roleId = role['roleid'];	
				  if (sectionPrefix === '1') {
				     selectedRoleIds.push(roleId);
				  }
	                          return Xrm.WebApi.retrieveRecord("role", roleId, "?$select=name,roleid").then(function(roleDetail) {
				     roleDetailsArr.push(roleDetail);
				  });
				});
				Promise.all(rolePromises).then(() => {
				  roleDetailsArr.sort((a, b) => {
				     if (a.name < b.name) return -1;
					if (a.name > b.name) return 1;
					return 0;
				      });
				      roleDetailsArr.forEach(roleDetail => {
					const listItem = document.createElement('li');
					listItem.textContent = roleDetail.name;
					rolesList.appendChild(listItem);
				      });
				});
			});
		} catch (e) {
			console.error('Error in selectUser function', e);
		}
	}

	function setupSearchFilter(searchInputId) {
		document.getElementById(searchInputId).oninput = function() {
			const searchValue = this.value.toLowerCase();
			document.querySelectorAll(`.user${searchInputId.charAt(searchInputId.length - 1)}`).forEach(el => {
				el.style.display = el.textContent.toLowerCase().includes(searchValue) ? 'block' : 'none';
			});
		};
	}

	function displayPopup(users) {
		users.entities.sort((a, b) => a.fullname.localeCompare(b.fullname));
		const newContainer = createAppendSecurityPopup();
		renderUserList(users.entities, user => selectUser(user, '1'), 'userList1', 'searchInput1');
		renderUserList(users.entities, user => selectUser(user, '2'), 'userList2', 'searchInput2');
		setupSearchFilter('searchInput1');
		setupSearchFilter('searchInput2');	

		const submitButton = document.getElementById("submitButton");
		if (submitButton) {
			console.log("Found submitButton element, adding event listener.");
			submitButton.addEventListener("click", async function() {
				console.log("submitButton clicked.");
			
				showLoadingDialog("Your update is in progress, please be patient...");
				const actionType = "Change BUTR"; //BUTR = Business Unit, Teams, Roles
				if (typeof updateUserDetails === "function") {
					await updateUserDetails(selectedUserId2, selectedBusinessUnitId, selectedTeamIds, selectedRoleIds, actionType); 
					console.log("updateUserDetails function called.");
					closeLoadingDialog();
		    			showCustomAlert(`Security updated for ${selectedUserName2}`);				
				} else {
					console.log("updateUserDetails is NOT accessible");
				}
			});
		} else {
			console.log("submitButton element not found");
		}		
		updateSubmitButtonVisibility();
	}
	fetchUsers(function(users) {
		displayPopup(users);
	});

	function loadScript(src, callback, errorCallback) {
		const script = document.createElement("script");
		script.type = "text/javascript";
		script.onload = function() {
			console.log("Script loaded successfully.");
			callback();
		};
		script.onerror = function() {
			console.log("Error loading script.");
			errorCallback();
		};
		script.src = src;
		document.body.appendChild(script);
	}
}
