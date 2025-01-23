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

  function deleteJam(jamId) {
    console.log(jamId, 'hello');
    fetch(`/clips/deleteJam/${jamId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (response.ok) {
        const jamElement = document.querySelector(`[data-jam-id="${jamId}"]`);
        if (!jamElement) {
          console.error(`Could not find element with data-jam-id="${jamId}"`);
          return;
        }
        jamElement.remove();
      } else {
        console.error('Failed to delete jam');
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }