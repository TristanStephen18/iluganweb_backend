const currentDate = new Date();
const formattedDate = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit'
});

console.log(formattedDate);