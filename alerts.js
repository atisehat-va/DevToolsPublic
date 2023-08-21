javascript: (function() {
  function fetchUsers(callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,fullname').then(callback);
  }

  function fetchRolesForUser(userId, callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuserroles', '?$filter=systemuserid eq ' + userId)
      .then(callback)
      .catch(error => {
        console.log("Error fetching roles:", error);
      });
  }

  function displayPopup(users) {
    var popupHtml = `
      <div class="popup">
        <style>
          .popup { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: white; border: 1px solid #888; padding: 20px; width: 500px; } /* Increased width */
          #userSelect { width: 100%; }
          #roles { overflow-y: auto; max-height: 100px; } /* Scrollable div for roles */
        </style>
        <select id="userSelect">`;
    users.entities.forEach(user => {
      popupHtml += `<option value="${user.systemuserid}">${user.fullname}</option>`;
    });
    popupHtml += `</select><div id="roles"></div></div>`;

    var popupDiv = document.createElement('div');
    popupDiv.id = 'bookmarkletPopup';
    popupDiv.innerHTML = popupHtml;
    popupDiv.style.position = 'absolute';
    popupDiv.style.zIndex = '10000';
    popupDiv.style.left = '50%';
    popupDiv.style.top = '50%';
    popupDiv.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(popupDiv);

    document.getElementById('userSelect').onchange = function() {
      var userId = this.value;
      fetchRolesForUser(userId, function(roles) {
        document.getElementById('roles').innerHTML = roles.entities.map(role => role.name).join(', ');
      });
    };
  }

  fetchUsers(function(users) {
    displayPopup(users);
  });
})();
