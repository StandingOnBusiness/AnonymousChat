export const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // HSL: 0-360 hue, 60-80% saturation, 40-60% lightness for readable pastel-ish colors
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 85%)`;
}

export const stringToTextColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    // Darker version of the hue for text
    return `hsl(${hue}, 80%, 30%)`;
}
