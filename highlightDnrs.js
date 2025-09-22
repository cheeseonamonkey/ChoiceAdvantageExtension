const dnrList = ["Doe, John", "cobain, kurt", "Huso, Alexander", "POTTER, HARRY" ]  // add your own names here as: First, Last


function highlightDNRs() {
  const links = document.querySelectorAll('table a');

  links.forEach(link => {
    const text = link.innerText.toUpperCase();

    dnrList.forEach(name => {
      const [last, first] = name.toUpperCase().split(',').map(s => s.trim()); 

      if (text.includes(last) && text.includes(first)) {
        link.innerHTML = `
          <span style="font-weight:bold; line-height: 0.5; position: relative; top:4px; left:-1px; font-family: Roboto; font-size: 0.67em; color:red;"><i>Check DNR</i></span><br/>
          <span style="text-decoration: underline red; text-decoration-thickness:1.2px;">${link.innerText}</span>
        `;
      }
    });
  });
}

highlightDNRs();
