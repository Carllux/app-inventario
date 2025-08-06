from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Item(models.Model):
    # Relacionamento: Cada item pertence a um usuário.
    # Se o usuário for deletado, todos os seus itens também serão.
    owner = models.ForeignKey(User, on_delete=models.CASCADE)

    # Seus atributos
    name = models.CharField(max_length=100)
    photo = models.ImageField(upload_to='item_photos/', blank=True, null=True)
    brand = models.CharField(max_length=50, blank=True)
    quantity = models.PositiveIntegerField(default=0)
    long_description = models.TextField(blank=True)
    short_description = models.CharField(max_length=255, blank=True)
    compatible_models = models.CharField(max_length=255, blank=True)
    similar_items = models.CharField(max_length=255, blank=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    origin = models.CharField(max_length=100, blank=True)
    weight = models.FloatField(blank=True, null=True)

    # Unidade de Medida com Opções Pré-definidas
    UNIT_CHOICES = [
        ('PC', 'Peça'),
        ('BOX', 'Caixa'),
        ('PAIR', 'Par'),
        ('KIT', 'Kit'),
    ]
    unit_of_measure = models.CharField(max_length=4, choices=UNIT_CHOICES, default='PC')

    # Timestamps automáticos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (Qty: {self.quantity})"
    