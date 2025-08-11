# backend/inventory/models.py

from django.db import models, transaction
from django.contrib.auth.models import User
from django.db.models import Sum
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django_countries.fields import CountryField
from addresses.models import City

# --- 1. MODELOS DE ORGANIZAÇÃO, HIERARQUIA E PERMISSÃO ---

class Branch(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    class Meta:
        verbose_name = "Filial"
        verbose_name_plural = "Filiais"
    def __str__(self):
        return self.name

class Sector(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='sectors', verbose_name="Filial")
    name = models.CharField(max_length=100, verbose_name="Nome do Setor")
    description = models.TextField(blank=True, verbose_name="Descrição")
    is_active = models.BooleanField(default=True, verbose_name="Ativo?")
    class Meta:
        unique_together = ('branch', 'name')
        verbose_name = "Setor"
        verbose_name_plural = "Setores"
    def __str__(self):
        return f"{self.name} ({self.branch.name})"

class Location(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='locations', verbose_name="Filial")
    location_code = models.CharField(max_length=50, help_text="Código único para a locação dentro da filial")
    name = models.CharField(max_length=100, help_text="Nome descritivo (ex: Prateleira de Parafusos)")
    is_active = models.BooleanField(default=True, help_text="A locação está ativa e pode ser usada?")
    class Meta:
        unique_together = ('branch', 'location_code')
        verbose_name = "Locação"
        verbose_name_plural = "Locações"
    def __str__(self):
        return f"{self.name} ({self.branch.name})"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    manager = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='managed_team', # Nome um pouco mais explícito
        verbose_name="Gerente Direto"
    )
    branches = models.ManyToManyField(Branch, blank=True, verbose_name="Filiais de Acesso")
    sectors = models.ManyToManyField(Sector, blank=True, verbose_name="Setores de Atuação")
    job_title = models.CharField(max_length=100, blank=True, verbose_name="Cargo")
    phone_number = models.CharField(max_length=20, blank=True, verbose_name="Telefone")
    hire_date = models.DateField(null=True, blank=True, verbose_name="Data de Contratação")
    
    @property
    def is_active(self):
        return self.user.is_active

    def __str__(self):
        return self.user.username


# --- 2. MODELOS DE CATÁLOGO DE PRODUTOS ---

class Supplier(models.Model):
    class TaxRegime(models.TextChoices):
        SIMPLE = 'SIMPLE', 'Simples Nacional'
        MEI = 'MEI', 'MEI'
        REAL = 'REAL', 'Lucro Real'
        PRESUMED = 'PRESUMED', 'Lucro Presumido'
        OTHER = 'OTHER', 'Outro'
    name = models.CharField(max_length=150, verbose_name="Nome/Razão Social")
    # ✅ RELAÇÃO MATRIZ/FILIAL
    parent_supplier = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, 
        related_name='branches', verbose_name="Fornecedor Matriz"
    )
    country = CountryField(default='BR', verbose_name="País")
    tax_regime = models.CharField(max_length=10, choices=TaxRegime.choices, blank=True, verbose_name="Regime Tributário")
    cnpj = models.CharField(max_length=18, blank=True, verbose_name="CNPJ (se brasileiro)")
    tax_id = models.CharField(max_length=50, blank=True, verbose_name="ID Fiscal (se estrangeiro)")
    is_active = models.BooleanField(default=True, verbose_name="Ativo?")
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Cidade")
    contact_person = models.CharField(max_length=100, blank=True, verbose_name="Pessoa de Contato")
    phone_number = models.CharField(max_length=20, blank=True, verbose_name="Telefone de Contato")
    email = models.EmailField(blank=True, verbose_name="E-mail de Contato")
    def __str__(self):
        return self.name

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, verbose_name="Ativo?")
    class Meta:
        verbose_name_plural = "Categories"
    def __str__(self):
        return self.name

class Item(models.Model):
    class StatusChoices(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Ativo'
        DISCONTINUED = 'DISCONTINUED', 'Fora de Linha'
        INACTIVE = 'INACTIVE', 'Inativo'
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, help_text="Usuário que cadastrou o item.")
    sku = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='items')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='supplied_items')
    status = models.CharField(max_length=12, choices=StatusChoices.choices, default=StatusChoices.ACTIVE)
    origin = CountryField(blank=True, verbose_name="País de Origem")
    cfop = models.CharField(max_length=4, blank=True, help_text="CFOP")
    
    photo = models.ImageField(upload_to='item_photos/', blank=True, null=True)
    brand = models.CharField(max_length=50, blank=True)
    
    # ✅ CAMPOS REINTEGRADOS
    internal_code = models.CharField(max_length=50, blank=True)
    manufacturer_code = models.CharField(max_length=50, blank=True)
    short_description = models.CharField(max_length=255, blank=True)
    long_description = models.TextField(blank=True)
    weight = models.FloatField(blank=True, null=True, help_text="Peso em kg")
    unit_of_measure = models.CharField(max_length=50, default='Peça')
    
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)
    minimum_stock_level = models.PositiveIntegerField(default=10)
    
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


class MovementType(models.Model):
    """Define um Tipo de Operação (TPO) de estoque, sua natureza e regras."""
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

class StockItem(models.Model):
    """Representa o saldo atual de um item em um local específico."""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='stock_items')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='stock_locations')
    quantity = models.IntegerField(default=0) # Permite estoque negativo temporário
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        unique_together = ('item', 'location')
    def __str__(self):
        return f"{self.item.name} @ {self.location.name} (Qty: {self.quantity})"

class StockMovement(models.Model):
    """Registra cada transação de estoque (o extrato)."""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='movements')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='location_movements')
    movement_type = models.ForeignKey(MovementType, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField() # A quantidade da operação é sempre positiva
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Preço unitário no momento da movimentação (compra ou venda)")
    movement_date = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    attachment = models.FileField(upload_to='movement_docs/', blank=True, null=True)
    
    @property
    def total_moved_value(self):
        base_quantity = self.quantity * (self.movement_type.units_per_package or 1)
        return base_quantity * self.unit_price

    def save(self, *args, **kwargs):
        if not self.pk: # Apenas na criação
            if self.movement_type.factor > 0: # Entrada
                self.unit_price = self.item.purchase_price
            else: # Saída
                self.unit_price = self.item.sale_price
        
        with transaction.atomic():
            is_new = self.pk is None
            super().save(*args, **kwargs)
            if is_new:
                stock_item, created = StockItem.objects.select_for_update().get_or_create(
                    item=self.item, location=self.location
                )
                effective_change = self.quantity * (self.movement_type.units_per_package or 1) * self.movement_type.factor
                stock_item.quantity += effective_change
                stock_item.save()

    def __str__(self):
        op_signal = '+' if self.movement_type.factor == 1 else '-'
        final_qty = self.quantity * (self.movement_type.units_per_package or 1)
        return f"{self.item.name}: {op_signal}{final_qty} em {self.movement_date.strftime('%d/%m/%Y')}"