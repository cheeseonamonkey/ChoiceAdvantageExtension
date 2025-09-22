 document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    const links = document.querySelectorAll('a');
    for (let link of links) {
      if (link.textContent.trim().toLowerCase() === 'back') {
        link.click();
        break;
      }
    }
  }
});
