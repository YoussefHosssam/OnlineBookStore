from django.contrib.auth.models import AbstractBaseUser, BaseUserManager , UserManager , PermissionsMixin
from django.db import models
from django.core.validators import MinLengthValidator, MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone

def validate_age(value):
    if value <= 16:
        raise ValidationError("Age must be greater than 16.")


# Custom User Manager
class CustomUserManager(UserManager):
    def _create_user(self, email, password, role , **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        if not password:
            raise ValueError('The Password field must be set')
        if not role:
            raise ValueError('The Role field must be set')
        user = self.model(email=email, role=role, **extra_fields)
        user.set_password(password)  # Hash the password before saving
        user.save(using=self._db)
        return user
    def create_user (self , email = None, password = None , role = 'user' , **extra_fields):
        extra_fields.setdefault('is_staff' , False)
        extra_fields.setdefault('is_superuser' , False)
        if role == 'admin' :
            extra_fields.setdefault('is_staff' , True)
            extra_fields.setdefault('is_superuser' , True)   
        return self._create_user(email, password , role , **extra_fields)

    def create_superuser(self , email = None, password = None , role = 'admin' , **extra_fields):
        extra_fields.setdefault('is_staff' , True)
        extra_fields.setdefault('is_superuser' , True)
        return self._create_user(email , password , role , **extra_fields)

# Custom User model
class User(AbstractBaseUser , PermissionsMixin):
    USER = 'user'
    ADMIN = 'admin'
    ROLES = [
        (USER, 'User'),
        (ADMIN, 'Admin')
    ]
    email = models.EmailField(unique=True)
    username = models.CharField(
        max_length=30,
        unique=True,
        validators=[MinLengthValidator(5)],
    )
    password = models.CharField(
        max_length=128,
        validators=[MinLengthValidator(8)],
    )
    age = models.PositiveIntegerField(validators=[validate_age], blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(
        max_length=10,
        choices=ROLES,
        default=USER
    )
    READING_LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    reading_level = models.CharField(
        max_length=20,
        choices=READING_LEVEL_CHOICES,
        default='intermediate',  # since your HTML checks intermediate by default
    )
    books_borrowed = models.PositiveIntegerField(default=0)
    last_login = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username','password'] 

    def __str__(self):
        return self.username

    class Meta:
        ordering = ['username']
        verbose_name = 'User'
        db_table = 'users_table'
