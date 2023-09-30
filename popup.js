const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");

let recordType = 'current_tab';
let isVideoEnabled = true;
let isMicrophoneEnabled = true;
let timer;

startButton.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabCapture.getMediaStreamId({consumerTabId: tab.id}, async (streamId) => {
    const response = await chrome.tabs.sendMessage(tab.id, {recordType, streamId, tabId: tab.id});
    console.log(response);
  });
  

  // chrome.tabs.query({ currentWindow: true, active: true }, function (e) {
  //   var n = e[0];
  //   chrome.tabs.sendMessage(n.id, {
  //     message: 'get-page-title',
  //   }).then((response) => {
  //     console.log(response.pageTitle);
  //   });
      // chrome.tabCapture.getMediaStreamId({consumerTabId: n.id}, (streamId) => {
      //   chrome.tabs.sendMessage(n.id, {type: recordType, streamId:streamId, tabId: n.id});
      // });
  // });
});

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








// document.addEventListener('DOMContentLoaded', function() {
//   document.getElementById('startRecording').addEventListener('click', function() {
//       chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//           chrome.tabs.executeScript(
//               tabs[0].id,
//               {code: `
//                   ${startScreenRecording}
//                   startScreenRecording();
//               `}
//           );
//       });
//   });
// });
