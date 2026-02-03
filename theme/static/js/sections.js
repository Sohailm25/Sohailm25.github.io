// Section wrapper for hierarchical indentation
document.addEventListener('DOMContentLoaded', function() {
  const content = document.querySelector('.page-content') || document.querySelector('.post-content') || document.querySelector('main');
  if (!content) return;

  const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (headings.length === 0) return;

  // Get heading level (1-6)
  function getLevel(heading) {
    return parseInt(heading.tagName.substring(1));
  }

  // Find all content between this heading and next same/higher level heading
  function getContentUntilNextHeading(heading) {
    const level = getLevel(heading);
    const elements = [];
    let sibling = heading.nextElementSibling;

    while (sibling) {
      // Stop at next heading of same/higher level
      if (sibling.matches('h1, h2, h3, h4, h5, h6')) {
        const siblingLevel = getLevel(sibling);
        if (siblingLevel <= level) break;
      }
      
      // Also stop at already-wrapped sections of same/higher level
      let shouldStop = false;
      if (sibling.classList) {
        for (let i = 1; i <= level; i++) {
          if (sibling.classList.contains('section-h' + i)) {
            shouldStop = true;
            break;
          }
        }
      }
      if (shouldStop) break;
      
      elements.push(sibling);
      sibling = sibling.nextElementSibling;
    }

    return elements;
  }

  // Process headings in reverse to avoid DOM mutation issues
  Array.from(headings).reverse().forEach(heading => {
    const level = getLevel(heading);
    const contentElements = getContentUntilNextHeading(heading);

    if (contentElements.length > 0) {
      // Create wrapper
      const wrapper = document.createElement('div');
      wrapper.className = `section-h${level}`;

      // Insert wrapper before heading
      heading.parentNode.insertBefore(wrapper, heading);

      // Move heading into wrapper
      wrapper.appendChild(heading);

      // Move content elements into wrapper
      contentElements.forEach(el => wrapper.appendChild(el));
    }
  });
});
