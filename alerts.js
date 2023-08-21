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
          #searchInput, #selectedUser { width: 100%; }
          #userSelect { width: 100%; display: none; }
        </style>
        <input type="text" id="searchInput" placeholder="Search Users">
        <select id="userSelect"></select>
        <p id="selectedUser"></p>
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

    var userSelect = document.getElementById('userSelect');
    users.entities.forEach(user => {
      var optionItem = document.createElement('option');
      optionItem.textContent = user.fullname;
      optionItem.value = user.systemuserid;
      userSelect.appendChild(optionItem);
    });

    var searchInput = document.getElementById('searchInput');
    searchInput.onfocus = function() {
      userSelect.style.display = '';
    };

    userSelect.onchange = function() {
      var userId = this.value;
      this.style.display = 'none';
      var selectedUser = users.entities.find(user => user.systemuserid === userId);
      document.getElementById('selectedUser').textContent = `Selected User: ${selectedUser.fullname}`;
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

    searchInput.onkeyup = function() {
      var searchText = this.value.toLowerCase();
      var options = document.querySelectorAll('#userSelect option');
      options.forEach(option => {
        var text = option.textContent.toLowerCase();
        option.style.display = text.includes(searchText) ? '' : 'none';
      });
    };
  }

  fetchUsers(function(users) {
    displayPopup(users);
  });
})();
