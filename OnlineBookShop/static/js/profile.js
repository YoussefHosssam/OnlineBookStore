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
async function GetUserInfoProfile() {
    const response = await fetch('/api/user/profile/info/');
    const user = await response.json();
    const username = document.getElementById("username");
    const email = document.getElementById("email");
    const pass = document.getElementById("password");
    const age = document.getElementById("age");
    const phone = document.getElementById("phone");
    const savedLevel = user.reading_level ;
    const levelToCheck = document.querySelector(`input[name="reading-level"][value="${savedLevel}"]`);
    const role = user.role;
    const roleInput = document.querySelector(`input[name="role"][value="${role}"]`);
        if (roleInput) {
            roleInput.checked = true;
        }
        if(levelToCheck){
            levelToCheck.checked= true;
        }
    username.value = user.username || "";
    email.value = user.email || "";
    pass.value = user.password || "";
    age.value = user.age || "";
    phone.value = user.phone || "";

}
function showMessage(text, index) {
    const formGroups = document.getElementsByClassName("form-group");
    if (index >= formGroups.length) return;

    // Remove existing message if any
    const existingMsg = formGroups[index].querySelector('.additional');
    if (existingMsg) existingMsg.remove();

    const msg = document.createElement('p');
    msg.className = 'additional';
    msg.textContent = text;
    formGroups[index].appendChild(msg);
}
function showSuccessMessage(message) {
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.textContent = message;
    document.body.appendChild(successMsg);

    setTimeout(() => {
        successMsg.remove();
    }, 1500);
}
async function handleProfileSubmit(e) {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const age = document.getElementById("age").value;
    const phone = document.getElementById("phone").value.trim();
    const readinglevel = document.querySelector('input[name="reading-level"]:checked')?.value;
    const role = document.querySelector(`input[name="role"]:checked`)?.value;
    // Clear existing messages
    document.querySelectorAll('.additional').forEach(el => el.remove());
    // Validation
    if (!username || username.length < 5) {
        showMessage("Username must be at least 6 characters", 0);
        return false;
    }

    if (age && age < 16) {
        showMessage("Age must be 16 or older", 2);
        return false;
    }

    if (phone && !/^\d{10,15}$/.test(phone)) {
        showMessage("Phone number must be 10-15 digits", 3);
        return false;
    }
    const data = {
        username: username,
        age:age,
        phone:phone,
        reading_level:readinglevel,
        role: role,
    };

    fetch('/api/user/profile/edit/info/', {
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
            showMessage(responseData.error || "Username is Exist", 0);
            return;
        }
        else{
            showSuccessMessage("Profile updated successfully!");
            setTimeout(() => {
            window.location.href = '/app/profile/'
            GetUserInfoProfile();
            }, 1500);
        }
    })
    .catch(err => {
        showMessage(err, 0)
    })
}

document.addEventListener("DOMContentLoaded", () => {
    GetUserInfoProfile();
    const profileForm = document.getElementById("profile-form");
    if (profileForm) {
        profileForm.addEventListener("submit", handleProfileSubmit);
    }
});