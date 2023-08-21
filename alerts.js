javascript: (function() {
  function fetchUsersAndRoles(callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=fullname,systemuserid').then(function(users) {
      var userRoles = [];
      var processedUsers = 0;

      function processUser(user) {
        Xrm.WebApi.retrieveMultipleRecords('systemuserroles', '?$filter=systemuserid eq ' + user.systemuserid)
          .then(function(roles) {
            userRoles.push({ name: user.fullname, roles: roles.entities.map(role => role.name) });
            processedUsers++;

            if (processedUsers < users.entities.length) {
              processUser(users.entities[processedUsers]);
            } else {
              callback(userRoles);
            }
          });
      }

      if (users.entities.length > 0) {
        processUser(users.entities[0]);
      }
    });
  }

  function makePopupMovable(popupDiv) {
    // You can implement drag-and-drop functionality for the popup here
  }

  function openPopup(users) {
    var popupHtml = `
    <style>
      /* Styles here */
    </style>
    <div class="popup">
      <div class="container" id="container">
        <div class="button-container">
          <select id="userSelect">`;

    users.forEach(user => {
      popupHtml += '<option value="' + user.name + '">' + user.name + '</option>';
    });

    popupHtml += `
          </select>
          <div id="roles"></div>
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
    popupDiv.style.backgroundColor = 'white';
    document.body.appendChild(popupDiv);

    makePopupMovable(popupDiv);

    document.getElementById('userSelect').onchange = function() {
      var userName = this.value;
      var roles = users.find(user => user.name === userName).roles;
      document.getElementById('roles').innerHTML = roles.join(', ');
    };
  }

  fetchUsersAndRoles(function(users) {
    openPopup(users);
  });
})();
