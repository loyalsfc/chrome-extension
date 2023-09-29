const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");

let mediaRecorder;
let recorder;
let recordedChunks = [];
let recordType = 'current_tab';
let isVideoEnabled = true;
let isMicrophoneEnabled = true;
let timer;

startButton.addEventListener("click", async () => {
    recordType === "current_tab" ? captureTab() : captureScreen();
});

function captureTab(){
  chrome.tabCapture.capture({
    video: isVideoEnabled,
    audio: isMicrophoneEnabled,
  }, function(stream) {
    const output = new AudioContext();
    const source = output.createMediaStreamSource(stream);
    source.connect(output.destination);
    recordTab(stream);
  });
}

async function captureScreen(){
  // const stream = await navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: "screen" } });
  chrome.desktopCapture.chooseDesktopMedia(["screen"], function(stream) {
    // Get a list of all audio input devices.
    chrome.mediaDevices.enumerateDevices(function(devices) {
      // Select the desired audio input device from the list.
      var audioInputDevice = devices.find(device => device.kind === "audioinput");

      // Create a MediaRecorder object and pass it the video source and the audio source.
      var recorder = new MediaRecorder(stream, { audio: audioInputDevice });

      // Start recording.
      recorder.start();

      // Stop recording after 10 seconds.
      setTimeout(function() {
        recorder.stop();
      }, 5000);

      // Get the recorded data.
      recorder.onstop = function(event) {
        // Do something with the recorded data, such as saving it to a file or uploading it to a server.
        console.log(event)
      };
    });
  });

}

function recordTab(stream){
  recorder = new MediaRecorder(stream);

  recorder.ondataavailable = (event) => {
    console.log('data size available guys')
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  // Start recording.
  recorder.start();

  // Stop recording after 5 seconds.
  setTimeout(function() {
    recorder.stop();
    stopTimer()
  }, 5000);

  // Get the recorded data.
  recorder.onstop = function(event) {
    processRecording(recordedChunks);
    stopTimer();
  };

  recorder.onstart = () => {
    recordCounter();
  }
}

function recordScreen(stream){
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    console.log('data size available guys')
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    processRecording(recordedChunks)
  };

  mediaRecorder.onstart = () => {
    recordCounter();
  }

  mediaRecorder.start();
  startButton.disabled = true;
  stopButton.disabled = false;
}

function processRecording(recordedChunks){
  const blob = new Blob(recordedChunks, { type: "video/webm" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = "screen-recording.webm";
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
}

stopButton.addEventListener("click", () => {
  mediaRecorder.stop();
  startButton.disabled = false;
  stopButton.disabled = true;
});

function selectRecordType(id, type){
  document.querySelectorAll('.display-type-btn').forEach(item => item.classList.remove('active-display-type-btn'));
  document.getElementById(id).classList.add('active-display-type-btn');
  recordType = type;
};

document.getElementById('full-screen').addEventListener('click', () => {
  selectRecordType('full-screen', "full_screen" );
})

document.getElementById('current-tab').addEventListener('click', () => {
  selectRecordType('current-tab', "current_tab" );
})

document.getElementById('video-toggle').addEventListener('change', (event) => {
  isVideoEnabled = event.target.checked
})

document.getElementById('microphone-toggle').addEventListener('change', (event) => {
  isMicrophoneEnabled = event.target.checked
})

function recordCounter(){
  let hours = 0;
  let minutes = 0;
  let seconds = 1;
  timer = setInterval(function () {
    seconds++;
    if (seconds >= 60) {
        seconds = 0;
        minutes++;
        if (minutes >= 60) {
            minutes = 0;
            hours++;
        }
    }

    // Format the time as HH:MM:SS
    let formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('current-time').textContent = formattedTime;
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
}