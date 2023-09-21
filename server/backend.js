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


  ws.on("close", () => onClose(ws));
  ws.on("message", (message) => onClientMessage(ws, message));
  // TODO: Send all connected users and current message history to the new client
  ws.send(JSON.stringify({ type: "yourId", data: ws.id }));
  let clientEntry = {
    ws: ws,
    userName: ""
  }
  clients.set(ws.id, clientEntry);

  let userList = getUsers();


  if(userList){
    ws.send(JSON.stringify(userList));
  }

  getMessageHistory().then(
    messageHistory =>{
      if(messageHistory){
        let parsedMessageHistory = JSON.parse(messageHistory);
        parsedMessageHistory.forEach(message =>{
          ws.send(JSON.stringify(message));
        });
      }
    }
  )
};

// If a new message is received, the onClientMessage function is called
const onClientMessage = async (ws, message) => {
  const messageObject = JSON.parse(message);
  switch (messageObject.type) {
    case "pong":
      break;
    case "user":
      // TODO: Publish all connected users to all connected clients
      publishNewUser(ws, messageObject);
      break;
    case "message":
      renderMessage(messageObject);
      break;
    default:
      console.error("Unknown message type: " + messageObject.type);
  }
};

// If a connection is closed, the onClose function is called
const onClose = async (ws) => {
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

  /* Save the message in the message history. */
  await getMessageHistory().then(
    getMessages => {
      messageHistory = JSON.parse(getMessages);
    })

  messageHistory.push(messageObject);
  await setMessageHistory(JSON.stringify(messageHistory));

  clients.forEach(client => {
    client.ws.send(JSON.stringify(messageObject));
  });
}


function publishNewUser(ws, messageObject) {

  if (messageObject.data != undefined) {

    clientToUpdate = clients.get(ws.id);
    if(clientToUpdate.userName != messageObject.data){
      changeMessages(clientToUpdate.userName, messageObject.data);
    }
    clientToUpdate.userName = messageObject.data;
    clients.set(ws.id, clientToUpdate);
    publishNewUserNames();

  }
}

const changeMessages = async function (oldUserName, newUserName){

 
   /* Save the message in the message history. */
   await getMessageHistory().then(
    getMessages => {
      messageHistory = JSON.parse(getMessages);
    })

  let changedMessageHistory = [];
  messageHistory.forEach(message =>{

    if(message.data.userName === oldUserName){
      message.data.userName = newUserName;
    }
    changedMessageHistory.push(message);
  });
   
  await setMessageHistory(JSON.stringify(changedMessageHistory));

  const clearChatMessage = {
    type: 'clearChat',
    data: ""};

  clients.forEach(client => {
    client.ws.send(JSON.stringify(clearChatMessage));
    changedMessageHistory.forEach(message =>{
      client.ws.send(JSON.stringify(message));
    })
  });
}

const getUserNameArray = (clients) => {

  arrayToReturn = [];
  clients.forEach(client => {
    if(client.userName != ""){
      arrayToReturn.push(client.userName)
    }
  });


  return arrayToReturn;
};

module.exports = { initializeWebsocketServer };

function publishNewUserNames() {

  let userNames = getUsers();

  if(userNames){
    clients.forEach(client => {
      client.ws.send(JSON.stringify(userNames));
    });  
  }
}

function getUsers() {

  let userNamesArray = getUserNameArray(clients);

  if(userNamesArray.length >0){

    let newUsersObject = {
      type: "users",
      data: JSON.stringify(userNamesArray)
    };
    
    return newUsersObject;
  
  }else{

    return null;

  }
}
