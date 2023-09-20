if (location.host.includes("localhost")) {
  // Load livereload script if we are on localhost
  document.write(
    '<script src="http://' +
      (location.host || "localhost").split(":")[0] +
      ':35729/livereload.js?snipver=1"></' +
      "script>"
  );  
}

const backendUrl = window.location.origin
  .replace(/^http/, "ws")
  .replace(/^https/, "wss");
const socket = new WebSocket(backendUrl);

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!! DON'T TOUCH ANYTHING ABOVE THIS LINE !!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

const users = [];

socket.addEventListener("open", async (event) => {
  console.log("WebSocket connected!");
  // TODO: create message object to transmit the user to the backend
});

socket.addEventListener("message", (event) => {
  const messageObject = JSON.parse(event.data);
  console.log("Received message from server: " + messageObject.type);
  console.log("Received message data from server: " + messageObject.data);
  switch (messageObject.type) {
    case "ping":
      socket.send(JSON.stringify({ type: "pong", data: "FROM CLIENT" }));
      break;
    case "users":
      console.log("Here come the userNames...");
      showUsers(messageObject.data);
      break;
    case "message":
      // TODO: Show new message as DOM element append to chat history
      break;
    default:
      console.error("Unknown message type: " + messageObject.type);
  }
});

function showUsers(users) {
  // TODO: Show the current users as DOM elements
  if(users!= null){
    
    users = JSON.parse(users);

    let usersString = "";

    for(userName of users) {

      console.log("der nächste Username ist: " + userName);

      usersString += "<div>" + userName + "<div>";
   
    }

    console.log("usersString =" + usersString);

    let anchor = document.getElementById("anchor-contact-list");
    anchor.innerHTML  = usersString;
  
  }
}

function showMessage(message) {
  // TODO: Show new message as DOM element append to chat history
}

socket.addEventListener("close", (event) => {
  console.log("WebSocket closed.");
});

socket.addEventListener("error", (event) => {
  console.error("WebSocket error:", event);
});

function changeUserName() {
  // TODO: Implement change userName and forward new userName to backend

  let newUserName =  document.getElementById('new-user-name').value;
  const messageObject  = {
    type: 'user', 
    data:  newUserName
  };
  console.log("The userName has changed:" + JSON.stringify(messageObject));  
  socket.send(JSON.stringify(messageObject));

  const newHeaderTitle =  document.getElementById('chatters-name');
  console.log(newUserName + ", Dein Chat ist hier!");
  newHeaderTitle.innerText = newUserName + ", Dein Chat ist hier!";
  document.getElementById('new-user-name').value = "";
  

}

function sendMessage() {

  const messageValue =  document.getElementById('written-message').value;
  const messageObject  = {
    type: 'message', 
    data:  messageValue
  };
  
  socket.send(JSON.stringify(messageObject));

}
