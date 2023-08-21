javascript: (function() {
  // Include Select2 CSS
  var link = document.createElement('link');
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.1.0-beta.1/css/select2.min.css';
  link.type = 'text/css';
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  // Include Select2 JS
  var script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.1.0-beta.1/js/select2.min.js';
  document.body.appendChild(script);

  // Wait for the Select2 library to load
  setTimeout(function() {
    function fetchUsers(callback) {
      Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,fullname').then(callback);
    }

    function fetchRolesForUser(userId, callback) {
      Xrm.WebApi.retrieveMultipleRecords('systemuserroles', '?$filter=systemuserid eq ' + userId).then(callback);
    }

    function displayPopup(users) {
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

      // Convert the dropdown into Select2 searchable dropdown
      $('#userSelect').select2();

      document.getElementById('userSelect').onchange = function() {
        var userId = this.value;
        fetchRolesForUser(userId, function(roles) {
          var rolesList = document.getElementById('roles');
          rolesList.innerHTML = '';
          roles.entities.forEach(role => {
            var listItem = document.createElement('li');
            listItem.textContent = role.name;
            rolesList.appendChild(listItem);
          });
        });
      };
    }

    fetchUsers(function(users) {
      displayPopup(users);
    });
  }, 1000); // Waiting for 1 second for the Select2 library to load
})();
