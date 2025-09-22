const dnrList = ["Doe, John", "cobain, kurt", "Huso, Alexander", "POTTER, HARRY" ]  // add your own names here as: First, Last




function highlightDNRs() {
  const links = document.querySelectorAll('table a');
  
  links.forEach(link => {
    const text = link.innerText.toUpperCase();

    dnrList.forEach(name => {
      const [last, first] = name.toUpperCase().split(',').map(s => s.trim()); 

      if (text.includes(last) && text.includes(first)) {
        link.innerHTML = `
          
          <span style="text-decoration: underline #f44; text-decoration-thickness:1.5px;">
		  <span class="hover_show" style="padding: 1px; text-shadow 1px 1px 1x rgba(11,11,11,0.37); padding: 1.4px; background-color: rgba(22,44,99, 0.94); margin-top: 0.2em; font-weight: bold; position: absolute; font-family: Roboto; font-size: 0.97em; color:#f44;"><i>Check DNR</i><br/></span>
		  ${link.innerText}
		  </span>
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
