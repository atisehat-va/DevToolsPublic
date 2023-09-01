function securityUpdate() {
	debugger;
	let selectedUserId2 = null;
	let selectedUserName2 = '';
	let selectedUserId = null;
	let selectedBusinessUnitId = null;
	let selectedTeamIds = [];
	let selectedRoleIds = [];

	const popupCss = `    
		.securityPopup { background-color: #f9f9f9; border: 3px solid #444; border-radius: 20px; width: 800px; height: 100%; overflow: hidden; box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); font-family: Arial, sans-serif; }    
		.section { padding: 10px; border-right: 1px solid #ccc; overflow-y: scroll; }    
		.section h3 { text-align: center; margin-bottom: 10px; color: #444; }    
		.user-section { text-align: center; height: 190px; width: 50%;}    
		.user-section input { margin-bottom: 10px; width: 230px; padding: 10px; border: 1px solid #ccc; border-radius: 5px; }        
		.user-section #userList { margin-bottom: 15px; max-height: 130px; overflow-y: scroll; scrollbar-width: thin; -ms-overflow-style: auto; }         
		.user-section #userList::-webkit-scrollbar { display: none; }        
		.user-section #userList::-webkit-scrollbar-thumb { background: #ccc; }    
		.user-list-container { max-height: 110px; overflow-y: auto; }    
		.roles-and-teams-list-row1 { max-height: 110px; margin-left: 10px; overflow-y: auto; }    
		.roles-and-teams-list-row2 { max-height: 143px; margin-left: 10px; overflow-y: auto; }    
		.details-section-row1 { display: inline-block; width: 50%; height: 160px; margin-left: 10px; vertical-align: top; box-sizing: border-box; text-align: left; }    .details-section-row2 { display: inline-block; width: 50%; height: 200px; margin-left: 10px; vertical-align: top; box-sizing: border-box; text-align: left; }    
		.selected { background-color: #e0e0e0; }        
		.user { cursor: pointer; padding: 3px; font-size: 14px; transition: background-color 0.3s; }        
		.user:hover { background-color: #f0f0f0; }    
		#sectionsRow { white-space: nowrap; }    
		.securityPopup-row { display: flex; }    
		.securityPopup-header { text-align: center; padding: 10px; background-color: #444; color: #fff; font-size: 18px; border-bottom: 2px solid #333; border-radius: 20px 20px 0 0; }    .submit-button-container { text-align: center; padding: 10px; width: 100%; }      
		#submitButton { display: none; margin: auto; padding: 10px 20px; font-size: 16px; width: 250px; background-color: #007bff; color: white; border: none; cursor: pointer; border-radius: 5px; transition: background-color 0.3s; }      
		#submitButton:hover { background-color: #0056b3; }    
		.tooltip { position: absolute; top: 15px; right: 15px; cursor: pointer; background-color: #fff; border: 1px solid #444; border-radius: 50%; width: 20px; height: 20px; text-align: center; font-size: 14px; line-height: 20px; }    
		.tooltiptext { visibility: visible; width: 120px; background-color: black; color: #fff; text-align: center; border-radius: 6px; padding: 5px 0; position: absolute; z-index: 1; right: 100%; top: 50%; margin-top: -15px; opacity: 0; transition: opacity 0.3s; }    
		.tooltip:hover .tooltiptext { visibility: visible; opacity: 1; }  
	`;

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

	function createPopupHtml() {
		return `    
				<div class="securityPopup">      
				<div class="securityPopup-header">Copy User Security</div>      
				<div id="tooltip" class="tooltip">i        
				<span class="tooltiptext" id="tooltiptext">This tool allows you to copy Business Unit, Teams, and Security Roles from one user to another.</span>      </div>      <style>${popupCss}</style>            
				<div class="securityPopup-row">        
				<div class="section user-section" id="section1">          
				<h3>FROM</h3>          
				<input type="text" id="searchInput1" placeholder="Search Users">          
				<div class="user-list-container">            
				<div id="userList1"></div>         
				</div>        
				</div>        
				<div class="section user-section" id="section2">          
				<h3>TO</h3>          
				<input type="text" id="searchInput2" placeholder="Search Users">          
				<div class="user-list-container">            
				<div id="userList2"></div>          
				</div>        
				</div>      
				</div>      
				<div id="sectionsRow1" class="securityPopup-row">        
				<div class="section details-section-row1" id="section3">          
				<h3>Business Unit & Teams</h3>          
				<div class="roles-and-teams-list-row1">            
				<ul></ul>          
				</div>        
				</div>        
				<div class="section details-section-row1" id="section5">          
				<h3>Business Unit & Teams</h3>          
				<div class="roles-and-teams-list-row1">            
				<ul></ul>          
				</div>        
				</div>              
				</div>      
				<div id="sectionsRow2" class="securityPopup-row">        
				<div class="section details-section-row2" id="section4">          
				<h3>Security Roles</h3>          
				<div class="roles-and-teams-list-row2">            
				<ul></ul>          
				</div>        
				</div>        
				<div class="section details-section-row2" id="section6">          
				<h3>Security Roles</h3>         
				<div class="roles-and-teams-list-row2">           
				<ul></ul>          
				</div>        
				</div>      
				</div>     
				<div class="submit-button-container">        
				<button id="submitButton">Submit</button>      
				</div>          
				</div>`;
	}

	function createAndAppendPopup() {
		const popupHtml = createPopupHtml();
		const popupDiv = document.createElement('div');
		popupDiv.id = 'bookmarkletPopup';
		popupDiv.innerHTML = popupHtml;
		popupDiv.style.position = 'absolute';
		popupDiv.style.zIndex = '10000';
		popupDiv.style.left = '50%';
		popupDiv.style.top = '50%';
		popupDiv.style.transform = 'translate(-50%, -50%)';
		document.body.appendChild(popupDiv);

		return popupDiv;
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
		const popupDiv = createAndAppendPopup();
		renderUserList(users.entities, user => selectUser(user, '1'), 'userList1', 'searchInput1');
		renderUserList(users.entities, user => selectUser(user, '2'), 'userList2', 'searchInput2');
		setupSearchFilter('searchInput1');
		setupSearchFilter('searchInput2');

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
