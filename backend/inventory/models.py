# backend/inventory/models.py

from django.db import models
from django.contrib.auth.models import User
from django.db.models import Sum
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, RegexValidator

# --- NOVOS MODELOS DE SUPORTE ---

class Supplier(models.Model):
    name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=20, blank=True, validators=[RegexValidator(r'^\+?[\d\s-]{8,20}$')])
    email = models.EmailField(blank=True)

    def __str__(self):
        return self.name

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

# backend/inventory/models.py

# ... (outros imports e modelos Supplier, Category)

class Item(models.Model):
    class StatusChoices(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Ativo'
        DISCONTINUED = 'DISCONTINUED', 'Fora de Linha'
        INACTIVE = 'INACTIVE', 'Inativo'
    
    # --- Relacionamentos e Identificadores ---
    owner = models.ForeignKey(User, on_delete=models.CASCADE, db_index=True)
    sku = models.CharField(max_length=50, unique=True, help_text="Stock Keeping Unit ou Código Único do Produto")
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='items', db_index=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='supplied_items')
    status = models.CharField(max_length=12, choices=StatusChoices.choices, default=StatusChoices.ACTIVE)
    
    # --- Detalhes Físicos e de Compra ---
    photo = models.ImageField(upload_to='item_photos/', blank=True, null=True)
    brand = models.CharField(max_length=50, blank=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, validators=[MinValueValidator(0.0)])
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)], help_text="Preço de Venda para o cliente")
    unit_of_measure = models.CharField(max_length=50, default='Peça')
    
    # --- CAMPOS REINSERIDOS ---
    origin = models.CharField(max_length=100, blank=True)
    weight = models.FloatField(blank=True, null=True, help_text="Peso em kg")
    
    # --- Controle de Estoque ---
    minimum_stock_level = models.PositiveIntegerField(default=10, validators=[MinValueValidator(1)], help_text="Nível mínimo para alerta de estoque baixo")
    
    # --- Códigos e Descrições ---
    internal_code = models.CharField(max_length=50, blank=True)
    manufacturer_code = models.CharField(max_length=50, blank=True)
    long_description = models.TextField(blank=True)
    short_description = models.CharField(max_length=255, blank=True)
    
    # --- Timestamps e Propriedades ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def total_quantity(self):
        total = self.stock_items.aggregate(total=Sum('quantity'))['total']
        return total if total is not None else 0
        
    @property
    def is_low_stock(self):
        return self.total_quantity < self.minimum_stock_level

    def __str__(self):
        return f"{self.name} (SKU: {self.sku})"

# --- MODELOS DE ESTOQUE E LOCALIZAÇÃO ---

class Location(models.Model):
    name = models.CharField(max_length=100)
    warehouse = models.CharField(max_length=100, help_text="Nome do armazém ou área principal")
    shelf = models.CharField(max_length=50, blank=True, help_text="Ex: Corredor A, Prateleira 3")

    def __str__(self):
        return f"{self.warehouse} - {self.name}"

class StockItem(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='stock_items')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='stock_locations')
    quantity = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('item', 'location')

    def __str__(self):
        return f"{self.item.name} @ {self.location.name} (Qty: {self.quantity})"
    
class StockMovement(models.Model):
    class MovementType(models.TextChoices):
        ENTRY = 'ENTRY', 'Entrada (Compra)'
        EXIT = 'EXIT', 'Saída (Venda)'
        INTERNAL = 'INTERNAL', 'Uso Interno'
        ADJUSTMENT = 'ADJUSTMENT', 'Ajuste de Inventário'

    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='movements')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='location_movements')
    quantity_change = models.IntegerField()
    movement_type = models.CharField(max_length=10, choices=MovementType.choices)
    movement_date = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, help_text="Mensagem personalizada, motivo do ajuste, etc.")
    attachment = models.FileField(upload_to='movement_docs/', blank=True, null=True, help_text="Anexo de documento (Ex: Nota Fiscal, Requisição)")

    def clean(self):
        if self.quantity_change == 0:
            raise ValidationError("A quantidade da movimentação não pode ser zero.")
        if self.movement_type == self.MovementType.EXIT and self.quantity_change > 0:
            raise ValidationError("Movimentações de SAÍDA devem ter quantidade negativa.")
        if self.movement_type == self.MovementType.ENTRY and self.quantity_change < 0:
            raise ValidationError("Movimentações de ENTRADA devem ter quantidade positiva.")

    def save(self, *args, **kwargs):
        self.full_clean() # Executa a validação do método clean
        super().save(*args, **kwargs)
        
        stock_item, created = StockItem.objects.get_or_create(item=self.item, location=self.location)
        
        # O método mais seguro para recalcular é somar todas as movimentações
        total_quantity = StockMovement.objects.filter(item=self.item, location=self.location).aggregate(total=Sum('quantity_change'))['total']
        stock_item.quantity = total_quantity if total_quantity is not None else 0
        stock_item.save()

    def __str__(self):
        direction = "+" if self.quantity_change > 0 else ""
        return f"{self.item.name}: {direction}{self.quantity_change} em {self.movement_date.strftime('%d/%m/%Y')}"