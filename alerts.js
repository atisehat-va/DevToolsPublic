javascript: (function() {
  function fetchUsers(callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,fullname').then(callback);
  }

  function fetchRolesForUser(userId, callback) {
    var query = "?$filter=_systemuserid_value eq " + userId + "&$expand=roleid($select=name)";
    Xrm.WebApi.retrieveMultipleRecords('systemuserroles', query)
      .then(result => {
        var roles = result.entities.map(entity => entity.roleid.name);
        callback(roles);
      })
      .catch(error => {
        console.log("Error fetching roles:", error);
      });
  }

  function displayPopup(users) {
    var popupHtml = `
    <div class="popup">
      <style>
        .popup { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: white; border: 1px solid #888; padding: 20px; width: 300px; }
        #userSelect { width: 100%; }
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
        document.getElementById('roles').innerHTML = roles.join(', ');
        console.log("Roles for user ID", userId, ":", roles);
      });
    };
  }

  fetchUsers(function(users) {
    displayPopup(users);
  });
})();
