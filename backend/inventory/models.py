# backend/inventory/models.py

from django.db import models, transaction
from django.contrib.auth.models import User, Group
from django.db.models import Sum
from django.core.exceptions import ValidationError
from simple_history.models import HistoricalRecords
from stdnum.ean import is_valid
from django.core.validators import MinValueValidator, RegexValidator
from django_countries.fields import CountryField
from PIL import Image as PilImage
from io import BytesIO
from django.core.files.base import ContentFile
import os

class TimeStampedModel(models.Model):
    """
    Um modelo base abstrato que fornece os campos de auditoria
    `created_at` e `updated_at`.
    """
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última Atualização")

    class Meta:
        abstract = True


# --- 1. MODELOS DE ORGANIZAÇÃO, HIERARQUIA E PERMISSÃO ---

class Branch(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    class Meta:
        verbose_name = "Filial"
        verbose_name_plural = "Filiais"
    def __str__(self):
        return self.name

class Sector(TimeStampedModel):
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

class Location(TimeStampedModel):
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

class UserProfile(TimeStampedModel):
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

class Supplier(TimeStampedModel):
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
    postal_code = models.CharField(max_length=10, blank=True, verbose_name="CEP")
    address_line_1 = models.CharField(max_length=255, blank=True, verbose_name="Endereço (Rua, Av.)")
    address_line_2 = models.CharField(max_length=100, blank=True, verbose_name="Número e Complemento")
    neighborhood = models.CharField(max_length=100, blank=True, verbose_name="Bairro")
    city = models.CharField(max_length=100, blank=True, verbose_name="Cidade")
    state = models.CharField(max_length=50, blank=True, verbose_name="Estado/Província")
    contact_person = models.CharField(max_length=100, blank=True, verbose_name="Pessoa de Contato")
    phone_number = models.CharField(max_length=20, blank=True, verbose_name="Telefone de Contato")
    email = models.EmailField(blank=True, verbose_name="E-mail de Contato")
    def __str__(self):
        return self.name

class Category(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, verbose_name="Ativo?")
    class Meta:
        verbose_name_plural = "Categories"
    def __str__(self):
        return self.name


def validate_ean(value):
    """Verifica se o valor é um EAN-13 válido."""
    if value and not is_valid(value):
        raise ValidationError(f'"{value}" não é um código EAN válido.')

class Item(TimeStampedModel):
    class StatusChoices(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Ativo'
        DISCONTINUED = 'DISCONTINUED', 'Fora de Linha'
        INACTIVE = 'INACTIVE', 'Inativo'
    

    owner = models.ForeignKey(User, on_delete=models.CASCADE, help_text="Usuário que cadastrou o item.")
    sku = models.CharField(max_length=50, unique=True)
    ean = models.CharField(
        max_length=13, 
        unique=True, 
        blank=True, 
        null=True,
        verbose_name="EAN",
        help_text="Código de barras EAN-13",
        validators=[validate_ean] # ✅ 4. CONECTE A FUNÇÃO AQUI
    )
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
    # --- Dimensões e Garantia ---
    height = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Altura (cm)")
    width = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Largura (cm)")
    depth = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="Profundidade (cm)")

    warranty_days = models.IntegerField(default=0, verbose_name="Prazo de Garantia (dias)")
    warranty_conditions = models.TextField(blank=True, verbose_name="Condições da Garantia")



    unit_of_measure = models.CharField(max_length=50, default='Peça')
    
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)
    minimum_stock_level = models.PositiveIntegerField(default=10)
    

    def save(self, *args, **kwargs):
        # Verifica se uma nova foto foi enviada
        if self.photo:
            # 'self.pk is None' checa se é um objeto novo.
            # Se não for novo, checamos se a foto foi alterada.
            is_new = self.pk is None
            if not is_new:
                try:
                    old_instance = Item.objects.get(pk=self.pk)
                    if old_instance.photo == self.photo:
                        # Se a foto for a mesma, não faz nada e salva normalmente
                        super().save(*args, **kwargs)
                        return
                except Item.DoesNotExist:
                    pass # Continua se a instância antiga não for encontrada

            # --- INÍCIO DA LÓGICA DE OTIMIZAÇÃO ---
            pil_image = PilImage.open(self.photo)

            # 1. Redimensionar se for muito grande (ex: max 1024x1024)
            max_width, max_height = 1024, 1024
            if pil_image.width > max_width or pil_image.height > max_height:
                pil_image.thumbnail((max_width, max_height))

            # 2. Salvar em um buffer de memória no formato WebP com compressão
            buffer = BytesIO()
            pil_image.save(buffer, format='WEBP', quality=85)
            buffer.seek(0)

            # 3. Criar um novo nome de arquivo com a extensão .webp
            file_name, _ = os.path.splitext(self.photo.name)
            new_file_name = f"{file_name}.webp"

            # 4. Substitui o arquivo original pelo arquivo otimizado
            self.photo.save(
                new_file_name,
                ContentFile(buffer.read()),
                save=False # Adia o 'save' do modelo para o final
            )

        # Chama o método .save() original para salvar o modelo no banco
        super().save(*args, **kwargs)
        
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

    class MovementCategory(models.TextChoices):
        INBOUND = 'IN', 'Entrada'
        OUTBOUND = 'OUT', 'Saída'
        ADJUSTMENT = 'ADJ', 'Ajuste'
        TRANSFER = 'TRF', 'Transferência'
        PRODUCTION = 'PROD', 'Produção'
        QUALITY = 'QUAL', 'Controle de Qualidade'

    class DocumentType(models.TextChoices):
        INVOICE = 'NF', 'Nota Fiscal'
        ORDER = 'OS', 'Ordem de Serviço'
        TICKET = 'TKT', 'Ticket'
        INTERNAL = 'INT', 'Documento Interno'
        NONE = 'N/A', 'Não Aplicável'

    # Campos Básicos
    code = models.CharField(
        max_length=10,
        unique=True,
        validators=[RegexValidator(r'^[A-Z0-9_]+$', 'Use apenas letras maiúsculas, números e underscores')],
        help_text="Código único para referência rápida (ex: ENTRADA, DEVSAIDA)"
    )
    name = models.CharField(
        max_length=100,
        unique=True,
        validators=[RegexValidator(r'^[a-zA-Z0-9 áéíóúÁÉÍÓÚãõâêîôûÃÕÂÊÎÔÛ]+$')],
        help_text="Nome descritivo do tipo de movimento"
    )
    factor = models.IntegerField(
        choices=FactorChoices.choices,
        help_text="Define se a operação é de entrada ou saída no estoque"
    )
    units_per_package = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="Para operações com pacotes/caixas, define o fator multiplicador"
    )

    # Categorização e Controle
    category = models.CharField(
        max_length=5,
        choices=MovementCategory.choices,
        default=MovementCategory.INBOUND,
        help_text="Categoria operacional do movimento"
    )
    document_type = models.CharField(
        max_length=5,
        choices=DocumentType.choices,
        default=DocumentType.INVOICE,
        help_text="Tipo de documento associado a este movimento"
    )
    parent_type = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='child_types',
        help_text="Tipo de movimento pai para herança de propriedades"
    )

    # Configurações de Processo
    requires_approval = models.BooleanField(
        default=False,
        help_text="Movimentos deste tipo exigem aprovação prévia"
    )
    affects_finance = models.BooleanField(
        default=True,
        help_text="Este tipo de movimento impacta no cálculo financeiro?"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Tipos inativos não aparecerão em novas movimentações"
    )
    is_locked = models.BooleanField(
        default=False,
        help_text="Tipos bloqueados não podem ser editados"
    )

    # Relacionamentos
    allowed_for_groups = models.ManyToManyField(
        Group,
        blank=True,
        help_text="Grupos com permissão para usar este tipo de movimento"
    )

    # Metadados
    description = models.TextField(
        blank=True,
        help_text="Descrição detalhada das regras e uso deste tipo"
    )
    history = HistoricalRecords(
        excluded_fields=['units_per_package'],
        help_text="Histórico de alterações"
    )

    class Meta:
        verbose_name = "Tipo de Movimento"
        verbose_name_plural = "Tipos de Movimento"
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['category']),
            models.Index(fields=['code']),
        ]
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.code} - {self.name}"

    def clean(self):
        """Validações complexas antes de salvar"""
        errors = {}
        
        # Valida unidades por pacote
        if self.units_per_package is not None and self.units_per_package < 1:
            errors['units_per_package'] = "Deve ser ≥ 1 quando especificado"
        
        # Valida consistência entre factor e units_per_package
        if self.factor == self.FactorChoices.ADD and not self.units_per_package:
            self.units_per_package = 1  # Valor padrão para entradas
        
        # Valida hierarquia
        if self.parent_type and self.parent_type.pk == self.pk:
            errors['parent_type'] = "Um tipo não pode ser pai de si mesmo"
        
        if errors:
            raise ValidationError(errors)

    @property
    def is_inbound(self):
        """Retorna True se for um movimento de entrada"""
        return self.factor == self.FactorChoices.ADD

    @property
    def is_outbound(self):
        """Retorna True se for um movimento de saída"""
        return not self.is_inbound

    def get_effective_quantity(self, input_quantity):
        """
        Calcula a quantidade efetiva que será adicionada/subtraída do estoque
        considerando o fator e as unidades por pacote
        """
        multiplier = self.units_per_package or 1
        return input_quantity * multiplier * self.factor

    def save(self, *args, **kwargs):
        """Garante validações e comportamentos padrão ao salvar"""
        self.full_clean()  # Executa todas as validações
        super().save(*args, **kwargs)
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
    def clean(self):
        if self.units_per_package and self.units_per_package < 1:
            raise ValidationError("Unidades por pacote deve ser ≥ 1")
        if self.factor == self.FactorChoices.ADD and self.units_per_package is None:
            self.units_per_package = 1  # Valor padrão para entradas

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