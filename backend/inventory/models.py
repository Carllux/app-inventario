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
    class LocationType(models.TextChoices):
        RECEIVING = 'RECEIVING', 'Área de Recebimento'
        STORAGE = 'STORAGE', 'Armazenamento Geral'
        PICKING = 'PICKING', 'Área de Separação (Picking)'
        DISPATCH = 'DISPATCH', 'Área de Expedição'
        STOREFRONT = 'STOREFRONT', 'Frente de Loja'

    # ✅ SUA SUGESTÃO: Código único para a locação
    location_code = models.CharField(
        max_length=50, 
        unique=True, 
        help_text="Código único para a locação (ex: A01-P03-B02)"
    )
    
    name = models.CharField(max_length=100, help_text="Nome descritivo da locação (ex: Prateleira de Parafusos)")
    
    # ✅ MELHORIA: Adiciona tipo para análise e regras de negócio
    location_type = models.CharField(
        max_length=20, 
        choices=LocationType.choices, 
        default=LocationType.STORAGE
    )
    
    warehouse = models.CharField(max_length=100, help_text="Nome do armazém ou galpão")
    
    # ✅ MELHORIA: Permite "desativar" uma locação sem deletá-la
    is_active = models.BooleanField(
        default=True,
        help_text="A locação está ativa e pode ser usada?"
    )

    def __str__(self):
        return f"{self.name} ({self.location_code})"

class StockItem(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='stock_items')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='stock_locations')
    quantity = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('item', 'location')

    def __str__(self):
        return f"{self.item.name} @ {self.location.name} (Qty: {self.quantity})"
    

class MovementType(models.Model):
    class FactorChoices(models.IntegerChoices):
        ADD = 1, 'Adicionar ao Estoque'
        SUBTRACT = -1, 'Subtrair do Estoque'

    name = models.CharField(max_length=100, unique=True)
    factor = models.IntegerField(choices=FactorChoices.choices, help_text="Define se a operação é de entrada ou saída.")
    units_per_package = models.PositiveIntegerField(null=True, blank=True, help_text="Para operações com pacotes/caixas, define o fator multiplicador.")
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, help_text="Tipos inativos não aparecerão em novas movimentações.")

    def __str__(self):
        return self.name

class StockMovement(models.Model):
    # Relacionamentos
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='movements')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='location_movements')
    movement_type = models.ForeignKey(MovementType, on_delete=models.PROTECT)
    
    # A quantidade é sempre um número positivo entrado pelo usuário
    quantity = models.PositiveIntegerField()
    
    # Auditoria
    movement_date = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Detalhes
    notes = models.TextField(blank=True)
    attachment = models.FileField(upload_to='movement_docs/', blank=True, null=True)

    def __str__(self):
        op_signal = '+' if self.movement_type.factor == 1 else '-'
        final_qty = self.quantity * (self.movement_type.units_per_package or 1)
        return f"{self.item.name}: {op_signal}{final_qty} em {self.movement_date.strftime('%d/%m/%Y')}"

    def save(self, *args, **kwargs):
        # Primeiro, calculamos o valor real da movimentação
        effective_quantity = self.quantity * (self.movement_type.units_per_package or 1) * self.movement_type.factor
        
        # Encontra ou cria a entrada de estoque
        stock_item, created = StockItem.objects.get_or_create(
            item=self.item,
            location=self.location
        )
        
        # ATUALIZAÇÃO INCREMENTAL: Apenas adicionamos o novo valor ao saldo existente
        stock_item.quantity += effective_quantity
        stock_item.save()
        
        # Agora salvamos a própria movimentação
        super().save(*args, **kwargs)