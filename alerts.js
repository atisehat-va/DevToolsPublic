javascript: (function() {
  function fetchUsers(callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,fullname').then(callback);
  }

  function fetchRolesForUser(userId, callback) {
    var userRolesUrl = `systemusers(${userId})/systemuserroles_association?$select=roleid`;
    Xrm.WebApi.retrieveMultipleRecords('systemuserroles', `?$filter=systemuserid eq ${userId}`).then(callback);
  }

  function displayPopup(users) {
    var sortedUsers = users.entities.sort((a, b) => a.fullname.localeCompare(b.fullname));

    var popupHtml = `
      <div class="popup">
        <style>
          .popup { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: white; border: 1px solid #888; padding: 20px; width: 300px; }
          #userList { width: 100%; max-height: 200px; overflow: auto; border: 1px solid #ccc; }
          #userList li { cursor: pointer; padding: 5px; }
          #userList li:hover { background-color: #f0f0f0; }
          #searchInput { width: 100%; }
        </style>
        <input type="text" id="searchInput" placeholder="Search Users">
        <ul id="userList"></ul>
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

    var searchInput = document.getElementById('searchInput');
    var userList = document.getElementById('userList');

    function updateOptions() {
      var searchText = searchInput.value.toLowerCase();
      userList.innerHTML = '';
      sortedUsers.forEach(user => {
        if (user.fullname.toLowerCase().includes(searchText)) {
          var listItem = document.createElement('li');
          listItem.textContent = user.fullname;
          listItem.dataset.userId = user.systemuserid;
          userList.appendChild(listItem);

          listItem.addEventListener('click', function() {
            var userId = this.dataset.userId;
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
          });
        }
      });
    }

    updateOptions();
    searchInput.addEventListener('input', updateOptions);
  }

  fetchUsers(function(users) {
    displayPopup(users);
  });
})();
