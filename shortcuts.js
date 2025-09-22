const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

document.addEventListener('keydown', async (event) => {
    const links = Array.from(document.querySelectorAll('a')).map(a => ({
        element: a,
        text: a.textContent.trim().toLowerCase()
    }));

    // Ctrl + Space:
	
    if (event.ctrlKey && event.code === 'Space') {
        event.preventDefault(); // Prevent spacebar scroll

        const hasCancel = links.some(link => link.text === 'cancel');
        const hasSave = links.some(link => link.text === 'save');
        const checkInLink = links.find(link => link.text === 'check in');

        if (hasCancel && hasSave) {
            console.log("shortcut determined: cancel / save");
            const saveLink = links.find(link => link.text === 'save');
            if (saveLink) {
                saveLink.element.click();
            }
        }

        if (checkInLink) {
            console.log("shortcut determined: check in");
            checkInLink.element.click();
        }
    }


	
    // Escape:
	
	if (event.key === 'Escape') {
		const cancelLink = links.find(link => link.text === 'cancel');
		if (cancelLink) {
			console.log("shortcut determined: cancel");
			cancelLink.element.click();
		} else {
			const backLink = links.find(link => link.text === 'back');
			if (backLink) {
				console.log("shortcut determined: back");
				backLink.element.click();
			}
		}
	}
});
