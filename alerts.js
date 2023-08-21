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
          .popup { background-color: white; border: 1px solid #888; width: 300px; }
          .section { padding: 20px; text-align: center; }
          #section2, #section3, #section4 { display: inline-block; width: 33%; vertical-align: top; }
          #userList { max-height: 100px; overflow-y: scroll; }
          .selected { background-color: lightblue; }
          .user { cursor: pointer; padding: 3px; }
        </style>
        <div class="section" id="section1">
          <h3>Section 1</h3>
          <input type="text" id="searchInput" placeholder="Search Users">
          <div id="userList"></div>
        </div>
        <div id="sectionsRow">
          <div class="section" id="section2"><h3>Section 2</h3></div>
          <div class="section" id="section3"><h3>Section 3</h3></div>
          <div class="section" id="section4"><h3>Section 4</h3>
            <ul></ul>
          </div>
        </div>
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
      userDiv.dataset.id = user.systemuserid;
      userDiv.onclick = function() {
        selectUser(user);
      };
      userListDiv.appendChild(userDiv);
    });

    function selectUser(user) {
      document.querySelectorAll('.user').forEach(el => el.classList.remove('selected'));
      userListDiv.querySelector(`[data-id='${user.systemuserid}']`).classList.add('selected');
      fetchRolesForUser(user.systemuserid, function(roles) {
        var rolesList = document.getElementById('section4').querySelector('ul');
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
})(); // code reviewed
