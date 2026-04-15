const mongoose = require('mongoose');

let mainConnection = null;
const userConnections = new Map();

async function connectMain(uri) {
  if (mainConnection) return mainConnection;
  mainConnection = await mongoose.createConnection(uri, {
    maxPoolSize: 10
  }).asPromise();
  return mainConnection;
}

function userDbNameFor(userid) {
  return `user_${userid}_db`;
}

function baseServerUri(mongoUri) {
  // Remove trailing database segment if present (mongodb://host:port/dbname -> mongodb://host:port)
  // Keep query params out for simplicity in this project
  const idx = mongoUri.lastIndexOf('/');
  if (idx === -1) return mongoUri;
  const after = mongoUri.substring(idx + 1);
  // If after contains '?' it's likely options; do not chop in that case
  if (after.includes('?')) return mongoUri;
  // Heuristic: if there is a dbname after '/', strip it
  return mongoUri.substring(0, idx);
}

async function getUserConnection(baseUri, userid) {
  const dbName = userDbNameFor(userid);
  if (userConnections.has(dbName)) return userConnections.get(dbName);
  const serverUri = baseServerUri(baseUri).replace(/\/$/, '');
  const uri = `${serverUri}/${dbName}`;
  const conn = await mongoose.createConnection(uri, {
    maxPoolSize: 5
  }).asPromise();
  userConnections.set(dbName, conn);
  return conn;
}

module.exports = { connectMain, getUserConnection, userDbNameFor };
