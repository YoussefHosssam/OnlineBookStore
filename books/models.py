from django.db import models
from users.models import User
from django.utils import timezone
from datetime import timedelta
import os 
def get_upload_to(instance , filename):
    return os.path.join('Book_images', str(timezone.now().year), str(timezone.now().month), filename)
class Book (models.Model) :
    FICTION = 'FI'
    NON_FICTION = 'NO'
    FANTASY = 'FA'
    SCI_FI = 'SC'
    MYSTREY = 'MY'
    THRILLER = 'TH'
    ROMANCE = 'RO'
    BIOGRAPHY = 'BI'
    HISTORY = 'HI'
    SELF_HELP = 'SE'
    CATEGORY_CHOICES = [
        (FICTION, 'Fiction'),
        (NON_FICTION, 'Non-Fiction'),
        (FANTASY, 'Fantasy'),
        (MYSTREY, 'Mystrey'),
        (SCI_FI, 'Sci-fi'),
        (THRILLER, 'Thriller'),
        (ROMANCE, 'Romance'),
        (BIOGRAPHY, 'Biography'),
        (HISTORY, 'History'),
        (SELF_HELP, 'Self_help'),
    ]
    BID = models.PositiveIntegerField(primary_key=True)
    title = models.CharField(max_length=60)
    author = models.CharField(max_length=30)
    category = models.CharField(max_length=2, choices=CATEGORY_CHOICES)
    description = models.CharField(max_length=200 , blank=True , null= True);
    image = models.ImageField(upload_to=get_upload_to)
    borrowed = models.BooleanField(default=False , blank=False , null= False )
    def save(self, *args, **kwargs):
        if not self.description:
            self.description = f'This is {self.title} book'
        super().save(*args, **kwargs)

    def __str__(self) :
        return self.title
    class Meta :
        ordering = ['BID']
        verbose_name = 'Book'
        db_table = 'books_table'

class BorrowedBook(models.Model):
    DURATION_CHOICES = [
        ('1_week', '1 Week'),
        ('2_weeks', '2 Weeks'),
        ('1_month', '1 Month'),
        ('2_months', '2 Months'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    fullname = models.TextField(max_length=40 , default='')
    borrowed_at = models.DateTimeField(auto_now_add=True)
    duration = models.CharField(max_length=10, choices=DURATION_CHOICES , default='1 Week')
    returned_at = models.DateTimeField(null=True, blank=True)
    returned = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        if not self.fullname and self.user:
            self.fullname = self.user.username

        # Set returned_at based on duration and borrowed_at
        if is_new:
            duration_map = {
                '1_week': timedelta(weeks=1),
                '2_weeks': timedelta(weeks=2),
                '1_month': timedelta(days=30),
                '2_months': timedelta(days=60),
            }
            borrowed_time = timezone.now()
            self.borrowed_at = borrowed_time
            self.returned_at = borrowed_time + duration_map.get(self.duration, timedelta(weeks=1))

        super().save(*args, **kwargs)

        if is_new and not self.returned:
            self.user.books_borrowed += 1
            self.user.save()

    def delete(self, *args, **kwargs):
        if not self.returned:
            self.user.books_borrowed = max(0, self.user.books_borrowed - 1)
            self.user.save()
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} borrowed {self.book.title}"

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['book'], condition=models.Q(returned=False), name='one_active_borrow_per_book')
        ]
        ordering = ['borrowed_at']
        verbose_name = 'Borrow'
        db_table = 'borrowed_books_table'