let dateContainer = document.querySelector('div.CHI_MainSection > form > div > div.CHI_InfoSet > ul > li > .CHI_Grid');
let dateTxt = dateContainer.querySelector('input[type="text"]');
let dateBtn = dateContainer.querySelector('#RoomBlockingUpdate');

// Shared inline style string for subtle link-style buttons
const subtleBtnStyle = ` 
    cursor: pointer; 
    font-family: Roboto, sans-serif; 
    font-size: 0.71em; 
    padding: 1px 2px; 
    background: none; 
    border: none; 
    color: rgba(0, 86, 179, 0.5); /* 0.8 alpha blue */
    text-decoration: underline; 
    position: relative; 
    top: -0.75em; 
`;

// Create "Next Day" button
let nextDayBtnText = document.createElement('button');
nextDayBtnText.setAttribute('style', subtleBtnStyle + 'right: -20em;');

// Create "Previous Day" button
let prevDayBtnText = document.createElement('button');
prevDayBtnText.setAttribute('style', subtleBtnStyle + 'right: -5em;');

// Format date to 'MM/DD/YYYY'
function formatDate(date) {
    return date.toLocaleDateString('en-US');
}

function setDateBtnText() {
    let inputDate = new Date(dateTxt.value);

    if (isNaN(inputDate.getTime())) {
        console.error('Invalid date format in the text field');
        return;
    }

    let nextDay = new Date(inputDate);
    nextDay.setDate(inputDate.getDate() + 1);

    let prevDay = new Date(inputDate);
    prevDay.setDate(inputDate.getDate() - 1);

    nextDayBtnText.textContent = "Next Day >";
    nextDayBtnText.onclick = () => {
        dateTxt.value = formatDate(nextDay);
        dateBtn.click();
    };

    prevDayBtnText.textContent = "< Previous Day";
    prevDayBtnText.onclick = () => {
        dateTxt.value = formatDate(prevDay);
        dateBtn.click();
    };

    // Check if the input date is today's date
    let today = new Date();
    today.setHours(0, 0, 0, 0);  // Reset time portion to compare only the date

    if (inputDate.getTime() === today.getTime()) {
        // If the input date is today, hide the "Previous Day" button
        prevDayBtnText.style.display = 'none';
    } else {
        // Otherwise, show the "Previous Day" button
        prevDayBtnText.style.display = 'inline';
    }
}

setDateBtnText();
dateContainer.appendChild(prevDayBtnText);
dateContainer.appendChild(nextDayBtnText);
