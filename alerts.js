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
          #dropdown div { cursor: pointer; }
          #dropdown { display: none; border: 1px solid #888; }
          #searchInput { width: 100%; }
          #userSelect { display: none; }
        </style>
        <input type="text" id="searchInput" placeholder="Search Users">
        <div id="dropdown"></div>
        <select id="userSelect">`;
    users.entities.forEach(user => {
      popupHtml += `<option value="${user.systemuserid}">${user.fullname}</option>`;
    });
    popupHtml += `</select><ul id="roles"></ul></div>`;

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
    var dropdown = document.getElementById('dropdown');
    var userSelect = document.getElementById('userSelect');

    function updateDropdown(searchValue) {
      dropdown.innerHTML = '';
      if (searchValue.trim() === '') {
        dropdown.style.display = 'none';
        return;
      }
      dropdown.style.display = 'block';
      users.entities.forEach(user => {
        if (user.fullname.toLowerCase().includes(searchValue.toLowerCase())) {
          var optionDiv = document.createElement('div');
          optionDiv.textContent = user.fullname;
          optionDiv.onclick = function() {
            dropdown.style.display = 'none';
            searchInput.value = user.fullname;
            userSelect.value = user.systemuserid;
            userSelect.onchange();
          };
          dropdown.appendChild(optionDiv);
        }
      });
    }

    searchInput.onkeyup = function() {
      updateDropdown(this.value);
    };

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

    updateDropdown('');
  }

  fetchUsers(function(users) {
    displayPopup(users);
  });
})();
