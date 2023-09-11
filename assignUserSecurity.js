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
	  Xrm.WebApi.retrieveMultipleRecords('team', '?$select=teamid,name&$expand=businessunitid($select=name)').then(callback);
	}

	function fetchSecurityRoles(businessUnitId, callback) {
	    Xrm.WebApi.retrieveMultipleRecords('role', `?$select=roleid,name&$filter=_businessunitid_value eq ${businessUnitId}`).then(callback);
	}

	function createAppendSecurityPopup() {		
	  var newContainer = document.createElement('div');		
	  newContainer.className = 'assignPopup';		
	  newContainer.innerHTML =  `               
	    <div class="commonPopup-header">Assign User Security</div>
	    <button class="commonback-button" id="commonback-button">Back</button>		  
	    <div class="assignSecurityPopup-row">
	      <div class="assignSection leftUser-section" id="section1">
	        <h3>Current User Security:</h3>
	        <input type="text" id="searchInput1" placeholder="Search Users">
	        <div class="leftUser-list-container">
	          <div id="userList1"></div>
	        </div>
	      </div>                            
	      <div class="assignSection rightBuss-section" id="section2">
	        <h3>Change Business Unit:</h3>
	        <input type="text" id="searchInput2" placeholder="Search Business Units">
	        <div class="businessUnit-list-container">
	          <div id="businessUnitList"></div>
	        </div>
	      </div>
	    </div>
	    <div id="sectionsRow1" class="assignSecurityPopup-row">
	      <div class="assignSection leftDetails-section-row" id="section3">
	        <h3>Business Unit & Teams:</h3>
	        <div class="leftRoles-and-teams-list-row">
	          <ul></ul>
	        </div>
	      </div>
	      <div class="assignSection rightTeam-section" id="section5">
	        <h3>Add/Remove Team(s):</h3>
	         <div class="teamsRoles-input-wrapper">
	            <input type="text" id="searchInput3" placeholder="Search Teams">
	         </div>
	         <div class="teams-wrapper">		        		  
		   <div class="team-action-checkboxes">
                    <div class="team-checkbox-container">
		     <div class="sectionWrapper">
                       <input type="radio" id="noTeamUpdate" class="assignCheckbox" name="roleAction" value="noTeamUpdates">
		       <label for="noTeamUpdate">No Change</label>
       		     </div>
                     <div class="sectionWrapper">
		       <input type="radio" id="removeTeam" class="assignCheckbox" name="teamAction" value="remove">
		       <label for="removeTeam">Remove</label>
       		     </div>
		     <div class="sectionWrapper">
		       <input type="radio" id="addTeam" class="assignCheckbox" name="teamAction" value="add">
		       <label for="addTeam">Add</label>
       		     </div>
		     <div class="sectionWrapper">
                      <input type="radio" id="addAndRemoveTeam" class="assignCheckbox" name="teamAction" value="addAndRemoveTeam">
		      <label for="addAndRemoveTeam">Add + Remove Existing</label>
		     </div>		     		   
       	           </div>
		  </div>
	        <div class="teamsRoles-list-container">	          
		  <div id="teamsList"></div>		   
		</div>	  
	       </div>
	      </div>
	    </div>
	    <div id="sectionsRow2" class="assignSecurityPopup-row">
	      <div class="assignSection leftDetails-section-row" id="section4">
	        <h3>Security Roles:</h3>
	        <div class="leftRoles-and-teams-list-row">
	          <ul></ul>
	        </div>
	      </div>
	      <div class="assignSection rightTeam-section" id="section6">
	        <h3>Add | Remove Security Role(s):</h3>
	        <div class="teamsRoles-input-wrapper">
	           <input type="text" id="searchInput4" placeholder="Search Security Role">	 
	        </div>
	         <div class="teams-wrapper">		        		  
		   <div class="team-action-checkboxes">
                    <div class="team-checkbox-container">
		    <div class="sectionWrapper">
                       <input type="radio" id="noRoleUpdate" class="assignCheckbox" name="roleAction" value="noRoleUpdates">
		       <label for="noRoleUpdate">No Change</label>
       		     </div>
                     <div class="sectionWrapper">
                       <input type="radio" id="removeRole" class="assignCheckbox" name="roleAction" value="remove">
		       <label for="removeRole">Remove</label>
       		     </div>
	             <div class="sectionWrapper">
		       <input type="radio" id="addRole" class="assignCheckbox" name="roleAction" value="add">
		       <label for="addRole">Add</label>
       		     </div>
	             <div class="sectionWrapper">
                      <input type="radio" id="addAndRemoveRole" class="assignCheckbox" name="roleAction" value="addAndRemoveRole">
		      <label for="addAndRemoveRole">Add + Remove Existing</label>
		     </div>		     		   
       	           </div>
		  </div>      
		 <div class="teamsRoles-list-container">
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
	
	function renderGenericList(entities, selectCallback, sectionId, searchInputId, classNamePrefix, textProperty, idProperty) {
	    const listDiv = document.getElementById(sectionId);
	    listDiv.innerHTML = ''; 
	
	    // Add "No Change" radio button if it's a Business Unit
	    if (classNamePrefix === 'businessUnit') {
	        const noChangeDiv = document.createElement('div');
	        noChangeDiv.className = 'businessUnit' + sectionId.charAt(sectionId.length - 1);
	
	        const wrapperDiv = document.createElement('div');
	        wrapperDiv.className = 'sectionWrapper';
	
	        const noChangeRadio = document.createElement('input');
	        noChangeRadio.type = 'radio';
	        noChangeRadio.name = 'businessUnit';
	        noChangeRadio.value = 'noChange';
	        noChangeRadio.className = 'assignCheckbox';
	        wrapperDiv.appendChild(noChangeRadio);
	
	        const textDiv = document.createElement('div');
	        textDiv.textContent = 'No Change';
	        wrapperDiv.appendChild(textDiv);
	
	        noChangeDiv.appendChild(wrapperDiv);
	        listDiv.appendChild(noChangeDiv);
	    }
	
	    entities.forEach(entity => {
		    const entityDiv = document.createElement('div');
		    entityDiv.className = `${classNamePrefix}${sectionId.charAt(sectionId.length - 1)}`;
		
		    const wrapperDiv = document.createElement('div');
		    wrapperDiv.className = 'sectionWrapper';
		    
		    if (['businessUnit', 'team', 'role'].includes(classNamePrefix)) {
		        const inputElement = document.createElement('input');	
			    
		        if (classNamePrefix === 'businessUnit') {
		            inputElement.type = 'radio';
		            inputElement.name = 'businessUnit';
		        } else {
		            inputElement.type = 'checkbox';
		        }		        
		        inputElement.className = 'assignCheckbox';
		        wrapperDiv.appendChild(inputElement);
		    }
		
		    const textDiv = document.createElement('div');
		    textDiv.dataset.id = entity[idProperty];
		    textDiv.dataset.searchText = entity[textProperty];
		    textDiv.onclick = () => selectCallback(entity);		
		    if (classNamePrefix === 'team') {
		        const teamName = entity.name || 'Unknown';
		        const businessUnitId = entity.businessunitid ? entity.businessunitid.name : 'Unknown';
		        textDiv.textContent = `${teamName} (${businessUnitId})`;
		    } else {
		        textDiv.textContent = entity[textProperty] || 'N/A';
		    }		
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
		            selectedBusinessUnitId = user._businessunitid_value;
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
			//GetTeamsOnRight
			
			// Target the teamsList div where you'll populate the team information
		        const teamsList = document.getElementById('teamsList');
		        teamsList.innerHTML = '';
		
		        fetchTeams(function(teams) {
		            if (!teams || !teams.entities) {
		                console.error('Teams not found');
		                return;
		            }
		
		            const teamDetailsArr = teams.entities.map(team => ({name: team.name, teamid: team.teamid}));
		            teamDetailsArr.sort((a, b) => {
		                if (a.name < b.name) return -1;
		                if (a.name > b.name) return 1;
		                return 0;
		            });
		
		            teamDetailsArr.forEach(teamDetail => {
		                // Create a div with class sectionWrapper
		                const wrapperDiv = document.createElement('div');
		                wrapperDiv.className = 'sectionWrapper';
		
		                // Create checkbox
		                const assignCheckbox = document.createElement('input');
		                assignCheckbox.type = 'checkbox';
		                assignCheckbox.value = teamDetail.teamid; // set value to team's ID
		                assignCheckbox.className = 'assignCheckbox'; // for styling or selection
		
		                // Create label for team name
		                const label = document.createElement('label');
		                label.textContent = teamDetail.name;
		
		                // Append checkbox and label to wrapperDiv
		                wrapperDiv.appendChild(assignCheckbox);
		                wrapperDiv.appendChild(label);
		
		                // Append wrapperDiv to the teamsList div
		                teamsList.appendChild(wrapperDiv);
		            });
		        });

			//EndGetTeamsOnRight
			if (sectionPrefix === '1') {
		            // Fetch roles specific to the user and display them under section4
		            const rolesListUser = document.getElementById('section4').querySelector('ul');
		            rolesListUser.innerHTML = '';
				
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

				// Fetch roles based on the business unit and display them under section6
				const rolesListBusinessUnit = document.getElementById('section6').querySelector('#securityRolesList');
				rolesListBusinessUnit.innerHTML = '';
				
				fetchSecurityRoles(selectedBusinessUnitId, function(response) {
				    if (!response || !response.entities) {
				        console.error('Roles not found');
				        return;
				    }
				    
				    const roleDetailsArr = response.entities.map(role => ({name: role.name, roleid: role.roleid}));
				    roleDetailsArr.sort((a, b) => {
				        if (a.name < b.name) return -1;
				        if (a.name > b.name) return 1;
				        return 0;
				    });
				    
				    roleDetailsArr.forEach(roleDetail => {
				        // Create checkbox
				        const assignCheckbox = document.createElement('input');
				        assignCheckbox.type = 'checkbox';
				        assignCheckbox.value = roleDetail.roleid; // set value to role's ID
				        assignCheckbox.className = 'assignCheckbox'; // for styling or selection
				        
				        // Create label for readability
				        const label = document.createElement('label');
				        label.innerHTML = roleDetail.name;
				        label.insertBefore(assignCheckbox, label.firstChild);
				
				        // Create wrapper div
				        const wrapperDiv = document.createElement('div');
				        wrapperDiv.className = 'sectionWrapper';
				
				        // Append checkbox and label to wrapper div
				        wrapperDiv.appendChild(label);
				
				        // Append wrapper div to the roles list
				        rolesListBusinessUnit.appendChild(wrapperDiv);
				    });
				});
				}

				// Fetch all teams and display them under a designated section (for example, under section7)
			        const teamsList = document.getElementById('section7').querySelector('ul');
			        teamsList.innerHTML = '';
			
			        fetchTeams(function(teams) {
			            if (!teams || !teams.entities) {
			                console.error('Teams not found');
			                return;
			            }
			            const teamDetailsArr = teams.entities.map(team => ({name: team.name, teamid: team.teamid}));
			            teamDetailsArr.sort((a, b) => {
			                if (a.name < b.name) return -1;
			                if (a.name > b.name) return 1;
			                return 0;
			            });
			
			            teamDetailsArr.forEach(teamDetail => {
			                // Create a div with class sectionWrapper
			                const wrapperDiv = document.createElement('div');
			                wrapperDiv.className = 'sectionWrapper';
			
			                // Create checkbox
			                const assignCheckbox = document.createElement('input');
			                assignCheckbox.type = 'checkbox';
			                assignCheckbox.value = teamDetail.teamid; // set value to team's ID
			                assignCheckbox.className = 'assignCheckbox'; // for styling or selection
			
			                // Create label for team name
			                const label = document.createElement('label');
			                label.textContent = teamDetail.name;
			
			                // Append checkbox and label to wrapperDiv
			                wrapperDiv.appendChild(assignCheckbox);
			                wrapperDiv.appendChild(label);
			
			                // Append wrapperDiv to the list (assuming the list is a 'ul' element)
			                teamsList.appendChild(wrapperDiv);
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
		
	  /* if (teams && teams.entities) {
	        renderGenericList(teams.entities, team => selectItem(team, '3'), 'teamsList', 'searchInput3', 'team', 'name', 'teamid');
	   } */
		
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
	    //new Promise(resolve => fetchTeams(resolve)),
	    //new Promise(resolve => fetchSecurityRoles(resolve)) 
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
