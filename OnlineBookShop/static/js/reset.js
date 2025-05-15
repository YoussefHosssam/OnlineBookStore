document.getElementById('subform').addEventListener('submit', function(event) {
    event.preventDefault();
    const password = document.getElementById('password').value;
    const password2 = document.getElementById('password2').value;
    if (!(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password)) || password === "") {
        showMessage("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.");
        return false;
    }
    if (password !== password2) {
        showMessage('Passwords do not match');
        return;
    }
    const data = {
        new_password: password,
        confirm_password: password2
    };
    fetch(window.location.pathname, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => { 
        if (data.error) {
            showMessage(data.error);
        } else {
            const successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            successMsg.textContent = 'Password reset successfully!';
            document.body.appendChild(successMsg);
            setTimeout(() => {
                successMsg.remove();
                window.location.href = '/login/';
            }, 1500);
        }
    })
    .catch(error => {
        showMessage(error);
    });
});
function showMessage(text) {
    const existingMsg = document.getElementById("subform").querySelector('.additional');
    if (existingMsg) existingMsg.remove();
    const msg = document.createElement('p');
    msg.className = 'additional';
    msg.textContent = text;
    document.getElementById("subform").insertBefore(msg, document.getElementById("submit-btn"));
}
