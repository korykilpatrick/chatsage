/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Archive (soft-delete) a channel
* Sets archived=TRUE instead of physical removal.
*
* channelId Integer 
* no response value expected for this operation
* */
const channelsChannelIdDELETE = ({ channelId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        channelId,
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
* Get channel details (includes archived if it exists)
*
* channelId Integer 
* returns Channel
* */
const channelsChannelIdGET = ({ channelId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        channelId,
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
* Remove a member from the channel
*
* channelId Integer 
* userId Integer 
* no response value expected for this operation
* */
const channelsChannelIdMembersDELETE = ({ channelId, userId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        channelId,
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
* Add a member to the channel
*
* channelId Integer 
* channelsChannelIdMembersPostRequest ChannelsChannelIdMembersPostRequest 
* no response value expected for this operation
* */
const channelsChannelIdMembersPOST = ({ channelId, channelsChannelIdMembersPostRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        channelId,
        channelsChannelIdMembersPostRequest,
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
* Update channel details
*
* channelId Integer 
* channelUpdateRequest ChannelUpdateRequest 
* returns Channel
* */
const channelsChannelIdPUT = ({ channelId, channelUpdateRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        channelId,
        channelUpdateRequest,
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
* Global: list all channels (admin only)
*
* includeArchived Boolean  (optional)
* returns List
* */
const channelsGET = ({ includeArchived }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        includeArchived,
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
* Global: create a channel
*
* channelCreateRequest ChannelCreateRequest 
* returns Channel
* */
const channelsPOST = ({ channelCreateRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        channelCreateRequest,
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
* List channels in a workspace
*
* workspaceId Integer 
* includeArchived Boolean  (optional)
* returns List
* */
const workspacesWorkspaceIdChannelsGET = ({ workspaceId, includeArchived }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        workspaceId,
        includeArchived,
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
  channelsChannelIdDELETE,
  channelsChannelIdGET,
  channelsChannelIdMembersDELETE,
  channelsChannelIdMembersPOST,
  channelsChannelIdPUT,
  channelsGET,
  channelsPOST,
  workspacesWorkspaceIdChannelsGET,
};
