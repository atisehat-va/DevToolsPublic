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
          #searchInput { width: 100%; }
          #userSelect { width: 100%; }
        </style>
        <input type="text" id="searchInput" placeholder="Search Users">
        <select id="userSelect"></select>
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

    var searchInput = document.getElementById('searchInput');
    var userSelect = document.getElementById('userSelect');

    function updateOptions() {
      var searchText = searchInput.value.toLowerCase();
      userSelect.innerHTML = '';
      sortedUsers.forEach(user => {
        if (user.fullname.toLowerCase().includes(searchText)) {
          var option = document.createElement('option');
          option.value = user.systemuserid;
          option.textContent = user.fullname;
          userSelect.appendChild(option);
        }
      });
    }

    updateOptions();
    searchInput.addEventListener('input', updateOptions);

    userSelect.onchange = function() {
      var userId = this.value;
      fetchRolesForUser(userId, function(roles) {
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
  }

  fetchUsers(function(users) {
    displayPopup(users);
  });
})();
