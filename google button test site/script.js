const button = document.getElementById('wave-btn');
const wave = document.getElementById('wave');
const body = document.body;

button.addEventListener('click', (e) => {
  // Optional: Center the wave perfectly where the user clicked 
  // instead of the exact center of the screen
  wave.style.left = `${e.clientX}px`;
  wave.style.top = `${e.clientY}px`;

  // Start the wave animation
  wave.classList.add('active');

  // Wait for the animation to finish before updating the body background
  wave.addEventListener('animationend', () => {
    body.style.backgroundColor = '#2c3e50'; // Permanently change the background color
    wave.classList.remove('active'); // Reset the wave so it can be clicked again
  }, { once: true }); // Ensure the event listener cleans up after itself
});
