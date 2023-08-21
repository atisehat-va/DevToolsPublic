javascript: (function() {
  function fetchUsers(callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,fullname').then(callback);
  }
  
  function fetchRolesForUser(userId, callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuserroles', '?$filter=systemuserid eq ' + userId).then(callback);
  }

  function displayPopup(users) {
    var popupHtml = `
    <!-- Add your specific styles and HTML structure here as in the example you provided -->
    <select id="userSelect">`;
    users.entities.forEach(user => {
      popupHtml += `<option value="${user.systemuserid}">${user.fullname}</option>`;
    });
    popupHtml += `</select><div id="roles"></div>`;
    
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
