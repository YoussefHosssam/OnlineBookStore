// Utility functions
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

function showMessage(text, index) {
    const formGroups = document.getElementsByClassName("form-group");
    if (index >= formGroups.length) return;

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

// Phone Verification Module
const PhoneVerification = (() => {
    // DOM Elements
    const elements = {
        verifyPhoneBtn: document.getElementById('verify-phone-btn'),
        phoneInput: document.getElementById('phone'),
        maskedPhoneDisplay: document.getElementById('masked-phone'),
        modal: document.getElementById('verification-modal'),
        closeModalBtn: document.querySelector('.close-modal'),
        displayPhone: document.getElementById('display-phone-number'),
        confirmNumberBtn: document.getElementById('confirm-number-btn'),
        cancelNumberBtn: document.querySelector('#confirm-number-step .btn-cancel'),
        confirmStep: document.getElementById('confirm-number-step'),
        otpStep: document.getElementById('enter-otp-step'),
        verifyOtpBtn: document.getElementById('verify-otp-btn'),
        resendOtpLink: document.getElementById('resend-otp-link'),
        countdownEl: document.getElementById('countdown'),
        successStep: document.getElementById('verification-success'),
        closeSuccessBtn: document.querySelector('.close-success-modal'),
        otpInputs: document.querySelectorAll('.otp-digit'),
        phoneVerifiedIcon: document.querySelector('.phone-verified-icon')
    };

    let countdown;
    let countdownTime = 30;
    let userId = null;

    // Initialize the module
    function init() {
        if (!elements.verifyPhoneBtn) return;

        userId = document.body.getAttribute('data-user-id');
        addEventListeners();
        setupOtpInputHandling();
    }

    // Add event listeners
    function addEventListeners() {
        elements.verifyPhoneBtn.addEventListener('click', openVerificationModal);
        elements.closeModalBtn.addEventListener('click', closeModal);
        elements.cancelNumberBtn.addEventListener('click', closeModal);
        elements.confirmNumberBtn.addEventListener('click', sendOtp);
        elements.verifyOtpBtn.addEventListener('click', verifyOtp);
        elements.resendOtpLink.addEventListener('click', resendOtp);
        elements.closeSuccessBtn.addEventListener('click', closeModal);
    }

    // Setup OTP input handling (4 digits)
    function setupOtpInputHandling() {
        // Only keep first 4 OTP inputs
        elements.otpInputs.forEach((input, index) => {
            if (index >= 4) {
                input.style.display = 'none';
                return;
            }
            
            input.addEventListener('input', function() {
                if (this.value.length === 1) {
                    if (index < 3) { // Only 4 digits (0-3)
                        elements.otpInputs[index + 1].focus();
                    } else {
                        this.blur();
                    }
                }
            });

            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && this.value.length === 0 && index > 0) {
                    elements.otpInputs[index - 1].focus();
                }
            });
        });
    }

    // Open verification modal
    function openVerificationModal() {
        const phoneNumber = elements.phoneInput.value.trim();
        
        if (!phoneNumber) {
            showMessage("Please enter your phone number first", 3);
            return;
        }
        
        if (!/^\+?\d{10,15}$/.test(phoneNumber)) {
            showMessage("Phone number must be 10-15 digits (international format accepted)", 3);
            return;
        }
        
        elements.displayPhone.textContent = phoneNumber;
        elements.modal.style.display = 'flex';
    }

    // Close modal
    function closeModal() {
        elements.modal.style.display = 'none';
        resetVerificationFlow();
    }

    // Send OTP to phone
    async function sendOtp() {
        const phoneNumber = elements.phoneInput.value.trim();
        
        try {
            const response = await fetch(`/api/auth/phone/send_otp/${userId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ phone: phoneNumber })
            });

            if (!response.ok) {
                throw new Error('Failed to send OTP');
            }

            elements.confirmStep.style.display = 'none';
            elements.otpStep.style.display = 'block';
            startCountdown();
        } catch (error) {
            alert('Error sending OTP: ' + error.message);
        }
    }

    // Verify OTP (4 digits)
    async function verifyOtp() {
        // Get first 4 OTP digits only
        const otp = Array.from(elements.otpInputs)
            .slice(0, 4)
            .map(input => input.value)
            .join('');
        
        if (otp.length !== 4) {
            alert('Please enter the full 4-digit code');
            return;
        }

        try {
            const response = await fetch(`/api/auth/phone/verify_otp/${userId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ otp })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Invalid OTP');
            }

            elements.otpStep.style.display = 'none';
            elements.successStep.style.display = 'block';
            clearInterval(countdown);
            markPhoneAsVerified();
        } catch (error) {
            alert('Verification failed: ' + error.message);
        }
    }

    // Resend OTP
    function resendOtp(e) {
        e.preventDefault();
        sendOtp();
        countdownTime = 30;
        elements.countdownEl.textContent = countdownTime;
        clearInterval(countdown);
        elements.resendOtpLink.style.display = 'none';
        elements.countdownEl.style.display = 'inline';
    }

    // Start countdown timer
    function startCountdown() {
        countdown = setInterval(() => {
            countdownTime--;
            elements.countdownEl.textContent = countdownTime;
            
            if (countdownTime <= 0) {
                clearInterval(countdown);
                elements.resendOtpLink.style.display = 'inline';
                elements.countdownEl.style.display = 'none';
            }
        }, 1000);
    }

    // Reset verification flow
    function resetVerificationFlow() {
        elements.confirmStep.style.display = 'block';
        elements.otpStep.style.display = 'none';
        elements.successStep.style.display = 'none';
        countdownTime = 30;
        elements.countdownEl.textContent = countdownTime;
        clearInterval(countdown);
        elements.resendOtpLink.style.display = 'none';
        elements.countdownEl.style.display = 'inline';
        elements.otpInputs.forEach(input => input.value = '');
    }

    // Mask phone number (e.g., +201******45)
    function maskPhoneNumber(phone) {
        if (!phone) return '';
        
        if (phone.startsWith('+')) {
            // International format: +20123456789 → +201****789
            const countryCode = phone.substring(0, 4); // +201
            const lastDigits = phone.slice(-3); // last 3 digits
            const maskedLength = phone.length - 7; // +201 (4) + last 3 (7)
            return `${countryCode}${'*'.repeat(maskedLength)}${lastDigits}`;
        } else {
            // Local format: 01234567890 → *******789
            const lastDigits = phone.slice(-3); // last 3 digits
            const maskedLength = phone.length - 3;
            return `${'*'.repeat(maskedLength)}${lastDigits}`;
        }
    }

    // Mark phone as verified in the UI
    function markPhoneAsVerified() {
        const phoneInput = elements.phoneInput;
        const fullPhone = phoneInput.value.trim();
        const maskedPhone = maskPhoneNumber(fullPhone);

        // Update UI
        elements.maskedPhoneDisplay.textContent = maskedPhone;
        phoneInput.style.display = 'none';
        elements.maskedPhoneDisplay.style.display = 'inline';
        elements.verifyPhoneBtn.disabled = true;
        elements.verifyPhoneBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verified';
        elements.verifyPhoneBtn.classList.add('verified');
        elements.phoneVerifiedIcon.style.display = 'inline-block';
        phoneInput.closest('.phone-input-group').classList.add('phone-verified');
    }

    // Check if phone is verified and update UI
    function checkPhoneVerificationStatus(isVerified, phoneNumber) {
        if (isVerified && phoneNumber) {
            const maskedPhone = maskPhoneNumber(phoneNumber);
            
            elements.maskedPhoneDisplay.textContent = maskedPhone;
            elements.phoneInput.style.display = 'none';
            elements.maskedPhoneDisplay.style.display = 'inline';
            elements.phoneInput.value = phoneNumber;
            elements.verifyPhoneBtn.disabled = true;
            elements.verifyPhoneBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verified';
            elements.verifyPhoneBtn.classList.add('verified');
            elements.phoneVerifiedIcon.style.display = 'inline-block';
            elements.phoneInput.closest('.phone-input-group').classList.add('phone-verified');
        }
    }

    return {
        init,
        checkPhoneVerificationStatus
    };
})();

// Profile Management
const ProfileManager = (() => {
    async function getUserInfo() {
        try {
            const response = await fetch('/api/user/profile/info/');
            if (!response.ok) throw new Error('Failed to fetch user info');
            
            const user = await response.json();
            populateFormFields(user);
            PhoneVerification.checkPhoneVerificationStatus(user.otp_verified, user.phone);
            return user;
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    }

    function populateFormFields(user) {
        document.getElementById("username").value = user.username || "";
        document.getElementById("email").value = user.email || "";
        document.getElementById("password").value = user.password || "";
        document.getElementById("age").value = user.age || "";
        document.getElementById("phone").value = user.phone || "";

        const savedLevel = user.reading_level;
        const levelToCheck = document.querySelector(`input[name="reading-level"][value="${savedLevel}"]`);
        if (levelToCheck) levelToCheck.checked = true;

        const role = user.role;
        const roleInput = document.querySelector(`input[name="role"][value="${role}"]`);
        if (roleInput) roleInput.checked = true;
    }

    async function handleProfileSubmit(e) {
        e.preventDefault();
        
        const username = document.getElementById("username").value.trim();
        const age = document.getElementById("age").value;
        const phone = document.getElementById("phone").value.trim();
        const readinglevel = document.querySelector('input[name="reading-level"]:checked')?.value;
        const role = document.querySelector('input[name="role"]:checked')?.value;

        // Clear existing messages
        document.querySelectorAll('.additional').forEach(el => el.remove());

        // Validation
        if (!username || username.length < 5) {
            showMessage("Username must be at least 6 characters", 1);
            return false;
        }

        if (age && age < 16) {
            showMessage("Age must be 16 or older", 3);
            return false;
        }

        if (phone && !/^\+?\d{10,15}$/.test(phone)) {
            showMessage("Phone number must be 10-15 digits (international format accepted)", 4);
            return false;
        }

        const data = {
            username,
            age,
            phone,
            reading_level: readinglevel,
            role
        };

        try {
            const response = await fetch('/api/user/profile/edit/info/', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie('csrftoken')
                },
                body: JSON.stringify(data)
            });

            const responseData = await response.json();

            if (!response.ok) {
                showMessage(responseData.error || "Username is Exist", 0);
                return;
            }

            showSuccessMessage("Profile updated successfully!");
            setTimeout(() => {
                window.location.href = '/app/profile/';
                getUserInfo();
            }, 1500);
        } catch (err) {
            showMessage(err.message || "An error occurred", 0);
        }
    }

    function init() {
        getUserInfo();
        const saveChangesBtn = document.getElementById("save-changes");
        if (saveChangesBtn) {
            saveChangesBtn.addEventListener("click", handleProfileSubmit);
        }
    }

    return {
        init
    };
})();

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    ProfileManager.init();
    PhoneVerification.init();
});