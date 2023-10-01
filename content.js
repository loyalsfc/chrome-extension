let mediaRecorder;
let recorder;
let recordedChunks = [];
let wrapper;
let timer;

chrome.runtime.onMessage.addListener(async(message, sender, sendResponse) => {
    if(message.recordType === "current_tab"){
        recordCurrentTab(message.streamId, message.tabId)
    }

    if(message.recordType === "full_screen"){
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: "screen" } });
        recordScreen(stream);  
    };
});

async function recordCurrentTab(streamId,tabId){
    config = {
        "video": {
            "mandatory": {
                "chromeMediaSourceId": streamId,
                "chromeMediaSource": "tab"
            }
        },
        "audio": {
            "mandatory": {
                "chromeMediaSourceId": streamId,
                "chromeMediaSource": "tab"
            }
        }
    }

    navigator.mediaDevices.getUserMedia(config).then(function (desktop) {
            var stream = new MediaStream();
            if(desktop){
                video = desktop.getVideoTracks()[0];
                stream.addTrack(video);
            }
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=h264',
            });
            
            recordedChunks = [];
            mediaRecorder.onstop=function(){
                var tracks = {};
                tracks.a = stream ? stream.getTracks() : [];
                tracks.b = desktop ? desktop.getTracks() : [];
                tracks.c =  [];
                tracks.total = [...tracks.a, ...tracks.b,...tracks.c];
                /*  */
                for (var i = 0; i < tracks.total.length; i++) {
                    if (tracks.total[i]) {
                        tracks.total[i].stop();
                    }
                }
                stopRecord(recordedChunks)
            }
            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };
            stream.onended = function(){
                mediaRecorder.stop()
            }
            mediaRecorder.start()

            mediaRecorder.onstart = function(){
                injectHtml()
            }
    })
}

function stopRecord(recordedChunks){
    if(mediaRecorder.state == 'recording'){
        mediaRecorder.stop();
    }
    var blob = new Blob(recordedChunks, {
        'type': 'video/mp4'
    });
    var url = URL.createObjectURL(blob);
    console.log(url);

    savingToEndpoint(blob);

    // const reader = new FileReader();
    // reader.onloadend = function () {
    //     const dataUrl = reader.result;
    //     // Now, `dataUrl` contains the video data encoded as a base64 string within a URL.
    //     console.log('Data URL for the video:', dataUrl);
    // };
    // reader.readAsDataURL(blob);

      
    // const downloadLink = document.createElement('a');

    // // Set the anchor's attributes
    // downloadLink.href = url;
    // downloadLink.download = 'demo.mp4'; // Specify the desired filename

    // // Programmatically trigger a click event on the anchor to initiate the download
    // downloadLink.click();
}


  
function recordTab(stream){
    console.log(stream)
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
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };
  
    mediaRecorder.onstop = () => {
        processRecording(recordedChunks)
    };
  
    mediaRecorder.onstart = () => {
        injectHtml();
    }
  
    mediaRecorder.start();
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

function injectHtml(){
    wrapper = document.createElement('div');

    wrapper.innerHTML = `
            <div class="injection-wrapper">
                <div class="video-wrapper">
                    <video height="156" width="156" src="" id="video-preview"></video>
                </div>
                <div class="control-wrapper">
                    <p class="record-time">
                        <span id="current-time" class="current-time">0:00:00</span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="20" height="20" rx="10" fill="#C00404" fill-opacity="0.19"/>
                            <rect x="5" y="5" width="10" height="10" rx="5" fill="#C00404"/>
                        </svg>            
                    </p>
                    <div class="control-button-wrapper">
                        <button class="control-button">
                            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="0.5" y="0.5" width="43" height="43" rx="21.5" fill="white"/>
                                <path d="M18 16.5L18 27.5" stroke="black" stroke-width="2" stroke-linecap="round"/>
                                <path d="M26 16.5L26 27.5" stroke="black" stroke-width="2" stroke-linecap="round"/>
                                <rect x="0.5" y="0.5" width="43" height="43" rx="21.5" stroke="white"/>
                            </svg>
                            Pause              
                        </button>
                        <button class="control-button" id="stopButton">
                            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="0.5" y="0.5" width="43" height="43" rx="21.5" fill="white"/>
                                <path d="M15.25 17.5C15.25 16.2574 16.2574 15.25 17.5 15.25H26.5C27.7426 15.25 28.75 16.2574 28.75 17.5V26.5C28.75 27.7426 27.7426 28.75 26.5 28.75H17.5C16.2574 28.75 15.25 27.7426 15.25 26.5V17.5Z" stroke="#0F172A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <rect x="0.5" y="0.5" width="43" height="43" rx="21.5" stroke="black"/>
                            </svg>
                            Stop
                        </button>
                        <button class="control-button">
                            <p class="btn-wrapper">
                                <svg width="48" height="54" viewBox="0 0 48 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0.5" y="0.5" width="43" height="43" rx="21.5" fill="white"/>
                                    <path d="M25.75 20.5L30.4697 15.7803C30.9421 15.3079 31.75 15.6425 31.75 16.3107V27.6893C31.75 28.3575 30.9421 28.6921 30.4697 28.2197L25.75 23.5M14.5 28.75H23.5C24.7426 28.75 25.75 27.7426 25.75 26.5V17.5C25.75 16.2574 24.7426 15.25 23.5 15.25H14.5C13.2574 15.25 12.25 16.2574 12.25 17.5V26.5C12.25 27.7426 13.2574 28.75 14.5 28.75Z" stroke="#0F172A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>

                                <svg class="svg-absolute" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g filter="url(#filter0_d_597_1362)">
                                    <rect x="4" width="12" height="12" rx="2" fill="white"/>
                                    <path d="M12.6399 7.01671L10.4665 4.84338C10.2099 4.58671 9.78986 4.58671 9.5332 4.84338L7.35986 7.01671" stroke="black" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                                    </g>
                                    <defs>
                                        <filter id="filter0_d_597_1362" x="0" y="0" width="20" height="20" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                        <feOffset dy="4"/>
                                        <feGaussianBlur stdDeviation="2"/>
                                        <feComposite in2="hardAlpha" operator="out"/>
                                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_597_1362"/>
                                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_597_1362" result="shape"/>
                                        </filter>
                                    </defs>
                                </svg>
                            </p>
                            Camera
                        </button>
                        <button class="control-button">
                            <p class="btn-wrapper">
                                <svg width="48" height="54" viewBox="0 0 48 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0.5" y="0.5" width="43" height="43" rx="21.5" fill="white"/>
                                    <path d="M22 28.75C25.3137 28.75 28 26.0637 28 22.75V21.25M22 28.75C18.6863 28.75 16 26.0637 16 22.75V21.25M22 28.75V32.5M18.25 32.5H25.75M22 25.75C20.3431 25.75 19 24.4069 19 22.75V14.5C19 12.8431 20.3431 11.5 22 11.5C23.6569 11.5 25 12.8431 25 14.5V22.75C25 24.4069 23.6569 25.75 22 25.75Z" stroke="#0F172A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>

                                <svg class="svg-absolute" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g filter="url(#filter0_d_597_1362)">
                                    <rect x="4" width="12" height="12" rx="2" fill="white"/>
                                    <path d="M12.6399 7.01671L10.4665 4.84338C10.2099 4.58671 9.78986 4.58671 9.5332 4.84338L7.35986 7.01671" stroke="black" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                                    </g>
                                    <defs>
                                    <filter id="filter0_d_597_1362" x="0" y="0" width="20" height="20" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                    <feOffset dy="4"/>
                                    <feGaussianBlur stdDeviation="2"/>
                                    <feComposite in2="hardAlpha" operator="out"/>
                                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_597_1362"/>
                                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_597_1362" result="shape"/>
                                    </filter>
                                    </defs>
                                </svg>                        
                            </p>
                            Mic                    
                        </button>
                        <button class="control-button">
                            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="0.5" y="0.5" width="43" height="43" rx="21.5" fill="#4B4B4B"/>
                                <path d="M24.7404 19L24.3942 28M19.6058 28L19.2596 19M29.2276 15.7906C29.5696 15.8422 29.9104 15.8975 30.25 15.9563M29.2276 15.7906L28.1598 29.6726C28.0696 30.8448 27.0921 31.75 25.9164 31.75H18.0836C16.9079 31.75 15.9304 30.8448 15.8402 29.6726L14.7724 15.7906M29.2276 15.7906C28.0812 15.6174 26.9215 15.4849 25.75 15.3943M13.75 15.9563C14.0896 15.8975 14.4304 15.8422 14.7724 15.7906M14.7724 15.7906C15.9188 15.6174 17.0785 15.4849 18.25 15.3943M25.75 15.3943V14.4782C25.75 13.2988 24.8393 12.3142 23.6606 12.2765C23.1092 12.2589 22.5556 12.25 22 12.25C21.4444 12.25 20.8908 12.2589 20.3394 12.2765C19.1607 12.3142 18.25 13.2988 18.25 14.4782V15.3943M25.75 15.3943C24.5126 15.2987 23.262 15.25 22 15.25C20.738 15.25 19.4874 15.2987 18.25 15.3943" stroke="#BEBEBE" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <rect x="0.5" y="0.5" width="43" height="43" rx="21.5" stroke="black"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
    `
    document.body.appendChild(wrapper);
    document.getElementById('stopButton').addEventListener('click', stopMediaRecording);
    recordCounter();
    videoOn();
}

function stopMediaRecording(){
    mediaRecorder.stop();
    wrapper.remove();
    stopTimer();
}

function savingToEndpoint(videoBlob){
    const videoFile = new File([videoBlob], 'recorded_video.webm', { type: 'video/webm' });

    const formData = new FormData();
    formData.append('video', videoFile);  

    fetch('https://yms.pythonanywhere.com/api', {
        method: 'POST',
        body: formData,
        headers: {
            "Content-Type": "application/octet-stream"
        },
        
      })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        window.open('https://helpmeout-two.vercel.app/file/jdjdjdjdjdjd', "_blank");
      })
      .catch(error => {
        console.error('Error uploading video:', error);
        window.open('https://helpmeout-two.vercel.app/file/jdjdjdjdjdjd', "_blank");
      });


}

async function videoOn(){
    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    console.log(videoStream);
    document.getElementById('video-preview').src = "https://www.w3schools.com/tags/movie.mp4";
}