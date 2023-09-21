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

    case "clearChat":

      // Clears the chat.
      clearWholeChat();

      break;

    default:
      console.error("Unknown message type: " + messageObject.type);
  }
});

async function showUsers(users) {

  if (users && (users.length > 0)) {

    let usersString = "";

    for (let receivedUserName of users) {

      usersString += "<div>" + receivedUserName + "</div><p>";

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

  let chatMessageString = "";

  chatMessageString += `
    <div class="chat-bubble grid-item">
    <div>${message.timeStamp}</div>`; 

  console.log("message.userName = " + message.userName);
  console.log("userName = " + userName);

  let gridItem = "";

  if (message.userName === userName) {
    
    chatMessageString += `
      <div> ${message.message} </div> 
      </div>`;

      gridItem += `
      <div class="grid-item"></div>
      <div class="grid-item">${chatMessageString}</div>`;
      

  } else {

    chatMessageString += `
      <div>${message.userName}</div>
      <div> ${message.message} </div> 
      </div>`;

    gridItem += `
      <div class="grid-item">${chatMessageString}</div>
      <div class="grid-item"></div>`;
     
  }

  console.log("message.userName = " + message.userName);
  console.log("userName = " + userName);
  console.log("myId = " + myId);
  console.log("gridItem = " + gridItem);

  writeChatEntry(gridItem);

}

socket.addEventListener("close", (event) => {
  console.log("WebSocket closed.");
});

socket.addEventListener("error", (event) => {
  console.error("WebSocket error:", event);
});

function gettimeStamp(datetime) {

  let currentdate = new Date();
  datetime = currentdate.getDay() + "." + currentdate.getMonth()
    + "." + currentdate.getFullYear() + " "
    + formatNumber(2, currentdate.getHours()) + ":"
    + formatNumber(2, currentdate.getMinutes()) + ":"
    + formatNumber(2, currentdate.getSeconds());

  return datetime;

}

async function writeChatEntry(messageString) {

  let convertedHTMLString = stringToHTML(messageString);
  console.log("The converted Element is:");
  console.dir(convertedHTMLString.childNodes);
  let anchor = document.getElementById("chatArea");
  console.dir(anchor);
  if (anchor == null) {
    window.addEventListener("load", (event) => {
      let anchor = document.getElementById("chatArea");
      convertedHTMLString.childNodes.forEach(childNode => {
        anchor.insertAdjacentElement('beforeend', childNode)
      });
    });
  } else {
    convertedHTMLString.childNodes.forEach(childNode => {
      anchor.insertAdjacentElement('beforeend', childNode)
    });
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
  console.log("Username chagned: " + userName)

}

function sendMessage() {

  let dateTime = gettimeStamp();
  console.log(dateTime = dateTime);

  const messageValue = document.getElementById('written-message').value;
  const messageObject = {
    type: 'message',
    data: {
      timeStamp: dateTime,
      userName: userName,
      message: messageValue
    }
  };

  socket.send(JSON.stringify(messageObject));

  let messageTextField = document.getElementById("written-message");
  messageTextField.value = "";

  let messageSendButton = document.getElementById("enter-message");
  messageSendButton.disabled = true;


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

const stringToHTML = function (str) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(str, 'text/html');
  return doc.body;
};

const formatNumber = function (numberOfDigits, numberToFormat) {

  let formattedNumber = numberToFormat.toLocaleString('de-CH', {
    minimumIntegerDigits: 2,
    useGrouping: false
  })

  return formattedNumber;
}

const clearWholeChat = function () {

  let chat = document.getElementById("chatArea");
  chat.innerHTML = "";
}
