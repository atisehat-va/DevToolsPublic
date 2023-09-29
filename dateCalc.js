function dateCalc() {
    var newContainer = document.createElement('div');
    newContainer.className = 'commonPopup';
    newContainer.style.display = 'flex';
    newContainer.style.flexDirection = 'column';
    newContainer.innerHTML = `
         <div class="commonPopup-header">Copy User Security</div>
	    		  <button class="commonback-button" id="commonback-button">Back</button>		  
			  <div class="securityPopup-row">
			    <div class="commonSection user-section" id="section1">
			      <h3>FROM</h3>
			      <input type="text" id="searchInput1" placeholder="Search Users">
			      <div class="user-list-container">
			        <div id="userList1"></div>
			      </div>
			    </div>
			    <div class="commonSection user-section" id="section2">
			      <h3>TO</h3>
			      <input type="text" id="searchInput2" placeholder="Search Users">
			      <div class="user-list-container">
			        <div id="userList2"></div>
			      </div>
			    </div>
			  </div>
			  <div id="sectionsRow1" class="securityPopup-row">
			    <div class="commonSection details-section-row" id="section3">
			      <h3>Business Unit & Teams</h3>
			      <div class="roles-and-teams-list-row">
			        <ul></ul>
			      </div>
			    </div>
			    <div class="commonSection details-section-row" id="section5">
			      <h3>Business Unit & Teams</h3>
			      <div class="roles-and-teams-list-row">
			        <ul></ul>
			      </div>
			    </div>
			  </div>
			  <div id="sectionsRow2" class="securityPopup-row">
			    <div class="commonSection details-section-row" id="section4">
			      <h3>Security Roles</h3>
			      <div class="roles-and-teams-list-row">
			        <ul></ul>
			      </div>
			    </div>
			    <div class="commonSection details-section-row" id="section6">
			      <h3>Security Roles</h3>
			      <div class="roles-and-teams-list-row">
			        <ul></ul>
			      </div>
			    </div>
			  </div>
			  <div class="submit-button-container">
			    <button id="submitButton">Submit</button>
			  </div>
		    `;	
    document.body.appendChild(newContainer);
    document.getElementById('commonback-button').addEventListener('click', function() {
        newContainer.remove();
        openPopup();  
    });
    makePopupMovable(newContainer);
}
