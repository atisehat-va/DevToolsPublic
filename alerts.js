javascript: (function() {
  function fetchUsers(callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,fullname').then(callback);
  }

  function fetchRolesForUser(userId, callback) {
    var userRolesUrl = `systemusers(${userId})/systemuserroles_association?$select=roleid`;
    Xrm.WebApi.retrieveMultipleRecords('systemuserroles', `?$filter=systemuserid eq ${userId}`).then(callback);
  }

  function displayPopup(users) {
    users.entities.sort((a, b) => a.fullname.localeCompare(b.fullname));
    var popupHtml = `
      <div class="popup">
        <style>
          .popup { display: flex; flex-direction: column; align-items: flex-start; background-color: white; border: 1px solid #888; padding: 20px; width: 300px; }
          #userList, #searchInput { width: 100%; }
          #userList { max-height: 100px; overflow-y: scroll; }
          .selected { background-color: lightblue; }
          .user { cursor: pointer; padding: 3px; }
        </style>
        <input type="text" id="searchInput" placeholder="Search Users">
        <div id="userList"></div>
        <ul id="roles"></ul>
      </div>`;

    var popupDiv = document.createElement('div');
    popupDiv.id = 'bookmarkletPopup';
    popupDiv.innerHTML = popupHtml;
    popupDiv.style.position = 'absolute';
    popupDiv.style.zIndex = '10000';
    popupDiv.style.left = '50%';
    popupDiv.style.top = '50%';
    popupDiv.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(popupDiv);

    var userListDiv = document.getElementById('userList');
    users.entities.forEach(user => {
      var userDiv = document.createElement('div');
      userDiv.className = 'user';
      userDiv.textContent = user.fullname;
      userDiv.onclick = function() {
        selectUser(user);
      };
      userListDiv.appendChild(userDiv);
    });

    function selectUser(user) {
      document.querySelectorAll('.user').forEach(el => el.classList.remove('selected'));
      userListDiv.querySelector(`[data-id='${user.systemuserid}']`).classList.add('selected');
      fetchRolesForUser(user.systemuserid, function(roles) {
        var rolesList = document.getElementById('roles');
        rolesList.innerHTML = '';
        roles.entities.forEach(role => {
          var roleId = role['roleid'];
          Xrm.WebApi.retrieveRecord("role", roleId, "?$select=name,roleid").then(function(roleDetail) {
            var listItem = document.createElement('li');
            listItem.textContent = roleDetail.name;
            rolesList.appendChild(listItem);
          });
        });
      });
    }

    document.getElementById('searchInput').oninput = function() {
      var searchValue = this.value.toLowerCase();
      document.querySelectorAll('.user').forEach(el => {
        el.style.display = el.textContent.toLowerCase().includes(searchValue) ? 'block' : 'none';
      });
    };
  }

  fetchUsers(function(users) {
    displayPopup(users);
  });
})();
