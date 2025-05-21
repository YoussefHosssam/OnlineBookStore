document.addEventListener("DOMContentLoaded", function() {
    // Initialize variables
    let currentPage = 1;
    const booksPerPage = 3;
    let allBooks = [];
    
    // Load books and setup
    loadBooks(function() {
        renderTable();
        setupSearch();
    });

    // Utility: Get CSRF token from cookies
    function getCookie(name) {
        const cookies = document.cookie.split(';').map(function(cookie) {
            return cookie.trim();
        });
        for (var i = 0; i < cookies.length; i++) {
            if (cookies[i].startsWith(name + '=')) {
                return decodeURIComponent(cookies[i].substring(name.length + 1));
            }
        }
        return null;
    }

    // Load all books from API using AJAX
    function loadBooks(callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/book/list/', true);
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    allBooks = JSON.parse(xhr.responseText);
                    if (typeof callback === 'function') {
                        callback();
                    }
                } catch (e) {
                    console.error("Error parsing book data:", e);
                    var list = document.getElementById("book-list");
                    if (list) {
                        showNoResults(list, "Error loading books. Please try again.");
                    }
                }
            } else {
                console.error("Error loading books:", xhr.statusText);
                var list = document.getElementById("book-list");
                if (list) {
                    showNoResults(list, "Error loading books. Please try again.");
                }
            }
        };
        xhr.onerror = function() {
            console.error("Network error while loading books");
            var list = document.getElementById("book-list");
            if (list) {
                showNoResults(list, "Network error. Please check your connection.");
            }
        };
        xhr.send();
    }

    // Search functionality setup
    function setupSearch() {
        var input = document.getElementById("search");
        var typeSelector = document.getElementById("search-type");

        if (input && typeSelector) {
            input.addEventListener("input", function() {
                debounce(search, 300)();
            });

            typeSelector.addEventListener("change", function() {
                search();
            });
        }
    }

    function debounce(func, delay) {
        var timeout;
        return function() {
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(this, arguments);
            }, delay);
        };
    }

    function search() {
        var search_term = document.getElementById('search').value;
        var type = document.getElementById('search-type').value;
        var list = document.getElementById("book-list");

        if (!list) return;

        list.innerHTML = '';

        if (search_term === '') {
            currentPage = 1;
            renderTable();
            return;
        }

        var xhr = new XMLHttpRequest();
        xhr.open('GET', `/api/book/search/?type=${encodeURIComponent(type)}&search_term=${encodeURIComponent(search_term)}&source=list`, true);
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var books = JSON.parse(xhr.responseText);
                    if (books && books.length > 0) {
                        list.innerHTML = `<h1 class="page-title">Search for "${search_term}" by ${type}</h1>`;
                        renderBooks(books, list);
                    } else {
                        showNoResults(list, "No books found matching your search");
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
        var panel = document.createElement("div");
        panel.className = "book-panels";
        panel.innerHTML = '<p class="no-results" style="color:white;padding-top: 30px;">' + message + '</p>';
        list.appendChild(panel);
    }

    // Main render function for books
    function renderBooks(books, list) {
        var panel = document.createElement("div");
        panel.className = "book-panels";

        books.forEach(function(book) {
            var bookDiv = document.createElement("div");
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
                        <button class="delete-btn" data-id="${book.BID}">
                            <i class="fas fa-trash-alt"></i> Delete
                        </button>
                    </div>
                </div>
            `;
            panel.appendChild(bookDiv);
        });

        list.appendChild(panel);

        // Add event listeners
        var editButtons = document.querySelectorAll(".edit-btn");
        for (var i = 0; i < editButtons.length; i++) {
            editButtons[i].addEventListener("click", function() {
                editBook(this.dataset);
            });
        }

        var deleteButtons = document.querySelectorAll(".delete-btn");
        for (var i = 0; i < deleteButtons.length; i++) {
            deleteButtons[i].addEventListener("click", function(e) {
                deletebook(e.target.getAttribute('data-id'));
            });
        }
    }

    // Paginated table render function
    function renderTable() {
        var list = document.getElementById("book-list");
        if (!list) return;

        list.innerHTML = '<h1 class="page-title">List Books</h1>';

        // Calculate paginated books
        var startIndex = (currentPage - 1) * booksPerPage;
        var endIndex = startIndex + booksPerPage;
        var paginatedBooks = allBooks.slice(startIndex, endIndex);

        renderBooks(paginatedBooks, list);
        renderPagination();
    }

    // Render pagination controls
    function renderPagination() {
        var totalPages = Math.ceil(allBooks.length / booksPerPage);
        if (totalPages <= 1) return;

        var paginationContainer = document.createElement("div");
        paginationContainer.className = "pagination-container";

        var html = '<div class="pagination-list"><ul class="ulpagin">';

        // Previous button
        if (currentPage > 1) {
            html += '<li><a href="#" class="page-link" data-page="' + (currentPage - 1) + '"><i class="fa-solid fa-arrow-left"></i></a></li>';
        }

        // Page numbers
        for (var i = 1; i <= totalPages; i++) {
            var activeClass = i === currentPage ? 'active' : '';
            html += `
                <li class="${activeClass}">
                    <a href="#" class="page-link" data-page="${i}"><span>${String(i).padStart(2, '0')}</span></a>
                </li>`;
        }

        // Next button
        if (currentPage < totalPages) {
            html += '<li><a href="#" class="page-link" data-page="' + (currentPage + 1) + '"><i class="fa-solid fa-arrow-right"></i></a></li>';
        }

        html += '</ul></div>';
        paginationContainer.innerHTML = html;

        var list = document.getElementById("book-list");
        list.appendChild(paginationContainer);

        // Add event listeners to pagination links
        var pageLinks = document.querySelectorAll('.page-link');
        for (var i = 0; i < pageLinks.length; i++) {
            pageLinks[i].addEventListener('click', function(e) {
                e.preventDefault();
                var page = parseInt(this.getAttribute('data-page'));
                if (page !== currentPage) {
                    currentPage = page;
                    renderTable();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }
    }

    // Edit book function
    function editBook(data) {
        var bookNameHead = document.getElementById("book-name-head");
        if (bookNameHead) bookNameHead.textContent = data.title;
        
        window.location.href = "#editUserModal";

        // Set form values
        document.getElementById("id").value = data.id;
        document.getElementById("title").value = data.title;
        document.getElementById("author").value = data.author;
        document.getElementById("genre").value = data.category;
        document.getElementById("description").value = data.description;

        var currentCoverImg = document.getElementById("currentCover");
        if (currentCoverImg) {
            currentCoverImg.src = data.image;
            currentCoverImg.style.display = "block";
        }

        var imageChanged = false;

        var coverImageInput = document.getElementById("coverImage");
        if (coverImageInput) {
            coverImageInput.onchange = function() {
                var file = this.files[0];
                if (file && currentCoverImg) {
                    var reader = new FileReader();
                    reader.onload = function() {
                        currentCoverImg.src = reader.result;
                        imageChanged = true;
                    };
                    reader.readAsDataURL(file);
                }
            };
        }

        var form = document.getElementById("editUserForm");
        if (!form || form.getAttribute('data-listener-attached') === "true") return;
        
        form.setAttribute('data-listener-attached', "true");

        form.addEventListener("submit", function(e) {
            e.preventDefault();
            var additionalMessages = document.querySelectorAll('.form-group .additional');
            for (var i = 0; i < additionalMessages.length; i++) {
                additionalMessages[i].remove();
            }

            function getInput(id) {
                var el = document.getElementById(id);
                return el ? el.value.trim() : '';
            }

            var updatedBook = {
                BID: getInput("id"),
                title: getInput("title"),
                author: getInput("author"),
                category: getInput("genre"),
                description: getInput("description"),
            };

            // Validate fields
            var fields = ["BID", "title", "author", "category", "description"];
            var messages = [
                "Book ID is required", "Book title is required", "Book author is required",
                "Book category is required", "Book description is required"
            ];
            
            var isValid = true;
            for (var i = 0; i < fields.length; i++) {
                if (!updatedBook[fields[i]]) {
                    showMessage(messages[i], i);
                    isValid = false;
                }
            }
            if (!isValid) return;

            function sendBookData(base64Image) {
                updatedBook.image = base64Image;

                var xhr = new XMLHttpRequest();
                xhr.open("PUT", `/api/book/edit/${updatedBook.BID}/`, true);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
                
                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            var result = JSON.parse(xhr.responseText);
                            window.location.href = "#";
                            showSuccessMessage('Book edited successfully!');
                        } catch (e) {
                            showMessage("Error parsing response", 0);
                        }
                    } else {
                        try {
                            var result = JSON.parse(xhr.responseText);
                            showMessage(result.error || "Error occurred", 0);
                        } catch (e) {
                            showMessage("Error occurred", 0);
                        }
                    }
                };
                
                xhr.onerror = function() {
                    showMessage("Request failed", 0);
                };
                
                xhr.send(JSON.stringify(updatedBook));
            }

            if (!currentCoverImg) {
                sendBookData('');
                return;
            }

            var currentSrc = currentCoverImg.src;
            var isBase64 = currentSrc.startsWith("data:image");

            if (isBase64 || imageChanged) {
                sendBookData(currentSrc);
            } else {
                // Convert existing image URL to base64
                var imgXhr = new XMLHttpRequest();
                imgXhr.open('GET', currentSrc, true);
                imgXhr.responseType = 'blob';
                
                imgXhr.onload = function() {
                    if (imgXhr.status === 200) {
                        var reader = new FileReader();
                        reader.onloadend = function() {
                            sendBookData(reader.result);
                        };
                        reader.readAsDataURL(imgXhr.response);
                    } else {
                        showMessage("Failed to convert image", 0);
                    }
                };
                
                imgXhr.onerror = function() {
                    showMessage("Failed to convert image", 0);
                };
                
                imgXhr.send();
            }
        });
    }

    function showSuccessMessage(text) {
        var successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = text;
        document.body.appendChild(successMsg);
        setTimeout(function() {
            successMsg.remove();
            window.location.reload();
        }, 1500);
    }

    // Show inline form error message
    function showMessage(text, index) {
        var formGroups = document.getElementsByClassName("form-group");
        if (index >= formGroups.length) return;
        
        var msg = document.createElement("p");
        msg.className = "additional";
        msg.textContent = text;
        formGroups[index].appendChild(msg);
    }

    // Delete book function
    function deletebook(id) {
        if (!id) return;
        
        window.location.href = "#deleteUserModal";
        
        var confirmDelete = document.getElementById("confirmDelete");
        var cancelDelete = document.getElementById("cancelDelete");
        
        if (!confirmDelete || !cancelDelete) return;
        
        function deleteHandler() {
            var xhr = new XMLHttpRequest();
            xhr.open("DELETE", `/api/book/delete/${id}/`, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        var responseData = JSON.parse(xhr.responseText);
                        window.location.href = "#";
                        showSuccessMessage('Book deleted successfully!');
                    } catch (e) {
                        console.log("Error parsing response");
                    }
                } else {
                    try {
                        var responseData = JSON.parse(xhr.responseText);
                        console.log(responseData.error);
                    } catch (e) {
                        console.log("Error occurred");
                    }
                }
            };
            
            xhr.onerror = function() {
                console.log("Request failed");
            };
            
            xhr.send();
        }
        
        function cancelHandler() {
            window.location.href = "#";
        }
        
        confirmDelete.addEventListener("click", deleteHandler, { once: true });
        cancelDelete.addEventListener("click", cancelHandler, { once: true });
    }
});