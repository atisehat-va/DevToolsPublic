javascript: (function() {
  function fetchUsers(callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,fullname').then(callback);
  }

  function fetchRolesForUser(userId, callback) {
    var userRolesUrl = `systemusers(${userId})/systemuserroles_association?$select=roleid`;
    Xrm.WebApi.retrieveMultipleRecords('systemuserroles', `?$filter=systemuserid eq ${userId}`).then(callback);
  }

  function displayPopup(users) {
    var popupHtml = `
      <div class="popup">
        <style>
          .popup { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: white; border: 1px solid #888; padding: 20px; width: 300px; height: 400px; overflow: hidden; }
          #userSearch { width: 100%; }
          .user { width: 100%; cursor: pointer; }
          #userList { overflow-y: scroll; width: 100%; height: 200px; }
        </style>
        <input id="userSearch" type="text" placeholder="Search Users">
        <div id="userList"></div>
        <div id="roles"></div>
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

    function renderUserList(filterText = '') {
      var userListDiv = document.getElementById('userList');
      userListDiv.innerHTML = '';
      users.entities.forEach(user => {
        if (user.fullname.toLowerCase().includes(filterText.toLowerCase())) {
          var userDiv = document.createElement('div');
          userDiv.className = 'user';
          userDiv.style.width = '100%';
          
          var userName = document.createElement('span');
          userName.textContent = user.fullname;

          userDiv.appendChild(userName);
          userDiv.onclick = function() {
            var userId = user.systemuserid;
            fetchRolesForUser(userId, function(roles) {
              var rolesDiv = document.getElementById('roles');
              rolesDiv.innerHTML = '';
              roles.entities.forEach(role => {
                var roleId = role['roleid'];
                Xrm.WebApi.retrieveRecord("role", roleId, "?$select=name,roleid").then(function(roleDetail) {
                  var roleItem = document.createElement('div');
                  roleItem.textContent = roleDetail.name;
                  rolesDiv.appendChild(roleItem);
                });
              });
            });
          };

          userListDiv.appendChild(userDiv);
        }
      });
    }

    document.getElementById('userSearch').onkeyup = function() {
      renderUserList(this.value);
    };

    renderUserList(); // Initial render
  }

  fetchUsers(function(users) {
    displayPopup(users);
  });
})();
