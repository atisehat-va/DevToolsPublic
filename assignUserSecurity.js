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

	function createAppendSecurityPopup() {		
	  var newContainer = document.createElement('div');		
	  newContainer.className = 'commonPopup';		
	  newContainer.innerHTML =  `   
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css">
	    <div class="commonPopup-header">Assign User Security</div>
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
	        <h3>Change Business Unit</h3>
	        <input type="text" id="searchInput2" placeholder="Search Business Units">
	        <div class="businessUnit-list-container">
	          <div id="businessUnitList"></div>
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
	  `;		
	  document.body.appendChild(newContainer);
	  document.getElementById('commonback-button').addEventListener('click', function() {
	    newContainer.remove();
	    openPopup();  
	  });		
	  makePopupMovable(newContainer);	
	}
       /*
	function renderGenericList(entities, selectCallback, sectionId, searchInputId, classNamePrefix, textProperty, idProperty) {
	    const listDiv = document.getElementById(sectionId);
	    entities.forEach(entity => {
	        const entityDiv = document.createElement('div');
	        entityDiv.className = `${classNamePrefix}${sectionId.charAt(sectionId.length - 1)}`;
	        entityDiv.textContent = entity[textProperty];
	        entityDiv.dataset.id = entity[idProperty];
	        entityDiv.onclick = () => selectCallback(entity);
	        listDiv.appendChild(entityDiv);
	    });
	} */

	function renderGenericList(entities, selectCallback, sectionId, searchInputId, classNamePrefix, textProperty, idProperty) {
	  const listDiv = document.getElementById(sectionId);
	  
	  entities.forEach(entity => {
	    let appendToDiv = listDiv;  // Default to listDiv
	    
	    // Create wrapper div for Business Unit list
	    if (classNamePrefix === 'businessUnit') {
	      const wrapperDiv = document.createElement('div');
	      wrapperDiv.className = 'businessUnitWrapper';
	      
	      // Create and append the checkbox
	      const checkBox = document.createElement('input');
	      checkBox.type = "checkbox";
	      checkBox.className = "businessUnitCheckbox";
	      
	      wrapperDiv.appendChild(checkBox);  // Append to wrapper
	      appendToDiv = wrapperDiv;  // Set wrapper as the new parent
	      
	      listDiv.appendChild(wrapperDiv);  // Append wrapper to listDiv
	    }
	    
	    const textDiv = document.createElement('div');
	    textDiv.textContent = entity[textProperty];
	    textDiv.dataset.id = entity[idProperty];
	    textDiv.onclick = () => selectCallback(entity);
	    
	    appendToDiv.appendChild(textDiv);  // Append textDiv to the appropriate parent
	  });
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

	function setupSearchFilter(searchInputId, targetClassSuffix) {
	    document.getElementById(searchInputId).oninput = function() {
	        const searchValue = this.value.toLowerCase();
	        document.querySelectorAll(`.${targetClassSuffix}`).forEach(el => {
	            el.style.display = el.textContent.toLowerCase().includes(searchValue) ? 'block' : 'none';
	        });
	    };
	}
	
	function displayPopup(users, businessUnits) {
	    if (users && users.entities) {
	        users.entities.sort((a, b) => (a.fullname || "").localeCompare(b.fullname || ""));
	    }	
	    const newContainer = createAppendSecurityPopup();
	
	    if (businessUnits && businessUnits.entities) {
	        businessUnits.entities.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
	    }	

	    if (users && users.entities) {		    
		renderGenericList(users.entities, user => selectUser(user, '1'), 'userList1', 'searchInput1', 'user', 'fullname', 'systemuserid');	
	    }
	
	   if (businessUnits && businessUnits.entities) {
	        renderGenericList(businessUnits.entities, businessUnit => selectItem(businessUnit, '1'), 'businessUnitList', 'searchInput2', 'businessUnit', 'name', 'id');
	   }	      
	      setupSearchFilter('searchInput1', `user${'userList1'.charAt('userList1'.length - 1)}`);
	      setupSearchFilter('searchInput2', `businessUnit${'businessUnitList'.charAt('businessUnitList'.length - 1)}`); 
	}
	 Promise.all([
	    new Promise(resolve => fetchUsers(resolve)),
	    new Promise(resolve => fetchBusinessUnits(resolve))
	 ]).then(([users, businessUnits]) => {
	    displayPopup(users, businessUnits);
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
