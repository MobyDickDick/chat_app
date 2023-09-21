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

let users = [];
let myId = "";
let userName = "";

socket.addEventListener("open", async (event) => {
  console.log("WebSocket connected!");
  // TODO: create message object to transmit the user to the backend
});

socket.addEventListener("message", (event) => {
  const messageObject = JSON.parse(event.data);
  console.log("Received message from server: " + messageObject.type);
  console.log("Received message data from server: " + messageObject.data);
  switch (messageObject.type) {
    case "yourId":

      myId = messageObject.data;
      console.log("myId =" + myId);
      break;

    case "users":

      console.log("Here come the userNames...");
      users = JSON.parse(messageObject.data);
      showUsers(users);
      break;

    case "message":

      // TODO: Show new message as DOM element append to chat history
      showMessage(messageObject.data);

      break;

    default:
      console.error("Unknown message type: " + messageObject.type);
  }
});

async function showUsers(users) {

  if (users && (users.length > 0)) {

    let usersString = "";

    for (userName of users) {

      console.log("der nächste Username ist: " + userName);
      usersString += "<div>" + userName + "</div>";

    }

    let anchor = document.getElementById("anchor-contact-list");
    console.dir(anchor);
    if (anchor == null) {
      window.addEventListener("load", (event) => {
        let anchor = document.getElementById("anchor-contact-list");
        console.log("Die Benutzerliste wird erstellt =" + usersString);
        anchor.innerHTML = usersString;
      });
    } else {
      anchor.innerHTML = usersString;
    }
  }
}

function showMessage(message) {
  // TODO: Show new message as DOM element append to chat history

  let currentdate = new Date();
  let datetime = currentdate.getDay() + "." + currentdate.getMonth() 
    + "." + currentdate.getFullYear() + " " 
    + currentdate.getHours() + ":" 
    + currentdate.getMinutes() + ":" + currentdate.getSeconds();
  
  let chatMessageString = `
    <div class="chat-bubble">
    <div>${datetime}</div> 
    <div>${userName}</div>
    <div> ${message.message} </div> 
    </div>`;

    
  let informationMessagesString = `
  <div class="chat-bubble">
  <div>${datetime}</div> 
  <div>${userName}</div>
  <div> ${message.message} </div> 
  </div>`;

  writChatOrInformation("chatPart", chatMessageString);
  writChatOrInformation("informationPart", informationMessagesString);

}

socket.addEventListener("close", (event) => {
  console.log("WebSocket closed.");
});

socket.addEventListener("error", (event) => {
  console.error("WebSocket error:", event);
});

async function writChatOrInformation(placeToInsert, messageString) {

  let convertedHTMLString = stringToHTML(messageString);
  
  let anchor = document.getElementById(placeToInsert);
  console.dir(anchor);
  if (anchor == null) {
    window.addEventListener("load", (event) => {
      let anchor = document.getElementById(placeToInsert);
      anchor.insertAdjacentElement('beforeend', convertedHTMLString.childNodes[0]); 
    });
  } else {
    anchor.insertAdjacentElement('beforeend', convertedHTMLString.childNodes[0]); 
  }
}

function changeUserName() {
  // TODO: Implement change userName and forward new userName to backend

  let newUserName = document.getElementById('new-user-name').value;

  let found = undefined;

  console.dir(users);

  if (users.length > 0) {

    found = users.find((element) => (element === newUserName));
    console.log("found = " + found);

    if (!found) {

      executeChangeUserName(newUserName);

    } else {

      console.log("No new user entered.");
      alert('Benutzername ${newUserName} existiert schon! Wähle einen anderen Namen.');

    }
  } else {

    executeChangeUserName(newUserName);

  }
}

function executeChangeUserName(newUserName) {

  const messageObject = {
    type: 'user',
    data: newUserName
  };

  socket.send(JSON.stringify(messageObject));
  const newHeaderTitle = document.getElementById('chatters-name');
  console.log(newUserName + ", Dein Chat ist hier!");
  newHeaderTitle.innerText = newUserName + ", Dein Chat ist hier!";
  let newUserInputTextField = document.getElementById('new-user-name');
  newUserInputTextField.value = "";
  newUserInputTextField.setAttribute("placeholder", "   gebe Deinen neuen Namen ein");
  let enterNewUserNameButton = document.getElementById("enter-user-id");
  enterNewUserNameButton.innerText = "ändere Namen";
  enterNewUserNameButton.disabled = true;
  let messageTextField = document.getElementById("written-message");
  messageTextField.disabled = false;
  messageTextField.setAttribute("placeholder", "   schreibe eine Nachricht")
  let enterTextField = document.getElementById("write-message");
  enterTextField.setAttribute("style", "background-color: #FFFFFF");

  userName = newUserName;

}

function sendMessage() {

  const messageValue = document.getElementById('written-message').value;
  const messageObject = {
    type: 'message',
    data: {
      message: messageValue,
      userName: userName
    }
  };

  socket.send(JSON.stringify(messageObject));

  let messageTextField = document.getElementById("written-message");
  messageTextField.value = "";


}

checkEnableEnterUserId = (event) => {

  let enterNewUserNameButton = document.getElementById("enter-user-id");
  let newUserInputTextField = document.getElementById("new-user-name")
  enterNewUserNameButton.disabled = (newUserInputTextField.value === "") ? true : false;

}

checkEnableEnterMessage = (event) => {

  let enterNewMesageInputTextFile = document.getElementById("written-message");
  let newUserInputButton = document.getElementById("enter-message")
  newUserInputButton.disabled = (enterNewMesageInputTextFile.value === "") ? true : false;

}

var stringToHTML = function (str) {
	var parser = new DOMParser();
	var doc = parser.parseFromString(str, 'text/html');
  console.dir(doc.body);
	return doc;
};