document.getElementById('subform').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    if (email === ''){
        const existingMsg = document.getElementById('subform').querySelector('.additional');
        if (existingMsg) existingMsg.remove();
        const msg = document.createElement('p');
        msg.className = 'additional';
        msg.textContent = 'Email is required';
        document.getElementById('subform').insertBefore(msg , document.getElementById('doemail'))
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        const existingMsg = document.getElementById('subform').querySelector('.additional');
        if (existingMsg) existingMsg.remove();
        const msg = document.createElement('p');
        msg.className = 'additional';
        msg.textContent = 'Invalid email format';
        document.getElementById('subform').insertBefore(msg , document.getElementById('doemail'))
        return;
    }
    fetch('/api/user/password/reset/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({email})
    })
    .then(response => response.json())
    .then(data => {
        if (!data.error) {
            const successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            successMsg.textContent = 'Forgot Password mail Sent successfully!';
            document.body.appendChild(successMsg);
            setTimeout(() => {
                successMsg.remove();
            }, 1500);
        }
        else{
            const existingMsg = document.getElementById('subform').querySelector('.additional');
            if (existingMsg) existingMsg.remove();
            const msg = document.createElement('p');
            msg.className = 'additional';
            msg.textContent = data.error;
            document.getElementById('subform').insertBefore(msg , document.getElementById('doemail'))
            return;
            }
    })

})
