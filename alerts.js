<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Security Roles</title>
</head>
<body onload="populateUsersDropdown()">
    <h1>Select a User</h1>
    <button onclick="populateUsersDropdown();">Load Users</button>
    <select id="usersDropdown" onchange="showSecurityRoles(this.value)">
        <option value="">Select a User</option>
    </select>
    <div id="securityRolesDisplay"></div>

    <button onclick="showDirtyFields();">Show Modified Fields</button>

    <script>
        function populateUsersDropdown() {
            // Query users from Dynamics 365
            Xrm.WebApi.retrieveMultipleRecords("SystemUser").then(function(users) {
                var select = document.getElementById("usersDropdown");
                select.innerHTML = '<option value="">Select a User</option>'; // Clear existing options
                users.entities.forEach(function(user) {
                    var option = document.createElement("option");
                    option.value = user.systemuserid;
                    option.text = user.fullname;
                    select.add(option);
                });
            });
        }

        function showSecurityRoles(userId) {
            if (!userId) {
                // Handle empty selection
                return;
            }

            // Query the security roles for the selected user
            var query = "/SystemUsers(" + userId + ")/systemuserroles_association?$select=name";
            Xrm.WebApi.retrieveMultipleRecords("Role", query).then(function(roles) {
                var html = '<h2>User Security Roles</h2>';
                roles.entities.forEach(function(role) {
                    html += '<div>' + role.name + '</div>';
                });

                // Display the HTML content
                document.getElementById("securityRolesDisplay").innerHTML = html;
            });
        }        
    </script>
</body>
</html>
//------------------

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

      // Wait for all promises to resolve
      Promise.all(promises).then(function() {
        callback(userRoles);
      });
    });
  }

  function displayPopup(users) {
    var html = '<select id="userSelect">';
    users.forEach(user => {
      html += '<option value="' + user.name + '">' + user.name + '</option>';
    });
    html += '</select><div id="roles"></div>';

    var popup = window.open('', 'popup', 'width=300,height=200');
    popup.document.write(html);
    popup.document.close(); // Close the document to allow further manipulation

    popup.document.getElementById('userSelect').onchange = function() {
      var userName = this.value;
      var roles = users.find(user => user.name === userName).roles;
      popup.document.getElementById('roles').innerHTML = roles.join(', ');
    };
  }

  fetchUsersAndRoles(function(users) {
    displayPopup(users);
  });
})();

