javascript: (function() {
  function fetchUsersAndRoles(callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=fullname').then(function(users) {
      var userRoles = [];
      var promises = [];

      users.entities.forEach(function(user) {
        var promise = Xrm.WebApi.retrieveMultipleRecords('systemuserroles', '?$filter=_systemuserid_value eq ' + user.systemuserid)
          .then(function(roles) {
            userRoles.push({ name: user.fullname, roles: roles.entities.map(role => role.name) });
          });

        promises.push(promise);
      });

      Promise.all(promises).then(function() {
        callback(userRoles);
      });
    });
  }

  function openPopup(users) {
    var popupHtml = `
      <style>
        /* ... same styles as your provided popup ... */
      </style>
      <div class="popup">
        <div class="button-container">
          <select id="userSelect">
    `;
    users.forEach(user => {
      popupHtml += '<option value="' + user.name + '">' + user.name + '</option>';
    });
    popupHtml += `
          </select>
          <div id="roles"></div>
          <button onclick="document.getElementById('bookmarkletPopup').remove();">Close</button>
        </div>
      </div>
    `;

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
