javascript: (function() {
  const popupCss = `
    .popup { background-color: white; border: 2px solid #444; border-radius: 10px; width: 700px; height: 500px; overflow: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5); }
    .section { padding: 20px; border-right: 1px solid #ccc; overflow-y: scroll; }
    .section h3 { text-align: center; margin-bottom: 10px; }
    #section1 { text-align: center; height: 200px; }
    #section1 input { margin-bottom: 10px; width: 230px;}
    #section1 #userList { margin-bottom: 15px; max-height: 150px; overflow-y: scroll; scrollbar-width: none; -ms-overflow-style: none; }
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
