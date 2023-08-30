let selectedUserId2 = null;
 let selectedUserName2 = '';
 let selectedUserId = null;
 let selectedBusinessUnitId = null;
 let selectedTeamIds = [];
 let selectedRoleIds = [];

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
