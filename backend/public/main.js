function deleteClip(clipId) {
  console.log(clipId, 'hello');
  fetch(`/clips/deleteClip/${clipId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      if (response.ok) {
        // Remove the clip from the DOM
        const clipElement = document.querySelector(`[data-clip-id="${clipId}"]`);
        clipElement.remove();
      } else {
        console.error('Failed to delete clip');
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}
