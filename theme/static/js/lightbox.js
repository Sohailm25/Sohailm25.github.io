// Lightbox for image viewing
document.addEventListener('DOMContentLoaded', function() {
  // Create lightbox modal
  const modal = document.createElement('div');
  modal.className = 'lightbox-modal';
  modal.innerHTML = `
    <span class="lightbox-close">&times;</span>
    <img class="lightbox-content" alt="Enlarged view">
  `;
  document.body.appendChild(modal);

  const modalImg = modal.querySelector('.lightbox-content');
  const closeBtn = modal.querySelector('.lightbox-close');

  // Add click handlers to all content images
  const contentImages = document.querySelectorAll('.page-content img');
  contentImages.forEach(img => {
    img.addEventListener('click', function() {
      modal.classList.add('active');
      modalImg.src = this.src;
      modalImg.alt = this.alt || 'Enlarged image';
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    });
  });

  // Close lightbox function
  function closeLightbox() {
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
  }

  // Close on X button click
  closeBtn.addEventListener('click', closeLightbox);

  // Close on background click
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeLightbox();
    }
  });

  // Close on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeLightbox();
    }
  });
});
