var head = document.head || document.getElementsByTagName('head')[0];

var select2script = document.createElement('script');
select2script.type = 'text/javascript';
select2script.src = 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/js/select2.min.js';
head.appendChild(select2script);

var select2style = document.createElement('link');
select2style.rel = 'stylesheet';
select2style.type = 'text/css';
select2style.href = 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/css/select2.min.css';
head.appendChild(select2style);
//-------
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
          .popup { display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: white; border: 1px solid #888; padding: 20px; width: 300px; }
          #userSelect { width: 100%; }
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

    document.getElementById('userSelect').onchange = function() {
      var userId = this.value;
      fetchRolesForUser(userId, function(roles) {
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
    };
  }

  fetchUsers(function(users) {
    displayPopup(users);
  });
})();

