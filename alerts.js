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
  function fetchUsers() {
    Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,fullname').then(function(users) {
      users.entities.sort((a, b) => a.fullname.localeCompare(b.fullname)); // Sort users alphabetically
      users.entities.forEach(user => {
        var option = new Option(user.fullname, user.systemuserid);
        $('#userSelect').append(option);
      });
    });
  }

  function displayPopup() {
    var popupHtml = `
    <div class="popup">
      <select id="userSelect"></select>
      <ul id="roles"></ul>
    </div>`;
    var popupDiv = document.createElement('div');
    popupDiv.id = 'bookmarkletPopup';
    popupDiv.innerHTML = popupHtml;
    popupDiv.style.position = 'absolute';
    popupDiv.style.zIndex = '10000';
    popupDiv.style.left = '50%';
    popupDiv.style.top = '50%';
    popupDiv.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(popupDiv);
    $('#userSelect').select2();
  }

  displayPopup();
  fetchUsers();
})();

