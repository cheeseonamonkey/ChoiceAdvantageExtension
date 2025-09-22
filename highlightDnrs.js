const dnrList = ["Doe, John", "cobain, kurt", "Huso, Alexander", "POTTER, HARRY" ]  // add your own names here as: First, Last



function highlightDNRs() {
  const links = document.querySelectorAll('table a');
  
  links.forEach(link => {
    const text = link.innerText.toUpperCase();

    dnrList.forEach(name => {
      const [last, first] = name.toUpperCase().split(',').map(s => s.trim()); 

      if (text.includes(last) && text.includes(first)) {
        link.innerHTML = `
          <span class="hover_show" style="padding: 1px; text-shadow 1px 1px 1x rgba(11,11,11,0.35); padding: 1px; background-color: rgba(00,33,33, 0.08); font-weight: bold; line-height: 0.5; position: relative; top:6px; left:-2px; font-family: Roboto; font-size: 0.95em; color:#e33;"><i>Check DNR</i></span><br/>
          <span style="text-decoration: underline red; text-decoration-thickness:1px;">${link.innerText}</span>
        `;
      }
    });
  });
}



const style = document.createElement('style');
style.innerHTML = `
  .hover_show {
    opacity: 0;
    visibility: hidden;
  }
  
  a:hover .hover_show {
    opacity: 1;
    visibility: visible;
  }
`;
document.head.appendChild(style);

highlightDNRs();
