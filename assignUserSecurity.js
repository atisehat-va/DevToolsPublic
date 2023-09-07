function securityUpdate2() {
	debugger;	
	let selectedUserId = null;
	let selectedBusinessUnitId = null;
	let selectedTeamIds = [];
	let selectedRoleIds = [];
	
	function fetchUsers(callback) {
	    Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,fullname,_businessunitid_value&$filter=(isdisabled eq false)').then(callback);
	}
	function fetchRolesForUser(userId, callback) {
		Xrm.WebApi.retrieveMultipleRecords('systemuserroles', `?$filter=systemuserid eq ${userId}`).then(callback);
	}
	function fetchTeamsForUser(userId, callback) {
		Xrm.WebApi.retrieveMultipleRecords('systemuser', `?$select=fullname&$expand=teammembership_association($select=name)&$filter=systemuserid eq ${userId}`).then(callback);
	}
	function fetchBusinessUnitName(userId, callback) {
		Xrm.WebApi.retrieveMultipleRecords('systemuser', `?$select=fullname&$expand=businessunitid($select=name)&$filter=systemuserid eq ${userId}`).then(callback);
	}
	function fetchBusinessUnits(callback) {
	        Xrm.WebApi.retrieveMultipleRecords('businessunit', '?$select=businessunitid,name').then(callback);
	}
	function renderList(items, selectItemCallback, sectionId, searchInputId) {
		const listDiv = document.getElementById(sectionId);
		items.forEach(item => {
		const itemDiv = document.createElement('div');
		itemDiv.className = `item${sectionId.charAt(sectionId.length - 1)}`;
		itemDiv.textContent = item.name || item.fullname;  // accommodate both Users and Business Units
		itemDiv.dataset.id = item.businessunitid || item.systemuserid;
		itemDiv.onclick = () => selectItemCallback(item);
		listDiv.appendChild(itemDiv);
	   });
        }

	function createAppendSecurityPopup() {		
	  var newContainer = document.createElement('div');		
	  newContainer.className = 'commonPopup';		
	  newContainer.innerHTML =  `    			
	    <div class="commonPopup-header">Assign User Security</div>
	    <button class="commonback-button" id="commonback-button">Back</button>		  
	    <div class="securityPopup-row">
	      <div class="commonSection user-section" id="section1">
	        <h3>FROM</h3>
	        /* <input type="text" id="searchInput1" placeholder="Search Users"> */
	        <input type="text" id="searchInput1" placeholder="Search Business Units">
	        <div class="user-list-container">
	          <div id="userList1"></div>
	        </div>
	      </div>                            
	      <div class="commonSection user-section" id="section2">
	        <h3>Change Business Unit</h3>
	        <div class="user-list-container">
	          <div></div>
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
	        <h3>Update Team(s)</h3>
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
	        <h3>Update Security Role(s)</h3>
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
	    const displayStatus = selectedUserId ? 'block' : 'none';
	    document.getElementById("submitButton").style.display = displayStatus;
	}

	function selectUser(user, sectionPrefix) {
		try {
			const messageDiv = document.getElementById('updateMessage');
			if (messageDiv) {
				messageDiv.style.display = 'none';
			}

			document.querySelectorAll('.user' + sectionPrefix).forEach(el => el.classList.remove('selected'));
			const userDiv = document.getElementById('userList' + sectionPrefix).querySelector(`[data-id='${user.systemuserid}']`);
			userDiv.classList.add('selected');

			if (sectionPrefix === '1') {
				selectedUserId = user.systemuserid;
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
		//users.entities.sort((a, b) => a.fullname.localeCompare(b.fullname));
		//const newContainer = createAppendSecurityPopup();
		//renderUserList(users.entities, user => selectUser(user, '1'), 'userList1', 'searchInput1');
		businessUnits.entities.sort((a, b) => a.name.localeCompare(b.name));
	        createAppendSecurityPopup();
	        renderList(businessUnits.entities, businessUnit => selectItem(businessUnit, '1'), 'userList1', 'searchInput1');
		
		setupSearchFilter('searchInput1');		

		loadScript(
			"https://cdn.jsdelivr.net/gh/atisehat-va/DevToolsPublic@main/security1.js",
			function() {
				console.log("The script has been loaded and callback function executed.");
				if (typeof updateUserDetails === "function") {
					console.log("updateUserDetails is accessible");
				} else {
					console.log("updateUserDetails is NOT accessible");
				}

				const submitButton = document.getElementById("submitButton");
				if (submitButton) {
					console.log("Found submitButton element, adding event listener.");
					submitButton.addEventListener("click", async function() {
						console.log("submitButton clicked.");

						const existingMessageDiv = document.getElementById('updateMessage');
						if (existingMessageDiv) {
							existingMessageDiv.remove();
						}
						this.style.display = 'none';

						const messageDiv = document.createElement('div');
						messageDiv.id = 'updateMessage';
						messageDiv.innerHTML = `Your update is in progress, please be patient...`;
						messageDiv.style.fontSize = "20px";
						messageDiv.style.fontWeight = "bold";
						this.parentNode.appendChild(messageDiv);

						if (typeof updateUserDetails === "function") {
							await updateUserDetails(selectedUserId2, selectedBusinessUnitId, selectedTeamIds, selectedRoleIds);
							console.log("updateUserDetails function called.");
							if (messageDiv) {
								messageDiv.remove();
							}
							const newMessageDiv = document.createElement('div');
							newMessageDiv.id = 'updateMessage';
							newMessageDiv.innerHTML = `<span>Security updated for ${selectedUserName2}</span>`;
							newMessageDiv.style.fontSize = "20px";
							newMessageDiv.style.fontWeight = "bold";
							this.parentNode.appendChild(newMessageDiv);
						} else {
							console.log("updateUserDetails is NOT accessible");
						}
					});
				} else {
					console.log("submitButton element not found");
				}
			},
			function() {
				console.log("Failed to load script.");
			}
		);
		updateSubmitButtonVisibility();
	}
	/* fetchUsers(function(users) {
		displayPopup(users);
	}); */
	fetchBusinessUnits(function(businessUnits) {
	        displayPopup(businessUnits);
	});

	function loadScript(src, callback, errorCallback) {
	    const script = document.createElement("script");
	    script.type = "text/javascript";
	    script.onload = callback;
	    script.onerror = errorCallback;
	    script.src = src;
	    document.body.appendChild(script);
	}
}
