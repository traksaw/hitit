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

function addClipToJam(jamId, clipId) {
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