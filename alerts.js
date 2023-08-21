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
          .popup { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: white; border: 1px solid #888; padding: 20px; width: 300px; }
          #userList { width: 100%; height: 200px; overflow: auto; border: 1px solid #ccc; }
          #userList li { cursor: pointer; padding: 5px; }
          #userList li:hover { background-color: #f0f0f0; }
          #searchInput { width: 100%; }
        </style>
        <input type="text" id="searchInput" placeholder="Search Users">
        <ul id="userList"></ul>
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

    var userList = document.getElementById('userList');
    users.entities.forEach(user => {
      var listItem = document.createElement('li');
      listItem.textContent = user.fullname;
      listItem.value = user.systemuserid;
      listItem.onclick = function() {
        fetchRolesForUser(this.value, function(roles) {
          var rolesList = document.getElementById('roles');
          rolesList.innerHTML = '';
          roles.entities.forEach(role => {
            var roleId = role['roleid'];
            Xrm.WebApi.retrieveRecord("role", roleId, "?$select=name,roleid").then(function(roleDetail) {
              var roleItem = document.createElement('li');
              roleItem.textContent = roleDetail.name;
              rolesList.appendChild(roleItem);
            });
          });
        });
      };
      userList.appendChild(listItem);
    });

    document.getElementById('searchInput').onkeyup = function() {
      var searchText = this.value.toLowerCase();
      var items = document.querySelectorAll('#userList li');
      items.forEach(item => {
        var text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchText) ? '' : 'none';
      });
    };
  }

  fetchUsers(function(users) {
    displayPopup(users);
  });
})();
