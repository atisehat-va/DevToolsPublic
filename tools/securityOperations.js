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

      case 'AddTeams':
        for (const teamId of selectedTeamIds) {
          await associateUserToTeam(selectedUserId, teamId, clientUrl);
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
    console.error('An error occurred:', error);
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

// Disassociate user roles
async function disassociateUserFromSpecificRoles(selectedUserId, selectedRoleIds, clientUrl) {
  await Promise.all(selectedRoleIds.map(async (roleId) => {
    const disassociateUrl = `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})/systemuserroles_association/$ref?$id=${clientUrl}/api/data/v9.2/roles(${roleId})`;
    await fetch(disassociateUrl, { method: "DELETE" });
  }));
}

// Disassociate user teams
async function disassociateUserFromSpecificTeams(selectedUserId, selectedTeamIds, clientUrl) {
  await Promise.all(selectedTeamIds.map(async (teamId) => {
    const disassociateUrl = `${clientUrl}/api/data/v9.2/teams(${teamId})/teammembership_association/$ref?$id=${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})`;
    await fetch(disassociateUrl, { method: "DELETE" });
  }));
}

async function disassociateUserFromTeams(selectedUserId, clientUrl) {  
  const teamsUrl = `${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})/teammembership_association?$filter=teamtype eq 0 or teamtype eq 1`;
  const response = await fetch(teamsUrl, {
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json" }
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }
  const results = await response.json();
  await Promise.all(results.value.map(async (result) => {    
    if (result.teamtype === 0 || result.teamtype === 1) {
      const disassociateUrl = `${clientUrl}/api/data/v9.2/teams(${result.teamid})/teammembership_association/$ref?$id=${clientUrl}/api/data/v9.2/systemusers(${selectedUserId})`;
      await fetch(disassociateUrl, { method: "DELETE" });
    }
  }));
}

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
} 

async function associateUserToRole(selectedUserId, selectedRoleIds) {
  if (!selectedUserId || !selectedRoleIds) {
    console.error("Invalid parameters.");
    return;
  }
  // Check if not array
  if (!Array.isArray(selectedRoleIds)) {
    selectedRoleIds = [selectedRoleIds];
  }
  // Association
  var associateRequest = {
    target: { entityType: "systemuser", id: selectedUserId }, 
    relatedEntities: selectedRoleIds.map(roleId => ({ entityType: "role", id: roleId })),
    relationship: "systemuserroles_association", 
    getMetadata: function () {
      return {
        boundParameter: null,
        parameterTypes: {},
        operationType: 2,
        operationName: "Associate"
      };
    }
  };
  try {
    const response = await Xrm.WebApi.online.execute(associateRequest);
    if (response.ok) {
            
    } else {
      console.error('Association failed:', response);
    }
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

