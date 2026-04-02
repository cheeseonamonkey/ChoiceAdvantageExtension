globalThis.CAEnhancedFakeData = (() => {
  const STATE_CHOICES = [
    ['CA', 'California', 'Los Angeles', '213'],
    ['TX', 'Texas', 'Dallas', '214'],
    ['FL', 'Florida', 'Orlando', '407'],
    ['GA', 'Georgia', 'Atlanta', '404'],
    ['IL', 'Illinois', 'Chicago', '312'],
    ['CO', 'Colorado', 'Denver', '303'],
    ['WA', 'Washington', 'Seattle', '206'],
    ['AZ', 'Arizona', 'Phoenix', '602'],
    ['NC', 'North Carolina', 'Charlotte', '704'],
    ['TN', 'Tennessee', 'Nashville', '615'],
    ['OR', 'Oregon', 'Portland', '503'],
    ['VA', 'Virginia', 'Richmond', '804']
  ];
  const FIRST_NAMES = ['Ava', 'Mia', 'Noah', 'Liam', 'Ella', 'Ethan', 'Zoe', 'Mason', 'Nora', 'Logan', 'Ruby', 'Lucas', 'Ivy', 'Caleb'];
  const LAST_NAMES = ['Mason', 'Carter', 'Brooks', 'Reed', 'Wright', 'Bennett', 'Coleman', 'Hayes', 'Morgan', 'Parker', 'Bell', 'Foster', 'Reeves', 'Price'];
  const STREET_NAMES = ['Maple', 'Cedar', 'Pine', 'Oak', 'Walnut', 'Sunset', 'Ridge', 'Lake', 'Park', 'Elm', 'Hill', 'View', 'Brook', 'Spruce'];
  const STREET_SUFFIXES = ['St', 'Ave', 'Blvd', 'Rd', 'Ln', 'Dr', 'Way', 'Ct'];
  const pick = values => values[Math.floor(Math.random() * values.length)];
  const hint = node => [node.id, node.name, node.placeholder, node.getAttribute('autocomplete'), node.getAttribute('aria-label'), node.labels && Array.from(node.labels).map(label => (label.textContent || '').trim()).join(' ')].filter(Boolean).join(' ').toLowerCase();

  const createFakeProfile = () => {
    const [state, stateName, city, area] = pick(STATE_CHOICES);
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    return {
      first,
      last,
      fullName: `${first} ${last}`,
      street: `${100 + Math.floor(Math.random() * 8900)} ${pick(STREET_NAMES)} ${pick(STREET_SUFFIXES)}`,
      city,
      state,
      stateName,
      zip: String(10000 + Math.floor(Math.random() * 90000)),
      phone: `(${area}) 555-${String(1000 + Math.floor(Math.random() * 9000))}`
    };
  };

  const shouldFillField = (node, kind) => {
    const text = hint(node);
    if (kind === 'fakeProfile') return true;
    if (kind === 'fakeName') return /name|first|last|given|family|surname/.test(text);
    if (kind === 'fakeAddress') return /address|street|addr|city|state|province|zip|postal/.test(text);
    if (kind === 'fakePhone') return /phone|mobile|tel|contact/.test(text) || node.type === 'tel';
    return false;
  };

  const getFakeValue = (node, profile, kind) => {
    const text = hint(node);
    if (/first/.test(text) && !/last|family/.test(text)) return profile.first;
    if (/last|surname|family/.test(text)) return profile.last;
    if (/full.?name|\bname\b/.test(text) && !/first|last|given|family|surname/.test(text)) return profile.fullName;
    if (/address.?2|suite|apt|unit|floor|room/.test(text)) return 'Apt 4B';
    if (/address|street|addr1|line.?1/.test(text)) return profile.street;
    if (/city|town/.test(text)) return profile.city;
    if (/state|province/.test(text)) return [profile.state, profile.stateName];
    if (/zip|postal/.test(text)) return profile.zip;
    if (/phone|mobile|tel|contact/.test(text) || (kind === 'fakePhone' && node.type === 'tel')) return profile.phone;
    if (kind === 'fakeProfile') return profile.fullName;
    return null;
  };

  return { createFakeProfile, getFakeValue, shouldFillField };
})();
