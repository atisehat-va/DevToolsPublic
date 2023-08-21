javascript: (function() {
  function fetchUsers(callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,fullname').then(callback);
  }

  function getUserSecurityRoles(userId) {
    var userRolesUrl = `systemusers(${userId})/systemuserroles_association?$select=roleid`;
    Xrm.WebApi.retrieveMultipleRecords("systemuserroles", `?$filter=systemuserid eq ${userId}`).then(
      function (result) {
        var roleDetailPromises = [];
        result.entities.forEach(function (userRole) {
          var roleId = userRole["roleid"];
          roleDetailPromises.push(Xrm.WebApi.retrieveRecord("role", roleId, "?$select=name,roleid"));
        });
        Promise.all(roleDetailPromises).then(
          function (roleDetails) {
            var rolesList = '<ul>';
            roleDetails.forEach(function (roleDetail) {
              rolesList += `<li>${roleDetail.name}</li>`;
            });
            rolesList += '</ul>';
            document.getElementById('roles').innerHTML = rolesList;
            console.log("User's Security Roles:", roleDetails.map(roleDetail => roleDetail.name));
          },
          function (error) {
            console.log("Error fetching role details: " + error.message);
          }
        );
      },
      function (error) {
        console.log("Error fetching user roles: " + error.message);
      }
    );
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
      getUserSecurityRoles(userId);
    };
  }

  fetchUsers(function(users) {
    displayPopup(users);
  });
})();
