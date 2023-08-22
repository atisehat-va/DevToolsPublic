javascript: (function() {
  const popupCss = `
    .popup { background-color: white; border: 2px solid #444; border-radius: 10px; width: 900px; height: 600px; overflow: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5); }
    .section { padding: 20px; border-right: 1px solid #ccc; text-align: left; overflow-y: scroll; }
    #section1 { text-align: center; height: 200px; }
    #section2, #section3, #section4 { display: inline-block; width: 33%; height: 300px; vertical-align: top; box-sizing: border-box; }
    #userList { max-height: 150px; overflow-y: scroll; }
    .selected { background-color: #f0f0f0; }
    .user { cursor: pointer; padding: 3px; font-size: 14px; }
    #sectionsRow { white-space: nowrap; }
  `;

  function fetchUsers(callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuser', '?$select=systemuserid,fullname&$filter=statuscode eq 1').then(callback);
  }

  function fetchRolesForUser(userId, callback) {
    Xrm.WebApi.retrieveMultipleRecords('systemuserroles', `?$filter=systemuserid eq ${userId}`).then(callback);
  }

  function createPopupHtml() {
    return `
      <div class="popup">
        <style>${popupCss}</style>
        <div class="section" id="section1">
          <h3>Section 1</h3><br>
          <input type="text" id="searchInput" placeholder="Search Users">
          <div id="userList"></div>
        </div>
        <div id="sectionsRow">
          <div class="section" id="section2"><h3>Section 2</h3></div>
          <div class="section" id="section3"><h3>Section 3</h3></div>
          <div class="section" id="section4"><h3>Section 4</h3><ul></ul></div>
        </div>
      </div>`;
  }

  function createAndAppendPopup() {
    const popupHtml = createPopupHtml();
    const popupDiv = document.createElement('div');
    popupDiv.id = 'bookmarkletPopup';
    popupDiv.innerHTML = popupHtml;
    popupDiv.style.position = 'absolute';
    popupDiv.style.zIndex = '10000';
    popupDiv.style.left = '50%';
    popupDiv.style.top = '50%';
    popupDiv.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(popupDiv);
    return popupDiv;
  }

  function renderUserList(users, selectUserCallback) {
    const userListDiv = document.getElementById('userList');
    users.forEach(user => {
      const userDiv = document.createElement('div');
      userDiv.className = 'user';
      userDiv.textContent = user.fullname;
      userDiv.dataset.id = user.systemuserid;
      userDiv.onclick = () => selectUserCallback(user);
      userListDiv.appendChild(userDiv);
    });
  }

  function selectUser(user) {
    document.querySelectorAll('.user').forEach(el => el.classList.remove('selected'));
    const userDiv = document.getElementById('userList').querySelector(`[data-id='${user.systemuserid}']`);
    userDiv.classList.add('selected');
    fetchRolesForUser(user.systemuserid, function(roles) {
      const rolesList = document.getElementById('section4').querySelector('ul');
      rolesList.innerHTML = '';
      roles.entities.forEach(role => {
        const roleId = role['roleid'];
        Xrm.WebApi.retrieveRecord("role", roleId, "?$select=name,roleid").then(function(roleDetail) {
          const listItem = document.createElement('li');
          listItem.textContent = roleDetail.name;
          rolesList.appendChild(listItem);
        });
      });
    });
  }

  function setupSearchFilter() {
    document.getElementById('searchInput').oninput = function() {
      const searchValue = this.value.toLowerCase();
      document.querySelectorAll('.user').forEach(el => {
        el.style.display = el.textContent.toLowerCase().includes(searchValue) ? 'block' : 'none';
      });
    };
  }

  function displayPopup(users) {
    users.entities.sort((a, b) => a.fullname.localeCompare(b.fullname));
    createAndAppendPopup();
    renderUserList(users.entities, selectUser);
    setupSearchFilter();
  }

  fetchUsers(function(users) {
    displayPopup(users);
  });
})();
