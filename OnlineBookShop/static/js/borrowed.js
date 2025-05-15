window.addEventListener("DOMContentLoaded", () => {
    fetchBooks().then(books => {
        const list = document.getElementById("book-list");
        renderbook(books, list);
    });
});

// Search button
document.getElementById('search-btn').addEventListener("click", (e) => {
    e.preventDefault();
    search();
});

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function fetchBooks() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/book/list/borrowed/', true);
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject(new Error(xhr.statusText));
            }
        };
        xhr.onerror = function() {
            reject(new Error('Network Error'));
        };
        xhr.send();
    });
}

function renderbook(books,list){
    let panel = document.createElement("div");
    panel.setAttribute("class", "book-panels");
    for (let i = 0; i < books.length; i++) {
        // Check if book is already borrowed        
        const book = `
        <div class="panel" data-book-index="${books[i].BID}">
            <img src="${books[i].image}" alt="${books[i].title}">
            <div class="panel-content">
                <h2>${books[i].title}</h2>
                <div class="buttons" data-book-index="${books[i].BID}">
                         <a href="#book-info${books[i].BID}" class="info-btn">More Info</a>
                         ${document.body.dataset.userId == books[i].user_id ? `<a onclick="returnModal(${books[i].BID}, ${books[i].user_id})" class="return-btn" data-book-id="${books[i].BID}" data-user-id="${books[i].user_id}">Return</a>` : ''}
                </div>
            </div>
        </div>
        <div id="book-info${books[i].BID}" class="modal">
            <div class="modal-content book-info-modal">
                <a href="#" class="close-btn">&times;</a>
                <h2>Book Information</h2>
                <div class="book-info-grid">
                    <div class="info-item">
                        <span class="info-label">Book ID:</span>
                        <span class="info-value">${books[i].BID}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Book Title:</span>
                        <span class="info-value">${books[i].title}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Author:</span>
                        <span class="info-value">${books[i].author}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Category:</span>
                        <span class="info-value">${books[i].category_display}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Description:</span>
                        <span class="info-value">${books[i].description}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Borrowed at:</span>
                        <span class="info-value">${books[i].borrowed_at}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Returned Date:</span>
                        <span class="info-value">${books[i].return_date}</span>
                    </div>
                    ${document.body.dataset.userRole == 'admin' ? `<div class="info-item">
                        <span class="info-label">Borrowed By:</span>
                        <span class="info-value">${books[i].username}</span>
                    </div>` : ''}
                </div>
            </div>
        </div>`;
        panel.innerHTML += book;
    };
    
    list.appendChild(panel);
}
function returnModal(bookId, userId) {
    window.location.href = "#returnModal";
    
    // Clear previous event listeners to avoid duplicates
    const confirmBtn = document.getElementById("confirmReturn");
    const cancelBtn = document.getElementById("cancelReturn");
    
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    
    document.getElementById("confirmReturn").addEventListener("click", function() {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/book/return/${bookId}/`, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                window.location.href = "#";
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.textContent = 'Book returned successfully!';
                document.body.appendChild(successMsg);
                setTimeout(function() {
                    successMsg.remove();
                    window.location.reload();
                    }, 1000);
            } else {
                console.error('Return error:', xhr.statusText);
            }
        };
        
        xhr.onerror = function() {
            console.error('Request failed');
        };
        
        xhr.send();
    }, {once: true});
    
    document.getElementById("cancelReturn").addEventListener("click", function() {
        window.location.href = "#";
    }, {once: true});
}
function setupSearch() {
    const input = document.getElementById("search");
    const typeSelector = document.getElementById("search-type");

    input.addEventListener("input", () => {
        debounce(search, 300)();
    });

    typeSelector.addEventListener("change", () => {
        search();
    });
}

function debounce(func, delay) {
    let timeout;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, arguments), delay);
    };
}

async function search() {
    const search_term = document.getElementById('search').value;
    const type = document.getElementById('search-type').value;
    const list = document.getElementById("book-list");

    list.innerHTML = ''; // Clear the list

    if (search_term === '') {
        list.innerHTML = `<h1 id='page-title' class="page-title">Borrowed Books</h1>`
        const books = await fetchBooks();
        renderbook(books, list);
        return;
    }

    try {
        const response = await fetch(`/api/book/search/?type=${encodeURIComponent(type)}&search_term=${encodeURIComponent(search_term)}&source=borrow`, {
            method: "GET",
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        });

        if (!response.ok) {
            const panel = document.createElement("div");
            panel.setAttribute("class", "book-panels");
            panel.innerHTML = '<p class="no-results" style="color:white;">No books found matching your search</p>';
            list.appendChild(panel);
        };

        const books = await response.json();
        list.innerHTML = `<h1 class="page-title">Search for "${search_term}" by ${type}</h1>`;

        if (books && books.length > 0) {
            renderbook(books, list);
        } else {
            const panel = document.createElement("div");
            panel.setAttribute("class", "book-panels");
            panel.innerHTML = '<p class="no-results" style="color:white;">No books found matching your search</p>';
            list.appendChild(panel);
        }
    } catch (err) {
        console.error("Error fetching search results:", err);
    }
}