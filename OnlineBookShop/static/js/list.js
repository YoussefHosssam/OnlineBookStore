let currentPage = 1;
const booksPerPage = 3;
let allBooks = [];

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

// Fetch books from the API using AJAX
function fetchBooks() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/book/list/', true);
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

// Custom render function for books
function renderbook(books, list) {
    const panel = document.createElement("div");
    const pagination = document.querySelector('.pagination-container');
    panel.setAttribute("class", "book-panels");

    for (let i = 0; i < books.length; i++) {
        const book = books[i];
        const isBorrowed = book.borrowed || false;
        const imageUrl = book.image;

        const bookHTML = `
        <div class="panel" data-book-index="${book.BID}">
            <img src="${imageUrl}" alt="${book.title}">
            <div class="panel-content">
                <h2>${book.title}</h2>
                <div class="buttons" data-book-index="${book.BID}">
                    ${isBorrowed ? `
                        <span class="borrowed-label">BORROWED</span>` :
                        `<a href="#borrow${book.BID}" onclick="borrow(${book.BID})" class="borrow-btn">Borrow</a>
                         <a href="#book-info${book.BID}" class="info-btn">More Info</a>`}
                </div>
            </div>
        </div>

        ${isBorrowed ? '' : `
        <div id="borrow${book.BID}" class="modal" data-book-index="${book.BID}">
            <div class="modal-content">
                <a href="#" class="close-btn">&times;</a>
                <h2>Borrow ${book.title}</h2>
                <form class="borrow-form" data-bid="${book.BID}">
                    <div class="form-group">
                        <label for="name${book.BID}">Full Name</label>
                        <input type="text" id="name${book.BID}" name="name">
                    </div>
                    <div class="form-group">
                        <label for="age${book.BID}">Age</label>
                        <input type="number" id="age${book.BID}" name="age">
                    </div>
                    <div class="form-group">
                        <label for="phone${book.BID}">Phone Number</label>
                        <input type="tel" id="phone${book.BID}" name="phone" readonly>
                    </div>
                    <div class="form-group">
                        <label for="duration${book.BID}">How long will you keep the book?</label>
                        <select id="duration${book.BID}" name="duration">
                            <option value="">Select duration</option>
                            <option value="1 Week">1 Week</option>
                            <option value="2 Weeks">2 Weeks</option>
                            <option value="1 Month">1 Month</option>
                            <option value="2 Months">2 Months</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="reason${book.BID}">Why this specific book?</label>
                        <textarea id="reason${book.BID}" name="reason"></textarea>
                    </div>
                    <button type="submit" class="submit-btn">Submit Request</button>
                </form>
            </div>
        </div>`}

        <div id="book-info${book.BID}" class="modal">
            <div class="modal-content book-info-modal">
                <a href="#" class="close-btn">&times;</a>
                <h2>Book Information</h2>
                <div class="book-info-grid">
                    <div class="info-item"><span class="info-label">Book ID:</span><span class="info-value">${book.BID}</span></div>
                    <div class="info-item"><span class="info-label">Book Title:</span><span class="info-value">${book.title}</span></div>
                    <div class="info-item"><span class="info-label">Author:</span><span class="info-value">${book.author}</span></div>
                    <div class="info-item"><span class="info-label">Category:</span><span class="info-value">${book.category_display}</span></div>
                    <div class="info-item"><span class="info-label">Description:</span><span class="info-value">${book.description}</span></div>
                </div>
            </div>
        </div>
        `;
        panel.innerHTML += bookHTML;
    }

    list.insertBefore(panel, pagination);
}
document.addEventListener('submit', function (e) {
    if (e.target.matches('form.borrow-form')) {
        e.preventDefault();
        const form = e.target;
        const bid = form.dataset.bid;

        // Get fields by correct ID
        const fullname = document.getElementById(`name${bid}`);
        const age = document.getElementById(`age${bid}`);
        const phone = document.getElementById(`phone${bid}`);
        const duration = document.getElementById(`duration${bid}`);

        // Clear old messages
        form.querySelectorAll('.additional').forEach(msg => msg.remove());

        let isValid = true;

        if (!fullname.value || fullname.value.length < 5) {
            showMessage("Full name is required and must be at least 5 characters", 0, form);
            isValid = false;
        }

        if (!age.value || parseInt(age.value) < 16) {
            showMessage("Age is required and must be at least 16 years", 1, form);
            isValid = false;
        }

        if (!phone.value ) {
            showMessage("Please verify your phone number first", 2, form);
            isValid = false;
        }

        if (!duration.value) {
            showMessage("Please select a duration", 3, form);
            isValid = false;
        }

        if (!isValid) return;

        const data = {
            fullname: fullname.value,
            duration: duration.value,
            BID: bid,
        };
        fetch(`/api/book/borrow/${bid}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        })
        .then(async res => {
            const responseData = await res.json();
            if (res.ok) {
                const buttonsDiv = document.querySelector(`.buttons[data-book-index="${bid}"]`);
                if (buttonsDiv) {
                    buttonsDiv.innerHTML = '<span class="borrowed-label">BORROWED</span>';
                    buttonsDiv.classList.add('borrowed');
                }

                const modal = document.getElementById(`borrow${bid}`);
                if (modal) modal.remove();

                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.textContent = 'Book borrowed successfully!';
                document.body.appendChild(successMsg);
                setTimeout(() => successMsg.remove(), 1500);

                form.reset();
            } else {
                console.log(responseData.error);
            }
        })
        .catch((err) => {
            console.error(err);
        });
    }
});

function showMessage(text, i, form) {
    const msg = document.createElement('p');
    msg.className = 'additional';
    msg.textContent = text;
    form.getElementsByClassName("form-group")[i].appendChild(msg);
}

// This function is called when user clicks on a borrow link
async function borrow(bid) {
    const userId = document.body.dataset.userId;
    const form = document.querySelector(`form.borrow-form[data-bid="${bid}"]`);

    if (!form) {
        console.error(`Form not found for BID ${bid}`);
        return;
    }

    try {
        const response = await fetch(`/api/user/details/${userId}`);
        const userData = await response.json();
        const user = userData[`User ${userId}`]?.[0];

        if (user) {
            document.getElementById(`name${bid}`).value = user.username;
            document.getElementById(`age${bid}`).value = user.age;
            document.getElementById(`phone${bid}`).value = user.phone;
        }
    } catch (err) {
        console.error("Error fetching user details:", err);
    }
}


// Paginate and display books for current page
function paginateBooks(page) {
    const start = (page - 1) * booksPerPage;
    const end = page * booksPerPage;
    const paginatedBooks = allBooks.slice(start, end);

    const list = document.getElementById("book-list");
    list.innerHTML = `<h1 class="page-title">List Books</h1>`;
    renderPaginationControls(page);
    renderbook(paginatedBooks, list);
}

// Render pagination buttons
function renderPaginationControls(page) {
    const totalPages = Math.ceil(allBooks.length / booksPerPage);
    const paginationContainer = document.createElement("div");
    paginationContainer.className = "pagination-container";

    let html = `<div class="pagination-list"><ul class="ulpagin">`;

    if (page > 1) {
        html += `<li><a href="#" onclick="changePage(${page - 1})"><i class="fa-solid fa-arrow-left"></i></a></li>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="${i === page ? 'active' : ''}">
                <a href="#" onclick="changePage(${i})"><span>${String(i).padStart(2, '0')}</span></a>
            </li>`;
    }

    if (page < totalPages) {
        html += `<li><a href="#" onclick="changePage(${page + 1})"><i class="fa-solid fa-arrow-right"></i></a></li>`;
    }

    html += `</ul></div>`;
    paginationContainer.innerHTML = html;

    const list = document.getElementById("book-list");
    list.appendChild(paginationContainer);
}

// Change to another page
function changePage(pageNum) {
    currentPage = pageNum;
    paginateBooks(pageNum);
}

// Search functionality
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
        list.innerHTML = `<h1 id='page-title' class="page-title">List Books</h1>`;
        paginateBooks(1); // fallback to pagination
        return;
    }

    try {
        const response = await fetch(`/api/book/search/?type=${encodeURIComponent(type)}&search_term=${encodeURIComponent(search_term)}&source=list`, {
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
            return;
        }

        const books = await response.json();

        if (books && books.length > 0) {
            list.innerHTML = `<h1 class="page-title">Search for "${search_term}" by ${type}</h1>`
            const dummyPagination = document.createElement("div");
            dummyPagination.className = "pagination-container";
            list.appendChild(dummyPagination);
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


// Initialize
window.addEventListener("DOMContentLoaded", async () => {
    allBooks = await fetchBooks();
    paginateBooks(currentPage);
    setupSearch();
});
