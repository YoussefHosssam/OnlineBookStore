from django.shortcuts import render
from django.contrib.auth import login , logout
from django.views.decorators.csrf import csrf_exempt 
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.contrib.auth import authenticate, login
import json
from django.contrib.auth import get_user_model
from django.shortcuts import redirect
from users.models import User
from books.models import Book , BorrowedBook
from django.contrib.auth import logout
from django.shortcuts import get_object_or_404
from django.core.files.base import ContentFile
import base64
import uuid
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_decode

User = get_user_model()  # in case you are using a custom user model
@csrf_exempt
def register(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        confirmpass = data.get('confirmpassword')
        role = data.get('role', 'user')

        if password != confirmpass or password == '' or confirmpass == '':
            return JsonResponse({"error": "Passwords do not match."}, status=405)

        if User.objects.filter(username=username).exists() or username == '':
            return JsonResponse({"error": "Username already taken."}, status=409)

        if User.objects.filter(email=email).exists() or email == '':
            return JsonResponse({"error": "Email already taken."}, status=409)

        user = User.objects.create_user(username=username, password=password , role=role , email=email)
        user.set_password(password)
        user.save()
        login(request, user)
        return JsonResponse({
                "status": "success",
                "message": "User created successfully.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": role
                },
            }, status=201)
    return JsonResponse({"error": "Unauthorized , POST Request Only."}, status=401)
        
@csrf_exempt
def loginfun(request):
    if request.method == 'POST':
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            user = authenticate(request, email=email, password=password)
            if user is not None:
                login(request, user)
                return JsonResponse({
                "status": "success",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                },
            }, status=200)
            else:
                return JsonResponse({"error": "Invalid Credentials."}, status=400)
    return JsonResponse({"error": "Unauthorized , POST Request Only."}, status=401)

@login_required
def list_book (request) :
    if request.method == "GET" :
        try :
            books = Book.objects.all()
            data = []
            for book in books:
                data.append({
                    'BID': book.BID,
                    'title': book.title,
                    'author': book.author,
                    'category': book.category,
                    'category_display': book.get_category_display(),
                    'description': book.description,
                    'image': book.image.url if book.image else None,
                    'borrowed': book.borrowed,
                })
            return JsonResponse(data, safe=False)
        except Exception as e:
            return JsonResponse({"error": f"Server error: {str(e)}"}, status=500)
    return JsonResponse({"error": "Only GET method allowed"}, status=405)

@csrf_exempt
def logout_view(request):
    logout(request)
    return redirect('login')

@csrf_exempt
@login_required
def profileinfo(request):
    user = request.user
    data = {
        'email': user.email,
        'username': user.username,
        'password' : user.password,
        'age' : user.age,
        'phone' : user.phone,
        'role': user.role ,
        'reading_level' : user.reading_level ,
    }
    return JsonResponse(data)

@csrf_exempt
@login_required
def editprofile(request):
    if request.method == 'POST':
        user = request.user
        try:
            data = json.loads(request.body)
            username = data.get('username')
            age = data.get('age')
            phone = data.get('phone')
            role = data.get('role')
            reading_level = data.get('reading_level')

            if not username or not role:
                return JsonResponse({"error": "Required fields Invalid"}, status=400)

            if age:
                try:
                    age = int(age)
                    if age < 16:
                        return JsonResponse({"error": "Age must be more than 16 years"}, status=400)
                except ValueError:
                    return JsonResponse({"error": "Invalid age format"}, status=400)

            if User.objects.filter(username=username).exclude(id=user.id).exists():
                return JsonResponse({"error": "Username already taken."}, status=409)


            # Update user fields
            user.username = username
            if age:
                user.age = age
            if phone:
                user.phone = phone
            user.role = role
            user.reading_level = reading_level
            user.save()

            return JsonResponse({
                "status": "success",
                "message": "User edited successfully.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "age": user.age,
                    "phone": user.phone,
                    "role": user.role,
                    "reading_level": user.reading_level
                }
            }, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

    return JsonResponse({"error": "Only POST method allowed"}, status=405)

@login_required
def listusers (request) : 
    if request.method == "GET" and request.user.role == 'admin' :
        try :
            users = User.objects.all()
            data = []
            for user in users :
                    data.append({
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'role': user.role,
                        'borrowedbooks': user.books_borrowed,
                    })
            return JsonResponse(data, safe=False)
        except Exception as e:
            return JsonResponse({"error": f"Server error: {str(e)}"}, status=500)
    return JsonResponse({"error": "Only GET method allowed"}, status=405)

@login_required
def deleteusers (request , user_id) :
    if request.method == 'DELETE' and request.user.role == 'admin':
        if request.user.role != 'admin':
            return JsonResponse({"error": "Unauthorized"}, status=403)
        user_to_delete = get_object_or_404(User, id=user_id)
        if user_to_delete == request.user:
            return JsonResponse({"error": "You cannot delete yourself."}, status=400)
        user_to_delete.delete()
        return JsonResponse({"message": "User deleted successfully."}, status=200)
    return JsonResponse({"error": "Only DELETE method allowed"}, status=405)

@login_required
def editusers(request, user_id):
    if request.method == "PUT" and request.user.role == 'admin':
        try:
            user = User.objects.get(id=user_id)
            data = json.loads(request.body)
            username = data.get('username')
            role = data.get('role')
            if username and role and not (User.objects.filter(username=username).exclude(id=user_id).exists()):
                user.username = username
                user.role = role
                user.save()
                return JsonResponse({"status": "success", "message": "User updated."} , status=201)
            else:
                return JsonResponse({"error": "Invalid data or username already exists."}, status=400)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found."}, status=404)
    return JsonResponse({"error": "Only PUT method allowed."}, status=405)

@login_required
def UserDetail (request , user_id) :
    if (request.method == 'GET') :
        user = User.objects.get(id=user_id)
        if (user) :
            data = []
            data.append({
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'age': user.age,
                    'phone': user.phone,
                })
            return JsonResponse ({f"User {user_id}": data} , status=200) 
        else :
            return JsonResponse ({"Error": "User not found"} , status=404) 
    return JsonResponse({"error": "Only GET method allowed."}, status=405)

@login_required
def addbooks (request) : 
    if request.method == 'POST' and request.user.role == 'admin' :
            data = json.loads(request.body)
            BID = data.get('BID')
            title = data.get('title')
            author = data.get('author')
            category = data.get('category')
            description = data.get('description')
            image_data = data.get('image')
            if any(field in [None, ''] for field in [BID , title, author, category, description, image_data]):
                return JsonResponse({'error': 'All fields are required.'}, status=400)
            if Book.objects.filter(BID=BID).exists() :
                return JsonResponse({'error': 'Duplicated Book ID.'}, status=400)
            print ("adsdasdasdas")
            book = Book()
            for field in ['BID' , 'title', 'author', 'description']:
                setattr(book, field, data.get(field))
            book.category = data.get('category')[:2].upper()
            format, imgstr = image_data.split(';base64,')
            ext = format.split('/')[-1]
            image_name = f"{uuid.uuid4()}.{ext}"
            book.image = ContentFile(base64.b64decode(imgstr), name=image_name)
            book.borrowed = False
            book.save()
            return JsonResponse ({'Success' : 'Book Added Successfully' }, status=200 )
    return JsonResponse({"error": "Only POST method allowed."}, status=405)
@login_required
def deletebooks (request , book_id) : 
    if request.method == 'DELETE' and request.user.role == 'admin' :
            book = Book.objects.get(BID=book_id)
            if (book) :
                book.delete()
                return JsonResponse({'success': 'Book Deleted Successfully.'}, status=200)
            else :
                return JsonResponse({'error': 'Book not found.'}, status=404)
    return JsonResponse({"error": "Only DELETE method allowed."}, status=405)
@login_required
def editbooks (request , book_id) : 
    if request.method == 'PUT' and request.user.role == 'admin' :
            book = Book.objects.get(BID=book_id)
            if (book) :
                data = json.loads(request.body)
                title = data.get('title')
                author = data.get('author')
                category = data.get('category')
                description = data.get('description')
                image_data = data.get('image')
                if any(field in [None, ''] for field in [title, author, category, description, image_data]):
                    return JsonResponse({'error': 'All fields are required.'}, status=400)
                else : 
                    for field in ['title', 'author', 'description', 'cover']:
                        setattr(book, field, data.get(field))
                    book.category = data.get('category')[:2].upper()
                    format, imgstr = image_data.split(';base64,')
                    ext = format.split('/')[-1]
                    image_name = f"{uuid.uuid4()}.{ext}"
                    book.image = ContentFile(base64.b64decode(imgstr), name=image_name)
                    book.save()
                    return JsonResponse({'success': 'Book Edited Successfully.'}, status=200)
            else :
                return JsonResponse({'error': 'Book not found.'}, status=404)
    return JsonResponse({"error": "Only PUT method allowed."}, status=405)

@login_required
def borrowbooks (request , book_id) : 
    if(request.method == "POST") :
        try:
                data = json.loads(request.body)
                user = request.user
                fullname = data.get("fullname")
                duration_input = data.get("duration")
                duration_map = {
                "1 Week": "1_week",
                "2 Weeks": "2_weeks",
                "1 Month": "1_month",
                "2 Months": "2_months",
                }
                duration = duration_map.get(duration_input)
                if not book_id or not duration_input:
                    return JsonResponse({"error": "Missing book or duration."}, status=400)
                if not duration:
                    return JsonResponse({"error": "Invalid duration."}, status=400)

                try:
                    book = Book.objects.get(BID=book_id)
                except Book.DoesNotExist:
                    return JsonResponse({"error": "Book not found."}, status=404)
                if BorrowedBook.objects.filter(book=book, returned=False).exists():
                    return JsonResponse({"error": "Book is already borrowed."}, status=400)
                try :
                    borrow = BorrowedBook.objects.create(
                        fullname = fullname ,
                        user=user,
                        book=book,
                        duration=duration
                    )
                    book.borrowed = True
                    book.save()
                    borrow.returned = False
                    borrow.save()
                    return JsonResponse({
                        "message": "Book borrowed successfully.",
                        "book": book.title,
                        "return_date": borrow.returned_at.strftime('%Y-%m-%d %H:%M')
                    })
                except json.JSONDecodeError:
                    return JsonResponse({"error": "Invalid JSON."}, status=400)
        except Exception as e:
                return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Only POST method allowed."}, status=405)
@login_required
def listborrow (request) :
    if (request.method == "GET") :
        books = BorrowedBook.objects.all()
        data = []
        if (books) :
            for b in books:
                if b.returned == True :
                    continue
                data.append({
                    'BID': b.book.BID,
                    'user_id': b.user.id,
                    'username': b.user.username,
                    'title': b.book.title,
                    'author': b.book.author,
                    'category': b.book.category,
                    'category_display': b.book.get_category_display(),
                    'description': b.book.description,
                    'image': b.book.image.url if b.book.image else None,
                    'borrowed': b.book.borrowed,
                    'borrowed_at': b.borrowed_at,
                    'returned': b.returned,
                    'return_date': b.returned_at,
                    'duration': b.get_duration_display()
                })
            return JsonResponse(data, safe=False)
        else :
            return JsonResponse ({"Error": "No Borrowed Books Found"} , status=400) 
    return JsonResponse({"error": "Only POST method allowed."}, status=405)
            
@login_required
def booksearch (request) :
    if(request.method == "GET") :
        search_term = request.GET['search_term']
        type_term = request.GET['type']
        source = request.GET['source']
        if search_term == '' :
            return 
        if type_term not in ['title', 'author', 'category']:
            return JsonResponse({"error": "Invalid search type"}, status=400)
        query_filter = {f"{type_term}__icontains": search_term}
        if (source == 'list'):
            books = Book.objects.filter(**query_filter)
            data = []
            if (books) :
                for book in books:
                    data.append({
                        'BID': book.BID,
                        'title': book.title,
                        'author': book.author,
                        'category': book.category,
                        'category_display': book.get_category_display(),
                        'description': book.description,
                        'image': book.image.url if book.image else None,
                        'borrowed': book.borrowed,
                    })
                return JsonResponse(data, safe=False)
            else :
                return JsonResponse({"error": "No Book Found."}, status=404)
        elif(source == 'borrow'):
            books = BorrowedBook.objects.filter(user=request.user, **{f"book__{type_term}__icontains": search_term})
            data = []
            if (books) :
                for b in books:
                    data.append({
                        'BID': b.book.BID,
                        'title': b.book.title,
                        'author': b.book.author,
                        'category': b.book.category,
                        'category_display': b.book.get_category_display(),
                        'description': b.book.description,
                        'image': b.book.image.url if b.book.image else None,
                        'borrowed': b.book.borrowed,
                        'borrowed_at': b.borrowed_at,
                        'returned': b.returned,
                        'return_date': b.returned_at,
                        'duration': b.get_duration_display()
                    })
                return JsonResponse(data, safe=False)
            else :
                return JsonResponse({"error": "No Book Found."}, status=404)
        else :
            return JsonResponse({"error": "Invalid Source."}, status=400)  
    return JsonResponse({"error": "Only GET method allowed."}, status=405)

@csrf_exempt
def resetpassword(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        if not email:
            return JsonResponse({"error": "Email is required."}, status=400)
        user = User.objects.filter(email=email).first()
        if user:
            try:
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                reset_link = request.build_absolute_uri(
                    f'/api/user/password/reset/confirm/{uid}/{token}/'
                )
                subject = "Password Reset Request"
                message = render_to_string("pages/password_email.html", {
                    'user': user,
                    'reset_link': reset_link,
                })
                send_mail(subject, message, 'noreply@yourapp.com', [email])
                return JsonResponse({"message": "Password reset email sent."}, status=200)
            except Exception as e:
                return JsonResponse({"error": str(e)}, status=500)
        else:
            return JsonResponse({"error": "User not found."}, status=404)
    return JsonResponse({"error": "Only POST method allowed."}, status=405)

@csrf_exempt
def resetpasswordconfirm(request, uidb64, token):
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return JsonResponse({"error": "Invalid reset link."}, status=400)

    if not default_token_generator.check_token(user, token):
        return JsonResponse({"error": "Invalid reset link."}, status=400)

    if request.method == 'GET':
        return render(request, 'pages/reset_password.html', {
            'uidb64': uidb64,
            'token': token
        })

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            new_password = data.get('new_password')
            confirm_password = data.get('confirm_password')
            if not new_password or not confirm_password:
                return JsonResponse({"error": "New password and confirm password are required."}, status=400)
            if new_password != confirm_password:
                return JsonResponse({"error": "Passwords do not match."}, status=400)
            user.set_password(new_password)
            user.save()
            return JsonResponse({"message": "Password reset successfully."}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Method not allowed"}, status=405)

@login_required
def returnbook(request, book_id):
    if request.method == 'POST':
        try:
            book = Book.objects.get(BID=book_id)

            if not book.borrowed:
                return JsonResponse({"error": "Book is not currently borrowed."}, status=400)

            try:
                borrowed_record = BorrowedBook.objects.get(book=book, user=request.user, returned=False)
            except BorrowedBook.DoesNotExist:
                return JsonResponse({"error": "No active borrow record found for this user and book."}, status=404)

            # Mark as returned
            borrowed_record.returned = True
            borrowed_record.returned_at = timezone.now()
            borrowed_record.save()

            # Update book status
            book.borrowed = False
            book.save()

            return JsonResponse({"message": "Book returned successfully."}, status=200)

        except Book.DoesNotExist:
            return JsonResponse({"error": "Book not found."}, status=404)

    return JsonResponse({"error": "Invalid request method."}, status=405)