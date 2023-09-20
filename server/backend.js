const WebSocket = require("ws");
const redis = require("redis");
let redisClient;

let clients = new Map();
let messageHistory = [];

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

  ws.id = req.headers['sec-websocket-key'];

  console.log("ws.id = " + ws.id);

  ws.on("close", () => onClose(ws));
  ws.on("message", (message) => onClientMessage(ws, message));
  // TODO: Send all connected users and current message history to the new client
  ws.send(JSON.stringify({ type: "ping", data: "FROM SERVER" }));
  let clientEntry = {
    ws: ws,
    userName: ""
  }
  clients.set(ws.id, clientEntry);
};

// If a new message is received, the onClientMessage function is called
const onClientMessage = async (ws, message) => {
  console.log("Parcing the websocket");
  console.dir(ws.id);
  console.log("End parcing the websocket");
  const messageObject = JSON.parse(message);
  console.log("I have received a message from client with type: " + messageObject.type);
  switch (messageObject.type) {
    case "pong":
      console.log("Received from client: " + messageObject.data);
      break;
    case "user":
      // TODO: Publish all connected users to all connected clients
      console.log("new userName entered: " + message);
      publishNewUser(ws, messageObject);
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
  clients.delete(ws.id);
  publishNewUserNames();
  
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

  clients.forEach(client => {
    client.ws.send(JSON.stringify(messageObject));
  });
}


function publishNewUser(ws, messageObject) {

  console.dir(messageObject);
  console.log("messageObject.data = " + messageObject.data);

  if (messageObject.data != undefined) {

    clientToUpdate = clients.get(ws.id);
    clientToUpdate.userName = messageObject.data;
    clients.set(ws.id, clientToUpdate);

    publishNewUserNames();

  }
}


const getUnserNameArray = (clients) => {
  arrayToReturn = [];
  clients.forEach(client => {
    arrayToReturn.push(client.userName)
  });

  console.log("before Array to Return");
  console.dir(arrayToReturn);
  console.log("after Array to Return");

  return arrayToReturn;
};

module.exports = { initializeWebsocketServer };

function publishNewUserNames() {
  let userNamesArray = getUnserNameArray(clients);

  let newUsersObject = {
    type: "users",
    data: JSON.stringify(userNamesArray)
  };

  console.log("Die neuen Users sind: ");
  console.dir(newUsersObject);

  clients.forEach(client => {
    client.ws.send(JSON.stringify(newUsersObject));
  });
}