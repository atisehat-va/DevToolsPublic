javascript: (function() {
  // Include the Select2 CSS
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/css/select2.min.css';
  document.head.appendChild(link);

  // Include the Select2 JS
  var script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/js/select2.min.js';
  document.head.appendChild(script);

  // Delay the execution to ensure Select2 is loaded
  setTimeout(function() {
    function fetchUsers(callback) {
      Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,fullname').then(callback);
    }

    function fetchRolesForUser(userId, callback) {
      var userRolesUrl = `systemusers(${userId})/systemuserroles_association?$select=roleid`;
      Xrm.WebApi.retrieveMultipleRecords('systemuserroles', `?$filter=systemuserid eq ${userId}`).then(callback);
    }

    function displayPopup(users) {
      // Sort the users alphabetically
      users.entities.sort((a, b) => a.fullname.localeCompare(b.fullname));

      var popupHtml = `
        <div class="popup">
          <style>
            .popup { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: white; border: 1px solid #888; padding: 20px; width: 300px; }
            #userSelect { width: 100%; } /* Set the width of the dropdown */
          </style>
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

      // Initialize Select2 on the dropdown
      $('#userSelect').select2();

      document.getElementById('userSelect').onchange = function() {
        var userId = this.value;
        fetchRolesForUser(userId, function(roles) {
          var rolesList = document.getElementById('roles');
          rolesList.innerHTML = ''; // Clear previous roles
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
  }, 4000); // 1-second delay to ensure Select2 is loaded
})();
