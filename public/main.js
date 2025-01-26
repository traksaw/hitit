// Export the function
function deleteClip(clipId) {
    console.log(clipId, 'hello');
    fetch(`/clips/deleteClip/${clipId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (response.ok) {
        // Remove the clip from the DOM
        const clipElement = document.querySelector(`[data-clip-id="${clipId}"]`);
        clipElement.remove();
      } else {
        console.error('Failed to delete clip');
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }

// Attach deleteClip to the window object
window.deleteClip = deleteClip;
console.log('deleteClip function attached to window');

export function addClipToJam(jamId, clipId) {
  console.log('Adding clip:', jamId, clipId); // Debug log
  fetch(`/clips/addClipToJam/${jamId}/${clipId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    throw new Error('Failed to add clip');
  })
  .then(data => {
    if (data.clip) {
      // Create new clip element
      const clipHtml = `
        <div class="clip-item" data-clip-id="${data.clip._id}">
          <h5 class="text-custom-green mb-1">${data.clip.title}</h5>
          <p class="text-muted mb-2">${data.clip.description}</p>
          <audio controls class="audio-player">
            <source src="${data.clip.audio}" type="audio/wav">
            <source src="${data.clip.audio}" type="audio/mp3">
          </audio>
        </div>
      `;
      
      // Add the new clip to the jam's clips container
      const jamClipsContainer = document.querySelector('.jam-clips');
      jamClipsContainer.insertAdjacentHTML('beforeend', clipHtml);
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// import * as realtimeBpm from 'https://cdn.jsdelivr.net/npm/realtime-bpm-analyzer/dist/index.esm.js';
// async function handleFileUpload(event) {
//   console.log('process started', event)
//   const file = event.target.files[0];
//   console.log('file is here', file)
//   if (!file) return;
//   const audioContext = new AudioContext();
//   console.log('audio build', audioContext)
//   const reader = new FileReader();
//   console.log('reader build', reader);
//   reader.onload = async () => {
//     console.log('reader started', reader)
//     const audioBuffer = await audioContext.decodeAudioData(reader.result);
//     console.log('audio decoded', audioBuffer)
//     const bpmCandidates = await realtimeBpm.analyzeFullBuffer(audioBuffer);
//     console.log('bpm analyzed', bpmCandidates)
//     const topCandidate = bpmCandidates[0]?.tempo || 'No BPM detected';
//     document.getElementById('bpm-result').textContent = `Detected BPM: ${topCandidate}`;
//   };
//   reader.readAsArrayBuffer(file);
// }
// async function detectBPMAndUpload(e) {
//   console.log('form submitted')
//   e.preventDefault(); //preventing form from submitting server
//   // const file = event.target.files[0];
//   // console.log('file intercepted', file)
//   const form = document.getElementById('addClipForm');
//   const formData = new FormData(form); // Create FormData object from the form
//   // console.log('form data', formData)
//   // Log each key-value pair in the FormData object
//   for (let [key, value] of formData.entries()) {
//     console.log(`${key}:`, value);
//   }
//   console.log(e.target)
//   const file = formData.get("file");
//   console.log('file is here', file);
//   if (!file) return;
//   const audioContext = new AudioContext();
//   console.log('audio build', audioContext)
//   const reader = new FileReader();
//   console.log('reader build', reader);
//   reader.onload = async () => {
//     console.log('reader started', reader)
//     const audioBuffer = await audioContext.decodeAudioData(reader.result);
//     console.log('audio decoded', audioBuffer)
//     const bpmCandidates = await realtimeBpm.analyzeFullBuffer(audioBuffer);
//     console.log('bpm analyzed', bpmCandidates)
//     const topCandidate = bpmCandidates[0]?.tempo || 'No BPM detected';
//     console.log('BPM here', topCandidate)
//     // Optionally, append more data programmatically
//     formData.append('BPM', topCandidate);
//     try {
//       // Use fetch to submit the form data
//       console.log('about to submit form')
//       const response = await fetch("/clips/createClip", {
//         // the headers was causing big problems, its works without it +++
//         // headers: {
//         //   'Content-Type': 'multipart/form-data'
//         // },
//         method: 'POST',
//         body: formData,
//       });
//       // Handle the response
//       if (response.ok) {
//         const result = await response.json();
//         console.log('Form submitted successfully:', result);
//       } else {
//         console.error('Form submission failed:', response.status, response.statusText);
//       }
//     } catch (error) {
//       console.error('Error during submission:', error);
//     }
//     window.location = "/profile";
//     document.getElementById('bpm-result').textContent = `Detected BPM: ${topCandidate}`;
//   };
//   reader.readAsArrayBuffer(file);
// }
// // document.getElementById('file-input').addEventListener('change', handleFileUpload);
// // commented this out +++
// //document.getElementById('testForm').addEventListener('submit', detectBPMAndUpload);
// document.getElementById('addClipForm').addEventListener('submit', detectBPMAndUpload);