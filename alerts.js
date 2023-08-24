//--------------new-------------------------------------------
javascript: (function() {
  const popupCss = `
    .popup { background-color: white; border: 2px solid #444; border-radius: 10px; width: 700px; height: 500px; overflow: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5); }
    .section { padding: 20px; border-right: 1px solid #ccc; overflow-y: scroll; }
    #section1 { text-align: center; height: 220px; }
    #section1 input { margin-bottom: 10px; width: 230px;}
    #section1 #userList { margin-bottom: 15px; max-height: 130px; overflow-y: scroll; scrollbar-width: none; -ms-overflow-style: none; }
    #section1 #userList::-webkit-scrollbar { display: none; }
    #section2, #section3 { display: inline-block; width: 50%; height: 250px; vertical-align: top; box-sizing: border-box; text-align: left; }
    .selected { background-color: #f0f0f0; }
    .user { cursor: pointer; padding: 3px; font-size: 14px; }
    #sectionsRow { white-space: nowrap; }
    #businessUnitList li, #teamsList li, #section3 ul li { margin-left: 20px; }
    #businessUnitList { margin-bottom: 15px; }
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

  function fetchBusinessUnitName(businessUnitId, callback) {
    Xrm.WebApi.retrieveRecord('businessunit', businessUnitId, '?$select=name').then(callback);
  }

  function createPopupHtml() {
    return `
      <div class="popup">
        <style>${popupCss}</style>
        <div class="section" id="section1">
          <h3>User Info</h3>
          <input type="text" id="searchInput" placeholder="Search Users">
          <div id="userList"></div>
        </div>
        <div id="sectionsRow">
          <div class="section" id="section2">
            <h3>Business Unit:</h3><ul id="businessUnitList"></ul>
            <h3>Teams:</h3><ul id="teamsList"></ul>
          </div>
          <div class="section" id="section3"><h3>Security Roles:</h3><ul></ul></div>
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

  function renderUserList(users, selectUserCallback) {
    const userListDiv = document.getElementById('userList');
    users.forEach(user => {
      const userDiv = document.createElement('div');
      userDiv.className = 'user';
      userDiv.textContent = user.fullname;
      userDiv.dataset.id = user.systemuserid;
      userDiv.onclick = () => selectUserCallback(user);
      userListDiv.appendChild(userDiv);
    });
  }

  function selectUser(user) {
    document.querySelectorAll('.user').forEach(el => el.classList.remove('selected'));
    const userDiv = document.getElementById('userList').querySelector(`[data-id='${user.systemuserid}']`);
    userDiv.classList.add('selected');
    
    const businessUnitList = document.getElementById('businessUnitList');
    businessUnitList.innerHTML = '';

    fetchBusinessUnitName(user._businessunitid_value, function(businessUnit) {
      const listItem = document.createElement('li');
      listItem.textContent = businessUnit.name;
      businessUnitList.appendChild(listItem);
    });

    const teamsList = document.getElementById('teamsList');
    teamsList.innerHTML = '';
    fetchTeamsForUser(user.systemuserid, function(response) {
      response.entities[0].teammembership_association.forEach(team => {
        const listItem = document.createElement('li');
        listItem.textContent = team.name;
        teamsList.appendChild(listItem);
      });
    });    

    fetchRolesForUser(user.systemuserid, function(roles) {
      const rolesList = document.getElementById('section3').querySelector('ul');
      rolesList.innerHTML = '';
      roles.entities.forEach(role => {
        const roleId = role['roleid'];
        Xrm.WebApi.retrieveRecord("role", roleId, "?$select=name,roleid").then(function(roleDetail) {
          const listItem = document.createElement('li');
          listItem.textContent = roleDetail.name;
          rolesList.appendChild(listItem);
        });
      });
    });
  }

  function setupSearchFilter() {
    document.getElementById('searchInput').oninput = function() {
      const searchValue = this.value.toLowerCase();
      document.querySelectorAll('.user').forEach(el => {
        el.style.display = el.textContent.toLowerCase().includes(searchValue) ? 'block' : 'none';
      });
    };
  }

  function displayPopup(users) {
    users.entities.sort((a, b) => a.fullname.localeCompare(b.fullname));
    createAndAppendPopup();
    renderUserList(users.entities, selectUser);
    setupSearchFilter();
  }

  fetchUsers(function(users) {
    displayPopup(users);
  });
})(); // code reviewed


//------------end NEw 08-24-23---------------------------------
javascript: (function() {
  const popupCss = `
    .popup { background-color: white; border: 2px solid #444; border-radius: 10px; width: 700px; height: 500px; overflow: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5); }
    .section { padding: 20px; border-right: 1px solid #ccc; overflow-y: scroll; }
    .section h3 { text-align: center; margin-bottom: 10px; }
    #section1 { text-align: center; height: 220px; }
    #section1 input { margin-bottom: 10px; width: 230px;}
    #section1 #userList { margin-bottom: 15px; max-height: 130px; overflow-y: scroll; scrollbar-width: none; -ms-overflow-style: none; }
    #section1 #userList::-webkit-scrollbar { display: none; }
    #section2, #section3, #section4 { display: inline-block; width: 33%; height: 250px; vertical-align: top; box-sizing: border-box; text-align: left; }
    .selected { background-color: #f0f0f0; }
    .user { cursor: pointer; padding: 3px; font-size: 14px; }
    #sectionsRow { white-space: nowrap; }
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

  function fetchBusinessUnitName(businessUnitId, callback) {
    Xrm.WebApi.retrieveRecord('businessunit', businessUnitId, '?$select=name').then(callback);
  }

  function createPopupHtml() {
    return `
      <div class="popup">
        <style>${popupCss}</style>
        <div class="section" id="section1">
          <h3>User Info</h3>
          <input type="text" id="searchInput" placeholder="Search Users">
          <div id="userList"></div>
        </div>
        <div id="sectionsRow">
          <div class="section" id="section2"><h3>Business Unit</h3><ul></ul></div>
          <div class="section" id="section3"><h3>Teams</h3><ul></ul></div>
          <div class="section" id="section4"><h3>Security Roles</h3><ul></ul></div>
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

  function renderUserList(users, selectUserCallback) {
    const userListDiv = document.getElementById('userList');
    users.forEach(user => {
      const userDiv = document.createElement('div');
      userDiv.className = 'user';
      userDiv.textContent = user.fullname;
      userDiv.dataset.id = user.systemuserid;
      userDiv.onclick = () => selectUserCallback(user);
      userListDiv.appendChild(userDiv);
    });
  }

  function selectUser(user) {
    document.querySelectorAll('.user').forEach(el => el.classList.remove('selected'));
    const userDiv = document.getElementById('userList').querySelector(`[data-id='${user.systemuserid}']`);
    userDiv.classList.add('selected');
    
    const businessUnitList = document.getElementById('section2').querySelector('ul');
    businessUnitList.innerHTML = '';

    fetchBusinessUnitName(user._businessunitid_value, function(businessUnit) {
      const listItem = document.createElement('li');
      listItem.textContent = businessUnit.name;
      businessUnitList.appendChild(listItem);
    });

    fetchRolesForUser(user.systemuserid, function(roles) {
      const rolesList = document.getElementById('section4').querySelector('ul');
      rolesList.innerHTML = '';
      roles.entities.forEach(role => {
        const roleId = role['roleid'];
        Xrm.WebApi.retrieveRecord("role", roleId, "?$select=name,roleid").then(function(roleDetail) {
          const listItem = document.createElement('li');
          listItem.textContent = roleDetail.name;
          rolesList.appendChild(listItem);
        });
      });
    });

    fetchTeamsForUser(user.systemuserid, function(response) {
      const teamsList = document.getElementById('section3').querySelector('ul');
      teamsList.innerHTML = '';
      response.entities[0].teammembership_association.forEach(team => {
        const listItem = document.createElement('li');
        listItem.textContent = team.name;
        teamsList.appendChild(listItem);
      });
    });
  }

  function setupSearchFilter() {
    document.getElementById('searchInput').oninput = function() {
      const searchValue = this.value.toLowerCase();
      document.querySelectorAll('.user').forEach(el => {
        el.style.display = el.textContent.toLowerCase().includes(searchValue) ? 'block' : 'none';
      });
    };
  }

  function displayPopup(users) {
    users.entities.sort((a, b) => a.fullname.localeCompare(b.fullname));
    createAndAppendPopup();
    renderUserList(users.entities, selectUser);
    setupSearchFilter();
  }

  fetchUsers(function(users) {
    displayPopup(users);
  });
})();

//----------------------NEW working--Test-----------
function updateUserDetails(userId, businessUnitId, teamId, roleId) {
    // Change Business Unit
    var data1 = {
        "businessunitid@odata.bind": "/businessunits(" + businessUnitId + ")"
    };
    Xrm.WebApi.updateRecord("systemuser", userId, data1).then(function() {
        // Associate User to Specified Team
        var teamUrl = Xrm.Utility.getGlobalContext().getClientUrl() + "/api/data/v9.0/teams(" + teamId + ")/teammembership_association/$ref";
        var teamData = {
            "@odata.id": Xrm.Utility.getGlobalContext().getClientUrl() + "/api/data/v9.0/systemusers(" + userId + ")"
        };
        var teamRequest = new XMLHttpRequest();
        teamRequest.open("POST", teamUrl, true);
        teamRequest.setRequestHeader("OData-MaxVersion", "4.0");
        teamRequest.setRequestHeader("OData-Version", "4.0");
        teamRequest.setRequestHeader("Accept", "application/json");
        teamRequest.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        teamRequest.onreadystatechange = function() {
            if (this.readyState === 4) {
                teamRequest.onreadystatechange = null;
                if (this.status === 204) {
                    // Success - continue to associate role
                } else {
                    var error = JSON.parse(this.response).error;
                    console.error(error.message);
                }
            }
        };
        teamRequest.send(JSON.stringify(teamData));

        // Associate User to Specified Role
        var roleUrl = Xrm.Utility.getGlobalContext().getClientUrl() + "/api/data/v9.0/roles(" + roleId + ")/systemuserroles_association/$ref";
        var roleData = {
            "@odata.id": Xrm.Utility.getGlobalContext().getClientUrl() + "/api/data/v9.0/systemusers(" + userId + ")"
        };
        var roleRequest = new XMLHttpRequest();
        roleRequest.open("POST", roleUrl, true);
        roleRequest.setRequestHeader("OData-MaxVersion", "4.0");
        roleRequest.setRequestHeader("OData-Version", "4.0");
        roleRequest.setRequestHeader("Accept", "application/json");
        roleRequest.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        roleRequest.onreadystatechange = function() {
            if (this.readyState === 4) {
                roleRequest.onreadystatechange = null;
                if (this.status === 204) {
                    // Success
                } else {
                    var error = JSON.parse(this.response).error;
                    console.error(error.message);
                }
            }
        };
        roleRequest.send(JSON.stringify(roleData));
    });
}

// Usage
updateUserDetails("<USER_ID>", "<BUSINESS_UNIT_ID>", "<TEAM_ID>", "<ROLE_ID>");
//---------------------NEW NEW--------------
function updateUserDetails(userId, businessUnitId, teamId, roleId) {
    var clientUrl = Xrm.Utility.getGlobalContext().getClientUrl();

    // Change Business Unit
    var data1 = {
        "businessunitid@odata.bind": "/businessunits(" + businessUnitId + ")"
    };

    Xrm.WebApi.updateRecord("systemuser", userId, data1)
        .then(function() {
            return new Promise(function(resolve) {
                // Disassociate User from Current Roles
                var rolesUrl = clientUrl + "/api/data/v9.0/systemusers(" + userId + ")/systemuserroles_association";
                var roleRequest = new XMLHttpRequest();
                roleRequest.open("GET", rolesUrl, true);
                roleRequest.setRequestHeader("OData-MaxVersion", "4.0");
                roleRequest.setRequestHeader("OData-Version", "4.0");
                roleRequest.setRequestHeader("Accept", "application/json");
                roleRequest.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        roleRequest.onreadystatechange = null;
                        if (this.status === 200) {
                            var results = JSON.parse(this.response).value;
                            Promise.all(results.map(function(result) {
                                var disassociateUrl = clientUrl + "/api/data/v9.0/systemusers(" + userId + ")/systemuserroles_association/$ref?$id=" + clientUrl + "/api/data/v9.0/roles(" + result.roleid + ")";
                                var disassociateRequest = new XMLHttpRequest();
                                disassociateRequest.open("DELETE", disassociateUrl, true);
                                disassociateRequest.send();
                            })).then(resolve);
                        } else {
                            resolve();
                        }
                    }
                };
                roleRequest.send();
            });
        })
        .then(function() {
            return new Promise(function(resolve) {
                // Disassociate User from Current Teams
                var teamsUrl = clientUrl + "/api/data/v9.0/systemusers(" + userId + ")/teammembership_association";
                var teamRequest = new XMLHttpRequest();
                teamRequest.open("GET", teamsUrl, true);
                teamRequest.setRequestHeader("OData-MaxVersion", "4.0");
                teamRequest.setRequestHeader("OData-Version", "4.0");
                teamRequest.setRequestHeader("Accept", "application/json");
                teamRequest.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        teamRequest.onreadystatechange = null;
                        if (this.status === 200) {
                            var results = JSON.parse(this.response).value;
                            Promise.all(results.map(function(result) {
                                var disassociateUrl = clientUrl + "/api/data/v9.0/teams(" + result.teamid + ")/teammembership_association/$ref?$id=" + clientUrl + "/api/data/v9.0/systemusers(" + userId + ")";
                                var disassociateRequest = new XMLHttpRequest();
                                disassociateRequest.open("DELETE", disassociateUrl, true);
                                disassociateRequest.send();
                            })).then(resolve);
                        } else {
                            resolve();
                        }
                    }
                };
                teamRequest.send();
            });
        })
        .then(function() {
            // Associate User to Specified Team
            return new Promise(function(resolve) {
                var associateTeamUrl = clientUrl + "/api/data/v9.0/teams(" + teamId + ")/teammembership_association/$ref";
                var associateTeamData = {
                    "@odata.id": clientUrl + "/api/data/v9.0/systemusers(" + userId + ")"
                };
                var associateTeamRequest = new XMLHttpRequest();
                associateTeamRequest.open("POST", associateTeamUrl, true);
                associateTeamRequest.setRequestHeader("OData-MaxVersion", "4.0");
                associateTeamRequest.setRequestHeader("OData-Version", "4.0");
                associateTeamRequest.setRequestHeader("Accept", "application/json");
                associateTeamRequest.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                associateTeamRequest.send(JSON.stringify(associateTeamData));
                associateTeamRequest.onreadystatechange = function() {
                    if (this.readyState === 4) {
                        associateTeamRequest.onreadystatechange = null;
                        resolve();
                    }
                };
            });
        })
        .then(function() {
            // Associate User to Specified Role
            var associateRoleUrl = clientUrl + "/api/data/v9.0/roles(" + roleId + ")/systemuserroles_association/$ref";
            var associateRoleData = {
                "@odata.id": clientUrl + "/api/data/v9.0/systemusers(" + userId + ")"
            };
            var associateRoleRequest = new XMLHttpRequest();
            associateRoleRequest.open("POST", associateRoleUrl, true);
            associateRoleRequest.setRequestHeader("OData-MaxVersion", "4.0");
            associateRoleRequest.setRequestHeader("OData-Version", "4.0");
            associateRoleRequest.setRequestHeader("Accept", "application/json");
            associateRoleRequest.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            associateRoleRequest.send(JSON.stringify(associateRoleData));
        });
}
// Usage
updateUserDetails("<USER_ID>", "<BUSINESS_UNIT_ID>", "<TEAM_ID>", "<ROLE_ID>");
///------------------lastNEw--------------

async function updateUserDetails(userId, businessUnitId, teamId, roleId) {
  const clientUrl = Xrm.Utility.getGlobalContext().getClientUrl();

  try {
    await changeBusinessUnit(userId, businessUnitId);
    await disassociateUserFromRoles(userId, clientUrl);
    await disassociateUserFromTeams(userId, clientUrl);
    await associateUserToTeam(userId, teamId, clientUrl);
    await associateUserToRole(userId, roleId, clientUrl);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function changeBusinessUnit(userId, businessUnitId) {
  const data1 = {
    "businessunitid@odata.bind": `/businessunits(${businessUnitId})`
  };
  return Xrm.WebApi.updateRecord("systemuser", userId, data1);
}

async function disassociateUserFromRoles(userId, clientUrl) {
  const rolesUrl = `${clientUrl}/api/data/v9.0/systemusers(${userId})/systemuserroles_association`;
  const response = await fetch(rolesUrl, {
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json" }
  });
  const results = (await response.json()).value;

  await Promise.all(results.map(async (result) => {
    const disassociateUrl = `${clientUrl}/api/data/v9.0/systemusers(${userId})/systemuserroles_association/$ref?$id=${clientUrl}/api/data/v9.0/roles(${result.roleid})`;
    await fetch(disassociateUrl, { method: "DELETE" });
  }));
}

async function disassociateUserFromTeams(userId, clientUrl) {
  const teamsUrl = `${clientUrl}/api/data/v9.0/systemusers(${userId})/teammembership_association`;
  const response = await fetch(teamsUrl, {
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json" }
  });
  const results = (await response.json()).value;

  await Promise.all(results.map(async (result) => {
    const disassociateUrl = `${clientUrl}/api/data/v9.0/teams(${result.teamid})/teammembership_association/$ref?$id=${clientUrl}/api/data/v9.0/systemusers(${userId})`;
    await fetch(disassociateUrl, { method: "DELETE" });
  }));
}

async function associateUserToTeam(userId, teamId, clientUrl) {
  const associateTeamUrl = `${clientUrl}/api/data/v9.0/teams(${teamId})/teammembership_association/$ref`;
  const associateTeamData = {
    "@odata.id": `${clientUrl}/api/data/v9.0/systemusers(${userId})`
  };
  await fetch(associateTeamUrl, {
    method: "POST",
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json", "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(associateTeamData)
  });
}

async function associateUserToRole(userId, roleId, clientUrl) {
  const associateRoleUrl = `${clientUrl}/api/data/v9.0/roles(${roleId})/systemuserroles_association/$ref`;
  const associateRoleData = {
    "@odata.id": `${clientUrl}/api/data/v9.0/systemusers(${userId})`
  };
  await fetch(associateRoleUrl, {
    method: "POST",
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json", "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(associateRoleData)
  });
}

// Usage
updateUserDetails("<USER_ID>", "<BUSINESS_UNIT_ID>", "<TEAM_ID>", "<ROLE_ID>");

