javascript: (function() {
  function fetchUsers(callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,fullname').then(callback);
  }

  function fetchRolesForUser(userId, callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuserroles', `?$filter=systemuserid eq ${userId}`).then(callback);
  }

  function displayPopup(users) {
    users.entities.sort((a, b) => a.fullname.localeCompare(b.fullname));
    var popupHtml = `
      <div class="popup">
        <style>
          .popup { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: white; border: 1px solid #888; padding: 20px; width: 300px; }
          #userList { max-height: 100px; overflow-y: scroll; }
          #searchInput { width: 100%; }
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
      userDiv.textContent = user.fullname;
      userDiv.onclick = function() {
        userListDiv.innerHTML = '';
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
      };
      userListDiv.appendChild(userDiv);
    });

    var searchInput = document.getElementById('searchInput');
    searchInput.onkeyup = function() {
      var searchText = this.value.toLowerCase();
      var userDivs = document.querySelectorAll('#userList div');
      userDivs.forEach(userDiv => {
        var text = userDiv.textContent.toLowerCase();
        userDiv.style.display = text.includes(searchText) ? '' : 'none';
      });
    };
  }

  fetchUsers(function(users) {
    displayPopup(users);
  });
})();
