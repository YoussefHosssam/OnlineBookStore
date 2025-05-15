
function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    let subform = document.getElementById("subform").addEventListener('submit', function(e) {
        e.preventDefault();
        let email = document.getElementById("email").value;
        let password = document.getElementById("pass").value;
        
        fetch("/api/login/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie('csrftoken')
            },
            body: JSON.stringify({ email, password })
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                showError(data.error || 'Invalid Credentials');
            } else {
                window.location.href = '/';  // Redirect on success
            }
        })
        .catch(() => {
            showError('Invalid Credentials');
        });
    });
    
function showError(message) {
        // Remove any existing error messages
        const existing = document.querySelector('.additional');
        if (existing) existing.remove();
        
        const msg = document.createElement('p');
        msg.className = 'additional';
        msg.textContent = message;
        document.getElementById("pass").insertAdjacentElement("afterend", msg);
        
        setTimeout(() => {
            msg.remove();
        }, 3000);  // Show for 3 seconds instead of 1
    }
