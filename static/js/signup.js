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

let subform = document.getElementById("subform");  
let role = "user";

document.querySelectorAll("[data-role]").forEach(button => {
    button.addEventListener("click", () => {
        role = button.dataset.role;
    });
});

subform.addEventListener('submit', function(e) {
        e.preventDefault();
    
        const pass = document.getElementById('pass').value;
        const cpass = document.getElementById('cpass').value;
        const username = document.getElementById("usr").value;
        const email = document.getElementById("email").value;
    
        // Remove previous error messages
        const existingMsg = document.querySelector('.additional');
        if (existingMsg) {
            existingMsg.remove();
        }
        if (email === "" || !(/^[\w.-]+@[\w.-]+\.\w+$/.test(email))){
            showMessage("Invalid Email", 0);
            return false;
        }
        if (username === "" || username.length < 5){
            showMessage("Username must be at least 5 characters", 1);
            return false;
        }
        if (role === ""){
            showMessage("Role is required", 4);
            return false;
        }
        if (pass !== cpass) {
            showMessage("Passwords do not match", 3);
            return false;
        }
        if (!(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(pass)) || pass === "") {
            showMessage("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.", 2);
            return false;
        }
    
        const data = {
            email:email,
            username: username,
            password: pass,
            confirmpassword:cpass,
            role: role
        };
    
        fetch("/api/register/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        })
        .then(async res => {
            const responseData = await res.json();
        
            if (!res.ok) {
                showMessage(responseData.error || "Username or Email is Exist", 0);
                return;
            }
        
            else{
                window.location.href = '/';
            }
        
        })
        .catch(err => {
            showMessage(err, 0);
        });
        
    });
function showMessage(text, i) {
        const msg = document.createElement('p');
        msg.className = 'additional';
        msg.textContent = text;
        document.getElementsByClassName("form-group")[i].appendChild(msg);
    }