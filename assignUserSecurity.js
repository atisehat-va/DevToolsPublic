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
	function fetchTeams(callback) {
    	        Xrm.WebApi.retrieveMultipleRecords('team', '?$select=teamid,name').then(callback);
	}
	function fetchSecurityRoles(callback) {
	    Xrm.WebApi.retrieveMultipleRecords('role', '?$select=roleid,name').then(callback);
	}

	function createAppendSecurityPopup() {		
	  var newContainer = document.createElement('div');		
	  newContainer.className = 'assignPopup';		
	  newContainer.innerHTML =  `               
	    <div class="commonPopup-header">Assign User Security</div>
	    <button class="commonback-button" id="commonback-button">Back</button>		  
	    <div class="assignSecurityPopup-row">
	      <div class="assignSection leftUser-section" id="section1">
	        <h3>FROM</h3>
	        <input type="text" id="searchInput1" placeholder="Search Users">
	        <div class="leftUser-list-container">
	          <div id="userList1"></div>
	        </div>
	      </div>                            
	      <div class="assignSection rightBuss-section" id="section2">
	        <h3>Change Business Unit</h3>
	        <input type="text" id="searchInput2" placeholder="Search Business Units">
	        <div class="businessUnit-list-container">
	          <div id="businessUnitList"></div>
	        </div>
	      </div>
	    </div>
	    <div id="sectionsRow1" class="assignSecurityPopup-row">
	      <div class="assignSection leftDetails-section-row" id="section3">
	        <h3>Business Unit & Teams</h3>
	        <div class="leftRoles-and-teams-list-row">
	          <ul></ul>
	        </div>
	      </div>
	      <div class="assignSection rightTeam-section" id="section5">
	        <h3>Update Team(s)</h3>
	         <input type="text" id="searchInput3" placeholder="Search Teams">
	         <div class="teams-wrapper">		        		  
		   <div class="team-action-checkboxes">
                    <div class="team-checkbox-container">
                     <div class="sectionWrapper">
		       <input type="radio" id="removeTeam" class="assignCheckbox" name="teamAction" value="remove">
		       <label for="removeTeam">Remove</label>
       		     </div>
		     <div class="sectionWrapper">
		       <input type="radio" id="addTeam" class="assignCheckbox" name="teamAction" value="add">
		       <label for="addTeam">Add</label>
       		     </div>
		     <div class="sectionWrapper">
                      <input type="radio" id="addAndRemoveTeam" class="assignCheckbox" name="teamAction" value="addAndRemove">
		      <label for="addAndRemoveTeam">Add + Remove Existing</label>
		     </div>		     		   
       	           </div>
		  </div>
	        <div class="businessUnit-list-container">	          
		  <div id="teamsList"></div>		   
		</div>	  
	       </div>
	      </div>
	    </div>
	    <div id="sectionsRow2" class="assignSecurityPopup-row">
	      <div class="assignSection leftDetails-section-row" id="section4">
	        <h3>Security Roles</h3>
	        <div class="leftRoles-and-teams-list-row">
	          <ul></ul>
	        </div>
	      </div>
	      <div class="assignSection rightTeam-section" id="section6">
	        <h3>Update Security Role(s)</h3>
	        <input type="text" id="searchInput4" placeholder="Search Security Role">	 
	         <div class="teams-wrapper">		        		  
		   <div class="team-action-checkboxes">
                    <div class="team-checkbox-container">
                     <div class="sectionWrapper">
                       <input type="radio" id="removeRole" class="assignCheckbox" name="roleAction" value="remove">
		       <label for="removeRole">Remove</label>
       		     </div>
	             <div class="sectionWrapper">
		       <input type="radio" id="addRole" class="assignCheckbox" name="roleAction" value="add">
		       <label for="addRole">Add</label>
       		     </div>
	             <div class="sectionWrapper">
                      <input type="radio" id="addAndRemoveRole" class="assignCheckbox" name="roleAction" value="addAndRemove">
		      <label for="addAndRemoveRole">Add + Remove Existing</label>
		     </div>		     		   
       	           </div>
		  </div>      
		 <div class="businessUnit-list-container">
		   <div id="securityRolesList"></div>	          		 
	         </div>
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
       
	/* function renderGenericList(entities, selectCallback, sectionId, searchInputId, classNamePrefix, textProperty, idProperty) {
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
	    listDiv.innerHTML = ''; 
	    
	    entities.forEach(entity => {
	        const entityDiv = document.createElement('div');
	        entityDiv.className = `${classNamePrefix}${sectionId.charAt(sectionId.length - 1)}`;
	
	        // Create wrapper div for list
	        const wrapperDiv = document.createElement('div');
	        wrapperDiv.className = 'sectionWrapper';
	        
	        // Add a radio button for Business Units, or checkbox for Team and Security Role
	        if (['businessUnit', 'team', 'role'].includes(classNamePrefix)) {
	            const inputElement = document.createElement('input');
	            
	            if (classNamePrefix === 'businessUnit') {
	                inputElement.type = "radio";
	                inputElement.name = "businessUnit";
	            } else {
	                inputElement.type = "checkbox";
	            }
	            
	            inputElement.className = "assignCheckbox";
	            wrapperDiv.appendChild(inputElement);
	        }
	
	        const textDiv = document.createElement('div');
	        textDiv.textContent = entity[textProperty];
	        textDiv.dataset.id = entity[idProperty];
	        textDiv.dataset.searchText = entity[textProperty];
	        textDiv.onclick = () => selectCallback(entity);
	
	        wrapperDiv.appendChild(textDiv);
	        entityDiv.appendChild(wrapperDiv);
	
	        listDiv.appendChild(entityDiv);
	    });
	}

	function selectUser(user, sectionPrefix) {
		try {
			const messageDiv = document.getElementById('updateMessage');
			if (messageDiv) {
				messageDiv.style.display = 'none';
			}

			document.querySelectorAll('.user' + sectionPrefix).forEach(el => el.classList.remove('userSelected'));
			const userDiv = document.getElementById('userList' + sectionPrefix).querySelector(`[data-id='${user.systemuserid}']`);
			userDiv.classList.add('userSelected');
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
	            const searchText = el.dataset.searchText || el.textContent;
	            el.style.display = searchText.toLowerCase().includes(searchValue) ? 'block' : 'none';
	        });
	    };
	}
	
	function displayPopup(users, businessUnits, teams, securityRoles) {
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
		
	   if (teams && teams.entities) {
               renderGenericList(teams.entities, team => selectItem(team, '3'), 'teamsList', 'searchInput3', 'team', 'name', 'teamid');
    	   }
	   if (securityRoles && securityRoles.entities) {
	       renderGenericList(securityRoles.entities, securityRole => selectItem(securityRole, '4'), 'securityRolesList', 'searchInput4', 'role', 'name', 'roleid');
	   }
			
	      setupSearchFilter('searchInput1', `user${'userList1'.charAt('userList1'.length - 1)}`);
	      setupSearchFilter('searchInput2', `businessUnit${'businessUnitList'.charAt('businessUnitList'.length - 1)}`);
	      setupSearchFilter('searchInput3', `team${'teamsList'.charAt('teamsList'.length - 1)}`);
	      setupSearchFilter('searchInput4', `role${'securityRolesList'.charAt('securityRolesList'.length - 1)}`);

	}
	 Promise.all([
	    new Promise(resolve => fetchUsers(resolve)),
	    new Promise(resolve => fetchBusinessUnits(resolve)),
	    new Promise(resolve => fetchTeams(resolve)),
	    new Promise(resolve => fetchSecurityRoles(resolve)) 
	 ]).then(([users, businessUnits, teams, securityRoles]) => {
	    displayPopup(users, businessUnits, teams, securityRoles);
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
