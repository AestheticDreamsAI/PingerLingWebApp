      if (location.protocol !== 'https:') {
            location.replace(`https:${location.href.substring(location.protocol.length)}`);
        }

        let listening = false;
        let Settings = false;
        let apiEndpoint = localStorage.getItem('apiEndpoint') || 'https://demo.piperling.com';
        const controlButton = document.getElementById("controlButton");
        const text = document.getElementById("text");
        const speak = document.getElementById("speak");
        const settingsDiv = document.getElementById("settings");
        const apiEndpointInput = document.getElementById("apiEndpoint");
        let mediaRecorder;
        let audioChunks = [];
        let audioContext;
        let microphone;
        let audioWorkletNode;

        async function toggleSettings() {
            settingsDiv.style.display = Settings ? 'block' : 'none';
            Settings = !Settings;
        }

        function saveSettings() {
            apiEndpoint = apiEndpointInput.value || apiEndpoint;
            localStorage.setItem('apiEndpoint', apiEndpoint);
            alert('API Endpoint saved!');
            toggleSettings();
        }

        async function initializeAudioWorklet() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                await audioContext.audioWorklet.addModule('silence-processor.js');
                audioWorkletNode = new AudioWorkletNode(audioContext, 'silence-processor');
                audioWorkletNode.port.onmessage = (event) => {
                    if (event.data === 'silence') {
                        mediaRecorder.stop();
                    }
                };
            }
        }

        async function toggleListening() {
            if (!listening) {
                InitAudio();
                controlButton.innerHTML = "<img src='./images/stop.png'>";
                listening = true;
				fadeOut(text);
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    await initializeAudioWorklet();

                    microphone = audioContext.createMediaStreamSource(stream);
                    microphone.connect(audioWorkletNode);
                    audioWorkletNode.connect(audioContext.destination);

                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.ondataavailable = function(event) {
                        audioChunks.push(event.data);
                    };

                    mediaRecorder.onstop = async function() {
					try{
                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                        const wavBlob = await convertToWav(audioBlob);
                        await sendAudioChunks(wavBlob);
                        audioChunks = [];
						}catch{
							RetryListening();
						}
                        controlButton.innerHTML = "<img src='./images/start.png'>";
                        listening = false;
                        controlButton.onclick = toggleListening;
                    };

                    mediaRecorder.start();

                    controlButton.onclick = () => {
                        mediaRecorder.stop();
                    };
                } catch (err) {
                    console.error('Error accessing media devices.', err);
                    listening = false;
                    controlButton.innerHTML = "<img src='./images/start.png'>";
                }
            } else {
                mediaRecorder.stop();
                listening = false;
                controlButton.onclick = toggleListening;
            }
        }

        async function sendAudioChunks(blob) {
		speak.src=URL.createObjectURL(blob);
		speak.play();
            try {
                controlButton.innerHTML = "<img src='./images/processing.gif'>";
                const response = await fetch(apiEndpoint + "/upload", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'audio/wav'
                    },
                    body: blob
                });

                if (response.ok) {
                    try {
                        const result = await response.json();
						if(result.Language!=="Error")
                        Speak(result);
						else{ 
						text.innerHTML="<h2>Error</h2>"+result.Response;
						}
                    } catch (error) {
					                //text.innerHTML = "Click the button to Start.";
						RetryListening();
                    }
                } else {
                    console.error('Error:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Fetch error:', error);
            }
        }

function RetryListening()
{
setTimeout(function () {
        toggleListening();
    }, 2000);
}


        function dataURItoBlob(dataURI) {
            var byteString;
            if (dataURI.split(',')[0].indexOf('base64') >= 0)
                byteString = atob(dataURI.split(',')[1]);
            else
                byteString = unescape(dataURI.split(',')[1]);

            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
            var ia = new Uint8Array(byteString.length);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            return URL.createObjectURL(new Blob([ia], {type: mimeString}));
        }
		
		        function fadeIn(element) {
				setTimeout(function () {
            element.classList.remove('fade-out');
            element.classList.add('fade-in');

    }, 100);
        }

        function fadeOut(element) {
		setTimeout(function () {
            element.classList.remove('fade-in');
            element.classList.add('fade-out');
					setTimeout(function () {
						
						    }, 2000);
    }, 5000);
        }

        function Speak(result) {
		fadeIn(text);
            speak.addEventListener("ended", function() {
                toggleListening();
            }, { once: true });
            speak.src = dataURItoBlob(result.Audio);
            speak.play();
            text.innerHTML = "<h2>" + result.Language + "</h2>";
                        var responseText = result.Response;
            var i = 0;
			
            function typeWriter() {
                if (i < responseText.length) {
                    text.innerHTML += responseText.charAt(i);
                    i++;
                    setTimeout(typeWriter, 50); // Geschwindigkeit des Tippens (in Millisekunden)
                }else{
					fadeOut(text);
				}
            }

            typeWriter();

        }

        async function convertToWav(audioBlob) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const wavBuffer = audioBufferToWav(audioBuffer);
            return new Blob([wavBuffer], { type: 'audio/wav' });
        }

        function audioBufferToWav(buffer) {
            const numOfChan = buffer.numberOfChannels;
            const length = buffer.length * numOfChan * 2 + 44;
            const bufferArray = new ArrayBuffer(length);
            const view = new DataView(bufferArray);
            let offset = 0;

            writeString(view, offset, 'RIFF'); offset += 4;
            view.setUint32(offset, length - 8, true); offset += 4;
            writeString(view, offset, 'WAVE'); offset += 4;
            writeString(view, offset, 'fmt '); offset += 4;
            view.setUint32(offset, 16, true); offset += 4;
            view.setUint16(offset, 1, true); offset += 2;
            view.setUint16(offset, numOfChan, true); offset += 2;
            view.setUint32(offset, buffer.sampleRate, true); offset += 4;
            view.setUint32(offset, buffer.sampleRate * numOfChan * 2, true); offset += 4;
            view.setUint16(offset, numOfChan * 2, true); offset += 2;
            view.setUint16(offset, 16, true); offset += 2;
            writeString(view, offset, 'data'); offset += 4;
            view.setUint32(offset, length - offset - 4, true); offset += 4;

            for (let i = 0; i < buffer.length; i++) {
                for (let channel = 0; channel < numOfChan; channel++) {
                    const sample = buffer.getChannelData(channel)[i] * 32767.5;
                    view.setInt16(offset, sample < 0 ? sample : sample, true);
                    offset += 2;
                }
            }
            return bufferArray;
        }

        function writeString(view, offset, string) {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }

        window.onload = function() {
            apiEndpointInput.value = localStorage.getItem('apiEndpoint') || 'https://demo.piperling.com';
            InitAudio();  // Unlock audio on page load
        }

        function InitAudio() {
            var audiosWeWantToUnlock = [];
            speak.src = "./silence.wav";  // Use a short silent audio file to unlock audio
            audiosWeWantToUnlock.push(speak);
            if (audiosWeWantToUnlock) {
                for (let a of audiosWeWantToUnlock) {
                    var e = a.play();
                    e.then(_ => {
                        a.volume = 1;
                        a.pause();
                        a.currentTime = 0;
                    })
                    .catch(error => {});
                }
                audiosWeWantToUnlock = null;
            }
        }
		