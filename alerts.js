javascript: (function() {
  const CSS = `
    .popup { background-color: white; border: 2px solid #444; border-radius: 10px; width: 900px; height: 600px; overflow: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5); }
    .section { padding: 20px; border-right: 1px solid #ccc; overflow-y: scroll; }
    .section h3 { text-align: center; margin-bottom: 10px; }
    #section1 { text-align: center; height: 250px; }
    #section1 input { margin-bottom: 10px; width: 230px; }
    #section1 #userList { margin-bottom: 15px; max-height: 150px; overflow-y: scroll; scrollbar-width: none; -ms-overflow-style: none; }
    #section1 #userList::-webkit-scrollbar { display: none; }
    #section2, #section3, #section4 { display: inline-block; width: 33%; height: 250px; vertical-align: top; box-sizing: border-box; text-align: left; }
    .selected { background-color: #f0f0f0; }
    .user { cursor: pointer; padding: 3px; font-size: 14px; }
    #sectionsRow { white-space: nowrap; }
  `;

  const POPUP_HTML = `
    <div class="popup">
      <style>${CSS}</style>
      <div class="section" id="section1">
        <h3>Section 1</h3>
        <input type="text" id="searchInput" placeholder="Search Users">
        <div id="userList"></div>
      </div>
      <div id="sectionsRow">
        <div class="section" id="section2"><h3>Section 2</h3><ul></ul></div>
        <div class="section" id="section3"><h3>Section 3</h3><ul></ul></div>
        <div class="section" id="section4"><h3>Section 4</h3><ul></ul></div>
      </div>
    </div>
  `;

  function fetchRecords(entity, query, callback) {
    return Xrm.WebApi.retrieveMultipleRecords(entity, query).then(callback);
  }

  function appendListItem(element, textContent) {
    const listItem = document.createElement('li');
    listItem.textContent = textContent;
    element.appendChild(listItem);
  }

  function clearElement(element) {
    element.innerHTML = '';
  }

  function createAndAppendPopup() {
    const popupDiv = document.createElement('div');
    popupDiv.id = 'bookmarkletPopup';
    popupDiv.innerHTML = POPUP_HTML;
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

    const businessUnitList = document.getElementById('section2').querySelector('ul');
    clearElement(businessUnitList);
    appendListItem(businessUnitList, user._businessunitid_value);

    fetchRecords('systemuserroles', `?$filter=systemuserid eq ${user.systemuserid}`, function(roles) {
      const rolesList = document.getElementById('section4').querySelector('ul');
      clearElement(rolesList);
      roles.entities.forEach(role => {
        Xrm.WebApi.retrieveRecord("role", role['roleid'], "?$select=name,roleid").then(function(roleDetail) {
          appendListItem(rolesList, roleDetail.name);
        });
      });
    });

    fetchRecords('systemuser', `?$select=fullname&$expand=teammembership_association($select=name)&$filter=systemuserid eq ${user.systemuserid}`, function(response) {
      const teamsList = document.getElementById('section3').querySelector('ul');
      clearElement(teamsList);
      response.entities[0].teammembership_association.forEach(team => {
        appendListItem(teamsList, team.name);
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

  fetchRecords('systemuser', '?$select=systemuserid,fullname,_businessunitid_value&$filter=(isdisabled eq false)', function(users) {
    displayPopup(users);
  });
})();
// code reviewed
