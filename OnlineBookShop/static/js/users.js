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

function rendertable() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/user/list/info', true);
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                const users = JSON.parse(xhr.responseText);
                
                let bef = document.getElementById("users-head");
                let userstable = document.createElement("tbody");
                let existingTbody = bef.nextElementSibling;
                
                if (existingTbody && existingTbody.tagName === 'TBODY') {
                    existingTbody.remove();
                }
                
                for (let i = 0; i < users.length; i++) {
                    userstable.innerHTML += `
                        <tr>
                            <td>${users[i].id}</td>
                            <td>${users[i].email}</td>
                            <td>${users[i].username}</td>
                            <td>${users[i].role}</td>
                            <td>${users[i].borrowedbooks == "" ? 0 : users[i].borrowedbooks}</td>
                            <td class="actions">
                                <button onclick="edituser('${users[i].id}', '${users[i].email}', '${users[i].username}', '${users[i].role}')" class="edit-btn">
                                <i class="fas fa-edit"></i> Edit
                                </button>
                                <button onclick="deleteuser(${users[i].id})" class="delete-btn"><i class="fas fa-trash-alt"></i> Delete</button>
                            </td>
                        </tr>
                    `;
                }
                bef.insertAdjacentElement("afterend", userstable);
                resolve();
            } else {
                reject(new Error(xhr.statusText));
            }
        };
        xhr.onerror = function() {
            reject(new Error('Network Error'));
        };
        xhr.send();
    }).catch(error => {
        console.error('Error rendering table:', error);
    });
}

let editingUserId = null;
async function edituser(id, email, username, role) {
    editingUserId = id;
    window.location.href = "#editUserModal";

    document.getElementById("editUserName").value = username;
    document.getElementById("editUserEmail").value = email;
    document.getElementById("editUserRole").value = role;
}

document.getElementById("editUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const inputuser = document.getElementById("editUserName");
    const inputrole = document.getElementById("editUserRole");

    if (inputuser.value === "" || inputrole.value === "") {
        showMessage("Username and Role are required");
        return;
    }
    if (inputuser.value.length < 5) {
        showMessage("Username must be more than 5 characters");
        return;
    }

    const data = {
        username: inputuser.value,
        role: inputrole.value
    };

    try {
        const res = await fetch(`/api/user/list/info/edit/${editingUserId}/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        });

        const responseData = await res.json();

        if (!res.ok) {
            showMessage(responseData.error || "Username already exists");
            return;
        }else{
            window.location.href = "#";
            const successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            successMsg.textContent = 'User Edited successfully!';
            document.body.appendChild(successMsg);
    
            setTimeout(() => {
                successMsg.remove();
                rendertable();
            }, 1500);
        }

    } catch (err) {
        showMessage(err, 0);
    }
});

function showMessage(text) {
    const msg = document.createElement('p');
    msg.className = 'additional';
    msg.textContent = text;
    document.getElementsByClassName("form-group")[0].appendChild(msg);
}

async function deleteuser(i) {
    window.location.href = "#deleteUserModal";
    
    // Clear previous event listeners to avoid duplicates
    const confirmBtn = document.getElementById("confirmDelete");
    const cancelBtn = document.getElementById("cancelDelete");
    
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    
    document.getElementById("confirmDelete").addEventListener("click", async () => {
        try {
            const res = await fetch(`/api/user/delete/${i}/`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie('csrftoken')
                }
            });
            
            if (res.ok) {
                window.location.href = "#";
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.textContent = 'User deleted successfully!';
                document.body.appendChild(successMsg);
                setTimeout(() => {
                    successMsg.remove();
                    rendertable();
                }, 1000);
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    }, {once: true});
    
    document.getElementById("cancelDelete").addEventListener("click", () => {
        window.location.href = "#";
    }, {once: true});
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    rendertable();
});