let currentPage = 1;
const booksPerPage = 3;
let allBooks = [];
window.addEventListener("DOMContentLoaded", () => {
    // Initialize the page
    fetchBooks().then(books => {
        allBooks = books;
        renderBooks(allBooks, currentPage);
        setupSearch();
    });

    // Search button
    document.getElementById('search-btn').addEventListener("click", (e) => {
        e.preventDefault();
        search();
    });
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

function renderBooks(books, page = 1) {
    const list = document.getElementById("book-list");    
    // Calculate pagination
    const startIndex = (page - 1) * booksPerPage;
    const endIndex = startIndex + booksPerPage;
    const paginatedBooks = books.slice(startIndex, endIndex);
    
    let panel = document.createElement("div");
    panel.setAttribute("class", "book-panels");
    
    for (let i = 0; i < paginatedBooks.length; i++) {
        const book = paginatedBooks[i];
        const bookHTML = `
        <div class="panel" data-book-index="${book.BID}">
            <img src="${book.image}" alt="${book.title}">
            <div class="panel-content">
                <h2>${book.title}</h2>
                <div class="buttons" data-book-index="${book.BID}">
                    <a href="#book-info${book.BID}" class="info-btn">More Info</a>
                    ${document.body.dataset.userId == book.user_id ? `<a onclick="returnModal(${book.BID}, ${book.user_id})" class="return-btn" data-book-id="${book.BID}" data-user-id="${book.user_id}">Return</a>` : ''}
                </div>
            </div>
        </div>
        <div id="book-info${book.BID}" class="modal">
            <div class="modal-content book-info-modal">
                <a href="#" class="close-btn">&times;</a>
                <h2>Book Information</h2>
                <div class="book-info-grid">
                    <div class="info-item">
                        <span class="info-label">Book ID:</span>
                        <span class="info-value">${book.BID}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Book Title:</span>
                        <span class="info-value">${book.title}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Author:</span>
                        <span class="info-value">${book.author}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Category:</span>
                        <span class="info-value">${book.category_display}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Description:</span>
                        <span class="info-value">${book.description}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Borrowed at:</span>
                        <span class="info-value">${book.borrowed_at}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Returned Date:</span>
                        <span class="info-value">${book.return_date}</span>
                    </div>
                    ${document.body.dataset.userRole == 'admin' ? `<div class="info-item">
                        <span class="info-label">Borrowed By:</span>
                        <span class="info-value">${book.username}</span>
                    </div>` : ''}
                </div>
            </div>
        </div>`;
        panel.innerHTML += bookHTML;
    }
    
    list.appendChild(panel);
    renderPagination(books.length, page);
}

function renderPagination(totalItems, currentPage) {
    const totalPages = Math.ceil(totalItems / booksPerPage);
    if (totalPages <= 1) return;

    const paginationContainer = document.createElement("div");
    paginationContainer.className = "pagination-container";
    
    let html = `<div class="pagination-list"><ul class="ulpagin">`;
    
    // Previous button
    if (currentPage > 1) {
        html += `<li><a href="#" class="page-link" data-page="${currentPage - 1}"><i class="fa-solid fa-arrow-left"></i></a></li>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        html += `
            <li class="${activeClass}">
                <a href="#" class="page-link" data-page="${i}"><span>${String(i).padStart(2, '0')}</span></a>
            </li>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        html += `<li><a href="#" class="page-link" data-page="${currentPage + 1}"><i class="fa-solid fa-arrow-right"></i></a></li>`;
    }
    
    html += `</ul></div>`;
    paginationContainer.innerHTML = html;
    
    const list = document.getElementById("book-list");
    list.appendChild(paginationContainer);
    
    // Add event listeners to pagination links
    document.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.dataset.page);
            if (page !== currentPage) {
                currentPage = page;
                renderBooks(allBooks, currentPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
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

function search() {
    const search_term = document.getElementById('search').value;
    const type = document.getElementById('search-type').value;
    const list = document.getElementById("book-list");

    list.innerHTML = ''; // Clear the list

    if (search_term === '') {
        list.innerHTML = `<h1 class="page-title">Borrowed Books</h1>`;
        renderBooks(allBooks, currentPage);
        return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/api/book/search/?type=${encodeURIComponent(type)}&search_term=${encodeURIComponent(search_term)}&source=borrow`, true);
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const books = JSON.parse(xhr.responseText);
                list.innerHTML = `<h1 class="page-title">Search for "${search_term}" by ${type}</h1>`;
                
                if (books && books.length > 0) {
                    renderBooks(books, 1); // Show first page of search results
                } else {
                    const panel = document.createElement("div");
                    panel.setAttribute("class", "book-panels");
                    panel.innerHTML = '<p class="no-results" style="color:white;">No books found matching your search</p>';
                    list.appendChild(panel);
                }
            } catch (e) {
                console.error("Error parsing search results:", e);
                showNoResults(list, "Error processing search results");
            }
        } else {
            showNoResults(list, "No books found matching your search");
        }
    };
    
    xhr.onerror = function() {
        console.error("Error fetching search results");
        showNoResults(list, "Error occurred while searching");
    };
    
    xhr.send();
}

function showNoResults(list, message) {
    const panel = document.createElement("div");
    panel.className = "book-panels";
    panel.innerHTML = `<p class="no-results" style="color:white;padding-top: 30px;">${message}</p>`;
    list.appendChild(panel);
}