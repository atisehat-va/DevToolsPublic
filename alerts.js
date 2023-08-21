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
          .popup { display: flex; flex-direction: column; align-items: flex-start; background-color: white; border: 1px solid #888; padding: 20px; width: 300px; }
          #userList { max-height: 200px; overflow-y: scroll; height: 200px; }
          #searchInput { width: 100%; }
          .selected { background-color: lightblue; }
          .user { cursor: pointer; padding: 10px; width: 100%; font-size: 14px; }
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

    var userList = document.getElementById('userList');
    users.entities.forEach(user => {
      var userDiv = document.createElement('div');
      userDiv.className = 'user';
      userDiv.textContent = user.fullname;
      userDiv.onclick = function() {
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
        document.querySelectorAll('.user').forEach(elem => elem.classList.remove('selected'));
        userDiv.classList.add('selected');
      };
      userList.appendChild(userDiv);
    });

    document.getElementById('searchInput').oninput = function() {
      var searchValue = this.value.toLowerCase();
      var userDivs = document.querySelectorAll('.user');
      userDivs.forEach(div => {
        if (searchValue === '' || div.textContent.toLowerCase().includes(searchValue)) {
          div.style.display = 'block';
        } else {
          div.style.display = 'none';
        }
      });
      if (searchValue === '') {
        document.getElementById('roles').innerHTML = '';
        document.querySelectorAll('.user').forEach(elem => elem.classList.remove('selected'));
      }
    };
  }

  fetchUsers(function(users) {
    displayPopup(users);
  });
})();
