const WebSocket = require("ws");
const redis = require("redis");
let redisClient;

let clients = [];
let messageHistory = [];
const users = new Map();

// Initiate the websocket server
const initializeWebsocketServer = async (server) => {
  redisClient = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || "6379",
    },
  });
  await redisClient.connect();

  const websocketServer = new WebSocket.Server({ server });
  websocketServer.on("connection", onConnection);
  websocketServer.on("error", console.error);
};

// If a new connection is established, the onConnection function is called
const onConnection = (ws, req) => {
  console.log("New websocket connection");

  console.log("the searched key is: " + req.headers['sec-websocket-key']);

  ws.on("close", () => onClose(ws));
  ws.on("message", (message) => onClientMessage(ws, message));
  // TODO: Send all connected users and current message history to the new client
  ws.send(JSON.stringify({ type: "ping", data: "FROM SERVER" }));
  clients.push(ws);
};

// If a new message is received, the onClientMessage function is called
const onClientMessage = async (ws, message) => {
  const messageObject = JSON.parse(message);
  console.log("I have received a message from client with type: " + messageObject.type);
  switch (messageObject.type) {
    case "pong":
      console.log("Received from client: " + messageObject.data);
      break;
    case "user":
      // TODO: Publish all connected users to all connected clients
      console.log("new userName entered: " + message);
      publishNewUser(messageObject);
      break;
    case "message":
      console.log("The message was: " + messageObject.data);
      renderMessage(messageObject);
      break;
    default:
      console.error("Unknown message type: " + messageObject.type);
  }
};

// If a connection is closed, the onClose function is called
const onClose = async (ws) => {
  console.log("Websocket connection closed");
  // TODO: Remove related user from connected users and propagate new list
  
  
};

const getMessageHistory = async () => {
  return await redisClient.get("messageHistory");
};

const setMessageHistory = async (messageHistory) => {
  await redisClient.set("messageHistory", messageHistory);
};


const renderMessage = async (messageObject) => {
  // TODO: Publish new message to all connected clients and save in redis
  console.log("Here we are!");

  /* Save the message in the message history. */
  messageHistory.push(messageObject);
  await setMessageHistory(JSON.stringify(messageHistory));

  /* Redistribute the message. */
  for (const client of clients) {
    client.send(JSON.stringify(messageObject));
  }
}


function publishNewUser(messageObject){

  console.log("messageObject.data.userName = " + messageObject.data.userName);

  if(messageObject.data.userName != undefined){

    users.set(messageObject.data.userId, messageObject.data.userName); 
    console.log("meine users sind (als Map):" + JSON.stringify(Object.fromEntries(users)));
    let userNamesArray = Array.from(users.values());
    console.log("meine users sind:" + JSON.stringify(userNamesArray));

    let newUsersObject = {
      type: "users",
      data:  JSON.stringify(userNamesArray)}

    for (let client of clients) {
      client.send(JSON.stringify(newUsersObject));
    }  
  }
}

module.exports = { initializeWebsocketServer };