(function() {
  function loadCSS() {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles.min.css';
    document.head.appendChild(link);
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadCSS, { timeout: 2000 });
  } else {
    window.addEventListener('load', loadCSS);
  }
})();
