const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

const user = prompt("Enter your name");

var peer = new Peer({
  host: '127.0.0.1',
  port: 3030,
  path: '/peerjs',
});

let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream, user);

    peer.on("call", (call) => {
      console.log('someone call me');
      call.answer(stream);
      const video = document.createElement("video");

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

const connectToNewUser = (userId, stream) => {
  console.log('I call someone' + userId);
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
};

peer.on("open", (id) => {
  console.log('my id is' + id);
  socket.emit("join-room", ROOM_ID, id, user);
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
const disconnectBtn = document.querySelector("#disconnect");

muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background_red");
    muteButton.innerHTML = html;
  }
  else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background_red");
    muteButton.innerHTML = html;
  }
})

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background_red");
    stopVideo.innerHTML = html;
  }
  else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background_red");
    stopVideo.innerHTML = html;
  }
})

inviteButton.addEventListener("click", () => {
  prompt("Copy this link and send it to people you want to have video call with",
    window.location.href
  );
})

disconnectBtn.addEventListener("click", () => {
  peer.destroy();
  const myVideoElement = document.querySelector("video");
  if (myVideoElement) {
    myVideoElement.remove();
  }
  socket.emit("disconnect");
  window.location.href = "https://www.google.com";
})




const chatInput = document.getElementById("chat_message");
const sendButton = document.getElementById("send");
const messagesContainer = document.querySelector(".messages");

// Send message to the server when clicking the send button or pressing Enter
sendButton.addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

function sendMessage() {
  const message = chatInput.value.trim();
  if (message !== "") {
    socket.emit("message", message);
    chatInput.value = ""; // Clear the input after sending
  }
}

// Receive and display messages
socket.on("createMessage", ({ username, message }) => {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.innerHTML = `<strong>${username}:</strong> ${message}`;
  messagesContainer.append(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to the bottom
});



const screenShareButton = document.getElementById("screen_share");

screenShareButton.addEventListener("click", async () => {
  try {
    // Request the user's screen
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true
    });

    // Replace the video stream with the screen stream
    replaceStream(screenStream);

    // Optionally, you can stop the screen sharing
    screenStream.getTracks().forEach(track => {
      track.onended = () => {
        // Handle when the user stops screen sharing
        console.log("Screen sharing stopped");
        // You may want to revert to the camera stream here
        // replaceStream(myVideoStream);
      };
    });
  } catch (err) {
    console.error("Error sharing screen:", err);
  }
});


const replaceStream = (screenStream) => {
  const videoTracks = screenStream.getVideoTracks();
  const sender = peerConnection.getSenders().find(sender => sender.track.kind === 'video');

  if (sender) {
    peerConnection.removeTrack(sender);
    peerConnection.addTrack(videoTracks[0], screenStream);
  }

  // Optionally update your local video element
  const myVideoElement = document.querySelector("video");
  if (myVideoElement) {
    myVideoElement.srcObject = screenStream;
  }
};



let screenStream = null;

// Function to start screen sharing
async function startScreenShare() {
  try {
    // Request screen media
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

    // Create a new video element for the screen stream
    const screenVideo = document.createElement("video");
    screenVideo.srcObject = screenStream;
    screenVideo.autoplay = true;

    // Add the screen video to the DOM
    const screenContainer = document.createElement("div");
    screenContainer.classList.add("video-container");
    screenContainer.appendChild(screenVideo);
    videoGrid.appendChild(screenContainer);

    // Send the screen stream to all connected peers
    screenStream.getTracks().forEach((track) => {
      peer.connections.forEach((connection) => {
        connection.addTrack(track, screenStream);
      });
    });

    // Update the button text and functionality
    shareScreenButton.textContent = "Stop Sharing";
    shareScreenButton.removeEventListener("click", startScreenShare);
    shareScreenButton.addEventListener("click", stopScreenShare);

  } catch (error) {
    console.error("Error starting screen share:", error);
  }
}

// Function to stop screen sharing
function stopScreenShare() {
  if (screenStream) {
    screenStream.getTracks().forEach(track => track.stop());
    screenStream = null;

    // Remove the screen share video from the DOM
    const screenContainer = document.querySelector(".video-container");
    if (screenContainer) {
      screenContainer.remove();
    }

    // Update the button text and functionality
    shareScreenButton.textContent = "Share Screen";
    shareScreenButton.removeEventListener("click", stopScreenShare);
    shareScreenButton.addEventListener("click", startScreenShare);
  }
}

// Attach event listener to the button
shareScreenButton.addEventListener("click", startScreenShare);


// Whiteboard toggle
const whiteboardButton = document.getElementById("whiteboard_button");
const whiteboardContainer = document.getElementById("whiteboard-container");

whiteboardButton.addEventListener("click", () => {
    whiteboardContainer.classList.toggle("active");
});

// Canvas and drawing context
const canvas = document.getElementById("whiteboard");
const ctx = canvas.getContext("2d");
let drawing = false;

// // Event listeners for drawing
// canvas.addEventListener("mousedown", startDrawing);
// canvas.addEventListener("mouseup", stopDrawing);
// canvas.addEventListener("mousemove", draw);

// // Start drawing
// function startDrawing(e) {
//     drawing = true;
//     draw(e);
// }

// // Stop drawing
// function stopDrawing() {
//     drawing = false;
//     ctx.beginPath(); // Begin a new path for the next drawing action
// }

// // Draw on the canvas
// function draw(e) {
//     if (!drawing) return;

//     // Set drawing styles
//     ctx.lineWidth = 5;
//     ctx.lineCap = "round";
//     ctx.strokeStyle = "#000";

//     // Calculate coordinates relative to the canvas
//     const x = e.clientX - canvas.offsetLeft;
//     const y = e.clientY - canvas.offsetTop;

//     // Draw the line on the canvas
//     ctx.lineTo(x, y);
//     ctx.stroke();
//     ctx.beginPath();
//     ctx.moveTo(x, y);

//     // Emit the drawing data to the server
//     socket.emit("draw", { x, y });
// }

// // Listen for drawing data from other users
// socket.on("draw", ({ x, y }) => {
//     ctx.lineTo(x, y);
//     ctx.stroke();
//     ctx.beginPath();
//     ctx.moveTo(x, y);
// });

// // Clear whiteboard locally and notify others
// document.getElementById("clear-whiteboard").addEventListener("click", () => {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     socket.emit("clear-whiteboard");
// });

// // Listen for clear whiteboard command from others
// socket.on("clear-whiteboard", () => {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
// });

window.onload = function() {
	var myCanvas = document.getElementById("myCanvas");
	var ctx = myCanvas.getContext("2d");
    
    // Fill Window Width and Height
    myCanvas.width = window.innerWidth;
	myCanvas.height = window.innerHeight;
	
	// Set Background Color
    ctx.fillStyle="#fff";
    ctx.fillRect(0,0,myCanvas.width,myCanvas.height);
	
    // Mouse Event Handlers
	if(myCanvas){
		var isDown = false;
		var canvasX, canvasY;
		ctx.lineWidth = 5;
		
		$(myCanvas)
		.mousedown(function(e){
			isDown = true;
			ctx.beginPath();
			canvasX = e.pageX - myCanvas.offsetLeft;
			canvasY = e.pageY - myCanvas.offsetTop;
			ctx.moveTo(canvasX, canvasY);
		})
		.mousemove(function(e){
			if(isDown !== false) {
				canvasX = e.pageX - myCanvas.offsetLeft;
				canvasY = e.pageY - myCanvas.offsetTop;
				ctx.lineTo(canvasX, canvasY);
				ctx.strokeStyle = "#000";
				ctx.stroke();
			}
		})
		.mouseup(function(e){
			isDown = false;
			ctx.closePath();
		});
	}
	
	// Touch Events Handlers
	draw = {
		started: false,
		start: function(evt) {

			ctx.beginPath();
			ctx.moveTo(
				evt.touches[0].pageX,
				evt.touches[0].pageY
			);

			this.started = true;

		},
		move: function(evt) {

			if (this.started) {
				ctx.lineTo(
					evt.touches[0].pageX,
					evt.touches[0].pageY
				);

				ctx.strokeStyle = "#000";
				ctx.lineWidth = 5;
				ctx.stroke();
			}

		},
		end: function(evt) {
			this.started = false;
		}
	};
	
	// Touch Events
	myCanvas.addEventListener('touchstart', draw.start, false);
	myCanvas.addEventListener('touchend', draw.end, false);
	myCanvas.addEventListener('touchmove', draw.move, false);
	
	// Disable Page Move
	document.body.addEventListener('touchmove',function(evt){
		evt.preventDefault();
	},false);
};