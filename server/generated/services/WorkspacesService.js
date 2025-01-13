/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* List all workspaces
*
* returns List
* */
const workspacesGET = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Soft-delete (archive) a workspace
* Sets archived=TRUE instead of physical removal.
*
* workspaceId Integer 
* no response value expected for this operation
* */
const workspacesWorkspaceIdDELETE = ({ workspaceId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        workspaceId,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Get workspace details
*
* workspaceId Integer 
* returns Workspace
* */
const workspacesWorkspaceIdGET = ({ workspaceId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        workspaceId,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Remove a user from a workspace
*
* workspaceId Integer 
* userId Integer 
* no response value expected for this operation
* */
const workspacesWorkspaceIdMembersDELETE = ({ workspaceId, userId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        workspaceId,
        userId,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Add a user to a workspace
*
* workspaceId Integer 
* workspacesWorkspaceIdMembersPostRequest WorkspacesWorkspaceIdMembersPostRequest Associates a user with the workspace.
* no response value expected for this operation
* */
const workspacesWorkspaceIdMembersPOST = ({ workspaceId, workspacesWorkspaceIdMembersPostRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        workspaceId,
        workspacesWorkspaceIdMembersPostRequest,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Update a workspace
*
* workspaceId Integer 
* workspaceUpdateRequest WorkspaceUpdateRequest 
* returns Workspace
* */
const workspacesWorkspaceIdPUT = ({ workspaceId, workspaceUpdateRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        workspaceId,
        workspaceUpdateRequest,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);

module.exports = {
  workspacesGET,
  workspacesWorkspaceIdDELETE,
  workspacesWorkspaceIdGET,
  workspacesWorkspaceIdMembersDELETE,
  workspacesWorkspaceIdMembersPOST,
  workspacesWorkspaceIdPUT,
};
