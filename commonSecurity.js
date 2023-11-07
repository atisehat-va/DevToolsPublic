window.updateUserDetails = async function(selectedUserId, selectedBusinessUnitId, selectedTeamIds, selectedRoleIds, actionType) {
  const clientUrl = Xrm.Utility.getGlobalContext().getClientUrl();

  try {
    switch (actionType) {
      case 'Change BUTR':
        await changeBusinessUnit(selectedUserId, selectedBusinessUnitId);
        await disassociateUserFromTeams(selectedUserId, clientUrl);
        await disassociateUserFromRoles(selectedUserId, clientUrl);    
    
        for (const roleId of selectedRoleIds) {
          await associateUserToRole(selectedUserId, roleId, clientUrl);
        }
        
        for (const teamId of selectedTeamIds) {
          await associateUserToTeam(selectedUserId, teamId, clientUrl);
        } 
        break;

      case 'ChangeBU':
        await changeBusinessUnit(selectedUserId, selectedBusinessUnitId);
        break;
      /*
      case 'AddTeams':
        for (const teamId of selectedTeamIds) {
          await associateUserToTeam(selectedUserId, teamId, clientUrl);
        }
        break;
      */      
      case 'AddTeams':
        for (const teamId of selectedTeamIds) {
          try {
            await associateUserToTeam(selectedUserId, teamId, clientUrl);
          } catch (error) {
            showCustomAlert(error.message);
            throw error; // Rethrow the error to stop further execution
          }
        }
        break; 
        
      case 'RemoveAllTeams':
        await disassociateUserFromTeams(selectedUserId, clientUrl);
        break;
        
      case 'RemoveTeams':
        await disassociateUserFromSpecificTeams(selectedUserId, selectedTeamIds, clientUrl);
        break;

      case 'RemoveAllRoles':
        await disassociateUserFromRoles(selectedUserId, clientUrl);
        break;

      case 'AddRoles':
        for (const roleId of selectedRoleIds) {
          await associateUserToRole(selectedUserId, roleId, clientUrl);
        }
        break;

      case 'RemoveRoles':
        await disassociateUserFromSpecificRoles(selectedUserId, selectedRoleIds, clientUrl);
        break;

      default:
        console.error(`Invalid actionType: ${actionType}`);
        break;
    }
  } catch (error) {    
    throw error;
  }
}

async function changeBusinessUnit(selectedUserId, selectedBusinessUnitId) {
  const data1 = {
    "businessunitid@odata.bind": `/businessunits(${selectedBusinessUnitId})`
  };
  return Xrm.WebApi.updateRecord("systemuser", selectedUserId, data1);
}

async function disassociateUserFromRoles(selectedUserId, clientUrl) {
  const rolesUrl = `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})/systemuserroles_association`;
  const response = await fetch(rolesUrl, {
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json" }
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  const results = await response.json();
    
  await Promise.all(results.value.map(async (result) => {
    const disassociateUrl = `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})/systemuserroles_association/$ref?$id=${clientUrl}/api/data/v9.2/roles(${result.roleid})`;
    await fetch(disassociateUrl, { method: "DELETE" });
  }));
}
//NewCode
// Disassociate user from specific roles
async function disassociateUserFromSpecificRoles(selectedUserId, selectedRoleIds, clientUrl) {
  await Promise.all(selectedRoleIds.map(async (roleId) => {
    const disassociateUrl = `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})/systemuserroles_association/$ref?$id=${clientUrl}/api/data/v9.2/roles(${roleId})`;
    await fetch(disassociateUrl, { method: "DELETE" });
  }));
}

// Disassociate user from specific teams
async function disassociateUserFromSpecificTeams(selectedUserId, selectedTeamIds, clientUrl) {
  await Promise.all(selectedTeamIds.map(async (teamId) => {
    const disassociateUrl = `${clientUrl}/api/data/v9.2/teams(${teamId})/teammembership_association/$ref?$id=${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})`;
    await fetch(disassociateUrl, { method: "DELETE" });
  }));
}
//EndNewCode

async function disassociateUserFromTeams(selectedUserId, clientUrl) {
  const teamsUrl = `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})/teammembership_association`;
  const response = await fetch(teamsUrl, {
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json" }
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  const results = await response.json();
  
  await Promise.all(results.value.map(async (result) => {
    const disassociateUrl = `${clientUrl}/api/data/v9.2/teams(${result.teamid})/teammembership_association/$ref?$id=${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})`;
    await fetch(disassociateUrl, { method: "DELETE" });
  }));
}
/*
async function associateUserToTeam(selectedUserId, selectedTeamIds, clientUrl) {
  const associateTeamUrl = `${clientUrl}/api/data/v9.2/teams(${selectedTeamIds})/teammembership_association/$ref`;
  const associateTeamData = {
    "@odata.id": `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})`
  };
  await fetch(associateTeamUrl, {
    method: "POST",
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json", "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(associateTeamData)
  });
} */

//newCode
async function associateUserToTeam(selectedUserId, selectedTeamIds, clientUrl) {
  // Get details of the team to check the team type
  const teamDetailsUrl = `${clientUrl}/api/data/v9.2/teams(${selectedTeamIds})?$select=teamtype`;
  try {
    const teamDetailsResponse = await fetch(teamDetailsUrl, {
      method: "GET",
      headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json", "Content-Type": "application/json; charset=utf-8" }
    });
    const teamDetails = await teamDetailsResponse.json();

    // Assuming teamDetails is an array and teamtype is a property of the team object:
    const teamType = teamDetails.value && teamDetails.value[0] && teamDetails.value[0].teamtype;

    // Check if the team type is either "Owner" (0) or "Access" (1)
    if (teamType !== 0 && teamType !== 1) {
      throw new Error("You are not allowed to Associate a Team with Type other than Owner/Access.");
    }

    // If the team type is valid, proceed with the association
    const associateTeamUrl = `${clientUrl}/api/data/v9.2/teams(${selectedTeamIds})/teammembership_association/$ref`;
    const associateTeamData = {
      "@odata.id": `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})`
    };
    const response = await fetch(associateTeamUrl, {
      method: "POST",
      headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json", "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(associateTeamData)
    });

    if (!response.ok) {
      // If the HTTP response status code is not successful, throw an error
      throw new Error(`Failed to associate user to team. Status: ${response.status}`);
    }

  } catch (error) {    
    throw error; // Rethrow the error so it can be caught by the calling function
  }
}
//EndNewCode

/*
async function associateUserToRole(selectedUserId, selectedRoleIds, clientUrl) {
  const associateRoleUrl = `${clientUrl}/api/data/v9.2/roles(${selectedRoleIds})/systemuserroles_association/$ref`;
  const associateRoleData = {
    "@odata.id": `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})`
  };
  await fetch(associateRoleUrl, {
    method: "POST",
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json", "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(associateRoleData)
  });
}*/

//Test 10/16/2023
async function associateUserToRole(selectedUserId, selectedRoleIds, clientUrl) {
  if (!selectedUserId || !selectedRoleIds || !clientUrl) {
    console.error("Invalid parameters.");
    return;
  }

  const associateRoleUrl = `${clientUrl}/api/data/v9.2/roles(${selectedRoleIds})/systemuserroles_association/$ref?`;
  const associateRoleData = {
    "@odata.id": `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})`
  };
  
  console.log(`Associating role using URL: ${associateRoleUrl}`);
  console.log(`Associate Role Data: ${JSON.stringify(associateRoleData)}`);

  try {
    const response = await fetch(associateRoleUrl, {
      method: "POST",
      headers: { 
        "OData-MaxVersion": "4.0", 
        "OData-Version": "4.0", 
        "Accept": "application/json", 
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(associateRoleData)
    });
    
    if (!response.ok) {
      const responseData = await response.json();
      console.error('Server returned:', responseData);
    } else {
      console.log('Successfully associated role to user.');
    }
    
  } catch (error) {
    console.error('Fetch failed:', error);
  }
}
