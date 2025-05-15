document.addEventListener("DOMContentLoaded", () => {
    renderTable();
});

// Utility: Get CSRF token from cookies
function getCookie(name) {
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    for (const cookie of cookies) {
        if (cookie.startsWith(`${name}=`)) {
            return decodeURIComponent(cookie.substring(name.length + 1));
        }
    }
    return null;
}

// Render the table of books
async function renderTable() {
    const response = await fetch('/api/book/list/');
    const books = await response.json();
    const list = document.getElementById("book-list");

    const panel = document.createElement("div");
    panel.className = "book-panels";

    books.forEach(book => {
        const bookDiv = document.createElement("div");
        bookDiv.className = "panel";

        bookDiv.innerHTML = `
            <img src="${book.image}" alt="${book.title}">
            <div class="panel-content">
                <h2>${book.title}</h2>
                <div class="buttons">
                    <button class="edit-btn"
                        data-id="${book.BID}"
                        data-title="${book.title}"
                        data-author="${book.author}"
                        data-category="${book.category_display}"
                        data-description="${book.description}"
                        data-image="${book.image}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="deletebook(${book.BID})">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            </div>
        `;
        panel.appendChild(bookDiv);
    });

    list.appendChild(panel);

    // Add edit listeners
    document.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", () => {
            editBook(button.dataset);
        });
    });
}

// Show form and handle edit logic
function editBook(data) {
    document.getElementById("book-name-head").textContent = data.title;
    window.location.href = "#editUserModal";

    // Set form values
    document.getElementById("id").value = data.id;
    document.getElementById("title").value = data.title;
    document.getElementById("author").value = data.author;
    document.getElementById("genre").value = data.category;
    document.getElementById("description").value = data.description;

    const currentCoverImg = document.getElementById("currentCover");
    currentCoverImg.src = data.image;
    currentCoverImg.style.display = "block";

    let imageChanged = false;

    // Convert uploaded image to base64
    document.getElementById("coverImage").onchange = function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                currentCoverImg.src = reader.result;
                imageChanged = true;
            };
            reader.readAsDataURL(file);
        }
    };

    const form = document.getElementById("editUserForm");

    // Prevent duplicate listeners
    if (form.dataset.listenerAttached === "true") return;
    form.dataset.listenerAttached = "true";

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        document.querySelectorAll('.form-group .additional').forEach(el => el.remove());

        const getInput = (id) => document.getElementById(id).value.trim();
        const updatedBook = {
            BID: getInput("id"),
            title: getInput("title"),
            author: getInput("author"),
            category: getInput("genre"),
            description: getInput("description"),
        };

        // Validate fields
        const fields = ["BID", "title", "author", "category", "description"];
        const messages = [
            "Book ID is required", "Book title is required", "Book author is required",
            "Book category is required", "Book description is required"
        ];
        for (let i = 0; i < fields.length; i++) {
            if (!updatedBook[fields[i]]) {
                showMessage(messages[i], i);
                return;
            }
        }

        const sendBookData = (base64Image) => {
            updatedBook.image = base64Image;

            fetch(`/api/book/edit/${updatedBook.BID}/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken")
                },
                body: JSON.stringify(updatedBook)
            })
            .then(async res => {
                const result = await res.json();
                if (!res.ok) {
                    showMessage(result.error || "Error occurred", 0);
                } else {
                    window.location.href = "#";
                    const successMsg = document.createElement('div');
                    successMsg.className = 'success-message';
                    successMsg.textContent = 'Book Edited successfully!';
                    document.body.appendChild(successMsg);
                    setTimeout(() => {
                        successMsg.remove();
                        window.location.reload();
                    }, 1500);
                }
            })
            .catch(err => {
                showMessage(err.message || "Request failed", 0);
            });
        };

        const currentSrc = currentCoverImg.src;
        const isBase64 = currentSrc.startsWith("data:image");

        if (isBase64 || imageChanged) {
            sendBookData(currentSrc);
        } else {
            // Convert existing image URL to base64
            fetch(currentSrc)
                .then(res => res.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => sendBookData(reader.result);
                    reader.readAsDataURL(blob);
                })
                .catch(() => {
                    showMessage("Failed to convert image", 0);
                });
        }
    });
}


// Show inline form error message
function showMessage(text, index) {
    const msg = document.createElement("p");
    msg.className = "additional";
    msg.textContent = text;
    document.getElementsByClassName("form-group")[index].appendChild(msg);
}

function showMessage(text , index) {
    const msg = document.createElement('p');
    msg.className = 'additional';
    msg.textContent = text;
    document.getElementsByClassName("form-group")[index].appendChild(msg);
}
function deletebook(i){
    window.location.href = "#deleteUserModal" ;
    document.getElementById("confirmDelete").addEventListener("click" , ()=>{
        fetch(`/api/book/delete/${i}/`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie('csrftoken')
            },
        })
        .then(async res => {
            const responseData = await res.json();
            if (!res.ok) {
                console.log(responseData.error)
                return;
            } else {
                window.location.href = "#";
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.textContent = 'Book deleted successfully!';
                document.body.appendChild(successMsg);
                setTimeout(() => {
                    successMsg.remove();
                    window.location.reload();
                }, 1500);
                    return ;
                    }
        })
        .catch(err => {
            console.log(err.message || "Request failed");
        });
    }, {once: true})
    document.getElementById("cancelDelete").addEventListener("click" , ()=>{
    window.location.href = "#";
    return ;
    }, {once: true})
}
