const getLinks = () => Array.from(document.querySelectorAll('a')).map(a => ({
    element: a,
    text: a.textContent.trim().toLowerCase()
}));
const hasLink = (text) => getLinks().some(link => link.text === text);
const findLink = (text) => getLinks().find(link => link.text === text);



const clickLink = (text) => {
    const link = findLink(text);
    if (link) {
        console.log(`Clicking link: ${text}`);        
        return true;
    }
    return false;
};

const triggerF12 = () => document.dispatchEvent(new KeyboardEvent('keyup', {key: 'F12',code: 'F12',keyCode: 123,which: 123,bubbles: true,cancelable: true}));




// Main keyboard event handler
document.addEventListener('keydown', (event) => {
    
	
	
	// Ctrl + Space: Save/Submit or Check In
	// todo: also there is a button sometimes that says "OK"
	// todo: works for SAVE but not SUBMIT possibly?
    if (event.ctrlKey && event.code === 'Space') {
        event.preventDefault();
        
        if (hasLink('cancel') && (hasLink('save') || hasLink('submit'))) {
            console.log('Shortcut: Ctrl+Space (save/submit)');
            clickLink('save') || clickLink('submit');
        } else if (hasLink('check in')) {
            console.log('Shortcut: Ctrl+Space (check in)');
            clickLink('check in');
        }
    }
    
	
	
    // Escape: Cancel or Back
    else if (event.key === 'Escape') {
        if (clickLink('cancel')) {
            console.log('Shortcut: Escape (cancel)');
        } else if (clickLink('back')) {
            console.log('Shortcut: Escape (back)');
        }
    }
    
	
	
	/*
	todo: disabled feature until it is toggleable & better handles typing periods into page inputs
	
    // Numpad Decimal: Stock shortcuts (replaces F12)
    else if (event.code === 'NumpadDecimal') {
        console.log('Shortcut: Numpad Decimal (stock shortcuts)');
        triggerF12();
    }
    */
    else {
        console.log('No valid shortcut found');
    }
});
