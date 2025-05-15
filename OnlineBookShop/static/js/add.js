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
// Add event listener for cover preview in the add form
document.getElementById("coverImage").addEventListener("change", function() {
  const file = this.files[0];
  const coverPreview = document.getElementById("coverPreview");
  
  if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
          coverPreview.src = e.target.result;
          coverPreview.style.display = "flex";
      };
      reader.readAsDataURL(file);
  } else {
      coverPreview.style.display = "none";
  }
});
  function showMessage(text, i) {
    const msg = document.createElement('p');
    msg.className = 'additional';
    msg.textContent = text;
    document.getElementsByClassName("form-group")[i].appendChild(msg);
}
document.getElementById("submit-btn").addEventListener('click' , (e)=>{
    e.preventDefault();
  const bookId = document.getElementById("id").value;
  const title = document.getElementById("title").value;
  const author = document.getElementById("author").value;
  const category = document.getElementById("genre").value;
  const desc = document.getElementById("description").value;
  const coverInput = document.getElementById("coverImage");
  const coverPreview = document.getElementById("coverPreview");
  
  let existingMsg = document.querySelector('.form-group .additional');
  if (existingMsg) {
      existingMsg.remove();
  }

  // Validation
  if (bookId === "") {
      showMessage("Book id is required", 0);
      return false;
  }
  if (title === "") {
      showMessage("Book title is required", 1);
      return false;
  }
  if (author === "") {
      showMessage("Book author is required", 2);
      return false;
  }
  if (category === "") {
      showMessage("Book category is required", 3);
      return false;
  }
  if (desc === "") {
      showMessage("Book description is required", 4);
      return false;
  }
  if (!coverInput.files[0]) {
      showMessage("Book cover is required", 5);
      return false;
  }

  const reader = new FileReader();
    reader.onload = function(e) {
        const coverUrl = e.target.result;
        const book = { 
            BID : bookId, 
            title : title, 
            author : author, 
            category : category, 
            description : desc, 
            image: coverUrl 
        };
        fetch("/api/book/add/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie('csrftoken')
            },
            body: JSON.stringify(book)
        })
        .then(async res => {
            const responseData = await res.json();
            if (!res.ok) {
                showMessage(responseData.error || "BID already exists", 0);
                return;
            } else {
                document.getElementById("addBookForm").reset();
                coverPreview.style.display = "none";
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.textContent = 'Book added successfully!';
                document.body.appendChild(successMsg);
                setTimeout(() => successMsg.remove(), 3000);
            }
        })
        .catch(err => {
            showMessage(err.message || "Request failed", 0);
        });
    };

    reader.readAsDataURL(coverInput.files[0]);
})