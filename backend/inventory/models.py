# backend/inventory/models.py
from inventory.validators import validate_cnpj_format
from solo.models import SingletonModel 
from django.db import models, transaction
from django.contrib.auth.models import User, Group
from django.db.models import Sum
from django.core.exceptions import ValidationError
from simple_history.models import HistoricalRecords
from django.db.models.functions import Coalesce
import uuid
from stdnum.ean import is_valid
from django.core.validators import MinValueValidator, RegexValidator
from django_countries.fields import CountryField
from decimal import Decimal
from .utils import optimize_image
 
 
class TimeStampedModel(models.Model):
    """
    Um modelo base abstrato que fornece os campos de auditoria
    `created_at` e `updated_at`.
    """
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última Atualização")

    class Meta:
        abstract = True

class AuditMixin(models.Model):
    """
    Um mixin abstrato que adiciona campos para rastrear
    quem criou e quem atualizou um objeto.
    """
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='%(class)s_created', # Ex: 'item_created'
        verbose_name="Criado por"
    )
    last_updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='%(class)s_updated', # Ex: 'item_updated'
        verbose_name="Atualizado por"
    )
    class Meta:
        abstract = True

class AddressMixin(models.Model):
    """Mixin abstrato para campos de endereço comuns."""
    country = CountryField(default='BR', verbose_name="País")
    postal_code = models.CharField(max_length=10, blank=True, verbose_name="CEP")
    address_line_1 = models.CharField(max_length=255, blank=True, verbose_name="Endereço (Rua, Av.)")
    address_line_2 = models.CharField(max_length=100, blank=True, verbose_name="Número e Complemento")
    neighborhood = models.CharField(max_length=100, blank=True, verbose_name="Bairro")
    city = models.CharField(max_length=100, blank=True, verbose_name="Cidade")
    state = models.CharField(max_length=50, blank=True, verbose_name="Estado/Província")

    class Meta:
        abstract = True

class IsActiveMixin(models.Model):
    """Mixin abstrato que adiciona um campo 'is_active'."""
    is_active = models.BooleanField(default=True, verbose_name="Ativo?")

    class Meta:
        abstract = True

class UUIDMixin(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True

class PhysicalPropertiesMixin(models.Model):
    """
    Mixin abstrato para propriedades físicas como dimensões e peso.
    Inclui um método para calcular o volume cúbico.
    """
    height = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, 
        verbose_name="Altura (cm)"
    )
    width = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, 
        verbose_name="Largura (cm)"
    )
    depth = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, 
        verbose_name="Profundidade (cm)"
    )
    weight = models.DecimalField(
        max_digits=10, decimal_places=3, null=True, blank=True,
        verbose_name="Peso (kg)"
    )

    class Meta:
        abstract = True

    @property
    def volume(self):
        """
        Calcula e retorna o volume em centímetros cúbicos (cm³).
        Retorna 0 se alguma das dimensões não estiver definida.
        """
        if self.height and self.width and self.depth:
            # Multiplicamos e garantimos que o resultado é um Decimal
            return Decimal(self.height * self.width * self.depth)
        return Decimal('0.00')

    # Você também poderia adicionar outras propriedades úteis aqui, se necessário.
    # Ex: @property def surface_area(self): ...

# Adicione este manager e mixin no início do arquivo
class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        # Por padrão, exclui os objetos "deletados" das queries
        return super().get_queryset().filter(deleted_at__isnull=True)

    def all_with_deleted(self):
        # Método para acessar todos os objetos, incluindo os deletados
        return super().get_queryset()

class SoftDeleteMixin(models.Model):
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="Data de Exclusão")

    objects = SoftDeleteManager()
    all_objects = models.Manager() # Manager padrão para acessar tudo

    def delete(self, using=None, keep_parents=False):
        # Sobrescreve o delete para apenas marcar a data
        from django.utils import timezone
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.deleted_at = None
        self.save()

    class Meta:
        abstract = True

class BaseModel(UUIDMixin, TimeStampedModel, AuditMixin, IsActiveMixin, SoftDeleteMixin):
    """Um modelo base que inclui timestamps, auditoria e status de ativação."""
    class Meta:
        ordering = ['-created_at']
        abstract = True

# --- 1. MODELOS DE ORGANIZAÇÃO, HIERARQUIA E PERMISSÃO ---

class Branch(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, verbose_name="Descrição")
    class Meta:
        verbose_name = "Filial"
        verbose_name_plural = "Filiais"
    def __str__(self):
        return self.name

class Sector(BaseModel):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='sectors', verbose_name="Filial")
    name = models.CharField(max_length=100, verbose_name="Nome do Setor")
    description = models.TextField(blank=True, verbose_name="Descrição")
    class Meta:
        unique_together = ('branch', 'name')
        verbose_name = "Setor"
        verbose_name_plural = "Setores"
    def __str__(self):
        return f"{self.name} ({self.branch.name})"

class Location(BaseModel):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='locations', verbose_name="Filial")
    location_code = models.CharField(max_length=50, help_text="Código único para a locação dentro da filial")
    name = models.CharField(max_length=100, help_text="Nome descritivo (ex: Prateleira de Parafusos)")
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
        related_name='managed_team',
        verbose_name="Gerente Direto"
    )
    branches = models.ManyToManyField(Branch, blank=True, verbose_name="Filiais de Acesso")
    sectors = models.ManyToManyField(Sector, blank=True, verbose_name="Setores de Atuação")
    job_title = models.CharField(max_length=100, blank=True, verbose_name="Cargo")
    phone_number = models.CharField(max_length=20, blank=True, verbose_name="Telefone")
    hire_date = models.DateField(null=True, blank=True, verbose_name="Data de Contratação")
    
    # --- NOVOS CAMPOS: TEMA DE GAMIFICAÇÃO ---
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name="Foto de Perfil")

    # --- NOVOS CAMPOS: TEMA DE PRODUTIVIDADE ---
    favorited_items = models.ManyToManyField(
        'Item', 
        blank=True, 
        related_name='favorited_by',
        verbose_name="Itens Favoritos"
    )
    favorited_suppliers = models.ManyToManyField(
        'Supplier', 
        blank=True, 
        related_name='favorited_by',
        verbose_name="Fornecedores Favoritos"
    )

    # --- NOVOS CAMPOS: PREFERÊNCIAS DE EXIBIÇÃO ---
    class ThemeChoices(models.TextChoices):
        SYSTEM = 'SYSTEM', 'Padrão do Sistema'
        LIGHT = 'LIGHT', 'Claro'
        DARK = 'DARK', 'Escuro'
    
    class TableDensityChoices(models.TextChoices):
        COMFORTABLE = 'COMFORTABLE', 'Confortável'
        COMPACT = 'COMPACT', 'Compacto'

    preferred_theme = models.CharField(
        max_length=10, 
        choices=ThemeChoices.choices,
        default=ThemeChoices.SYSTEM,
        verbose_name="Tema Preferido"
    )
    default_items_per_page = models.PositiveIntegerField(
        default=25,
        validators=[MinValueValidator(10)],
        verbose_name="Itens por Página (Padrão)"
    )
    table_density = models.CharField(
        max_length=12,
        choices=TableDensityChoices.choices,
        default=TableDensityChoices.COMFORTABLE,
        verbose_name="Densidade da Tabela"
    )
    
    @property
    def is_active(self):
        return self.user.is_active

    def __str__(self):
        return self.user.username



# --- 2. MODELOS DE CATÁLOGO DE PRODUTOS ---

class Supplier(BaseModel, AddressMixin):
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
    tax_regime = models.CharField(max_length=10, choices=TaxRegime.choices, blank=True, verbose_name="Regime Tributário")
    cnpj = models.CharField(
    max_length=18, 
    blank=True, 
    verbose_name="CNPJ (se brasileiro)",
    validators=[validate_cnpj_format]  # ✅ Validador adicionado
    )
    cnpj_validation_overridden = models.BooleanField(default=False, verbose_name="Validação de CNPJ forçada")

    ie = models.CharField(max_length=18, blank=True, verbose_name="Inscrição estadual (se brasileiro)")
    tax_id = models.CharField(max_length=50, blank=True, verbose_name="ID Fiscal (se estrangeiro)")
    contact_person = models.CharField(max_length=100, blank=True, verbose_name="Pessoa de Contato")
    phone_number = models.CharField(max_length=20, blank=True, verbose_name="Telefone de Contato")
    email = models.EmailField(blank=True, verbose_name="E-mail de Contato")
    def __str__(self):
        return self.name

class CategoryGroup(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Category(BaseModel):
    group = models.ForeignKey(CategoryGroup, on_delete=models.SET_NULL, null=True, blank=True, related_name='categories')
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    class Meta:
        verbose_name_plural = "Categories"
    def __str__(self):
        return self.name

class ItemManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset()

    def active(self):
        """Retorna apenas itens com status ATIVO."""
        return self.get_queryset().filter(status=Item.StatusChoices.ACTIVE)

    def low_stock(self):
        """Retorna itens ativos com estoque abaixo do mínimo."""
        # Exemplo de como a lógica de negócio pode ser encapsulada
        return self.active().annotate(
            total_quantity=Coalesce(Sum('stock_items__quantity'), 0)
        ).filter(total_quantity__lt=models.F('minimum_stock_level'))

def validate_ean(value):
    """Verifica se o valor é um EAN-13 válido."""
    if value and not is_valid(value):
        raise ValidationError(f'"{value}" não é um código EAN válido.')

class Item(BaseModel, PhysicalPropertiesMixin):
    objects = ItemManager()
    class StatusChoices(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Ativo'
        DISCONTINUED = 'DISCONTINUED', 'Fora de Linha'
        INACTIVE = 'INACTIVE', 'Inativo'

    # Neutraliza o campo herdado is_active do IsActiveMixin
    is_active = None

    sku = models.CharField(max_length=50, unique=True)
    ean = models.CharField(
        max_length=13,
        unique=True,
        blank=True,
        null=True,
        verbose_name="EAN",
        help_text="Código de barras EAN-13",
        validators=[validate_ean]
    )
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='items')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='supplied_items')
    status = models.CharField(max_length=12, choices=StatusChoices.choices, default=StatusChoices.ACTIVE)
    origin = CountryField(blank=True, verbose_name="País de Origem")
    cfop = models.CharField(max_length=4, blank=True, help_text="CFOP")

    photo = models.ImageField(upload_to='item_photos/', blank=True, null=True)
    brand = models.CharField(max_length=50, blank=True)
    branch = models.ForeignKey(
        Branch,
        on_delete=models.PROTECT,
        related_name='items',
        verbose_name="Filial Principal do Item"
    )
    internal_code = models.CharField(max_length=50, blank=True)
    manufacturer_code = models.CharField(max_length=50, blank=True)
    short_description = models.CharField(max_length=255, blank=True)
    long_description = models.TextField(blank=True)

    warranty_days = models.IntegerField(default=0, verbose_name="Garantia (dias)")
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit_of_measure = models.CharField(max_length=20, default="UN", verbose_name="Unidade de Medida")
    minimum_stock_level = models.IntegerField(default=0)

    def delete(self, using=None, keep_parents=False):
        """
        Soft delete que só permite a exclusão se o saldo total do item for zero.
        """
        if self.total_quantity > 0:
            raise ValidationError(
                f"Não é possível excluir o item '{self.name}' pois ele ainda possui saldo em estoque ({self.total_quantity} unidades)."
            )
        
        from django.utils import timezone
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])

        # 👇 REINTRODUZA ESTA LINHA PARA A EXCLUSÃO EM CASCATA
        # self.stock_items.all_with_deleted().update(deleted_at=timezone.now())


    def restore(self):
        """
        Restaura o item.
        """
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])
        # A linha abaixo foi REMOVIDA para alinhar com a lógica de não-cascata
        # self.stock_items.update(deleted_at=None) 

    def __str__(self):
        return f"{self.name} (SKU: {self.sku})"
        
    def save(self, *args, **kwargs):
        if self.photo and not self.photo.name.endswith('.webp'):
            new_name, content = optimize_image(self.photo)
            self.photo.save(new_name, content, save=False)
        super().save(*args, **kwargs)

    @property
    def total_quantity(self):
        total = self.stock_items.aggregate(total=Sum('quantity'))['total']
        return total if total is not None else 0
        
    @property
    def is_low_stock(self):
        return self.total_quantity < self.minimum_stock_level
    
    @property
    def active(self):
        """Retorna True se o status do item for 'ATIVO'."""
        return self.status == self.StatusChoices.ACTIVE

    

class MovementType(BaseModel):
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
        max_length=20,
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

class StockItem(BaseModel):
    """
    Representa o saldo atual de um item em um local específico.
    Inclui suporte a soft delete para manter consistência com Item.
    """
    item = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,  # Protege histórico: não permite apagar Item se houver estoque
        related_name='stock_items'
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.PROTECT,  # Mesma ideia para a localização
        related_name='stock_items'
    )
    quantity = models.IntegerField(default=0)  # Permite estoque negativo temporário

    class Meta:
        unique_together = ('item', 'location')
        verbose_name = "Saldo de Estoque"
        verbose_name_plural = "Saldos de Estoque"

    def __str__(self):
        return f"{self.item.name} @ {self.location.name} (Qty: {self.quantity})"

    def delete(self, using=None, keep_parents=False):
        """
        Soft delete customizado: marca como deletado em vez de remover.
        """
        from django.utils import timezone
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        """
        Restaura o registro do estoque.
        """
        self.deleted_at = None
        self.save()

class StockMovement(TimeStampedModel):
    """Registra cada transação de estoque (o extrato)."""
    item = models.ForeignKey(Item, on_delete=models.PROTECT, related_name='movements')
    location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name='location_movements')
    movement_type = models.ForeignKey(MovementType, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField() # A quantidade da operação é sempre positiva
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Preço unitário no momento da movimentação (compra ou venda)")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    attachment = models.FileField(upload_to='movement_docs/', blank=True, null=True)

    def get_effective_change(self):
        """
        Retorna a quantidade real que afeta o estoque,
        considerando o fator do tipo de movimento (entrada/saída)
        e as unidades por pacote.
        """
        if not self.movement_type:
            return 0
        # Utiliza o método helper do MovementType
        return self.movement_type.get_effective_quantity(self.quantity)
    
    @property
    def total_moved_value(self):
        # Agora usa o método centralizado
        base_quantity = self.quantity * (self.movement_type.units_per_package or 1)
        return base_quantity * self.unit_price

    def save(self, *args, **kwargs):
        if not self.pk: # Apenas na criação
            price_to_check = self.item.purchase_price if self.movement_type.is_inbound else self.item.sale_price

            if price_to_check is None or price_to_check <= 0:
                raise ValidationError(
                    f"Não é possível criar o movimento. O item '{self.item.name}' "
                    f"não possui um preço de {'compra' if self.movement_type.is_inbound else 'venda'} válido."
                )

            # Atribua o preço validado UMA VEZ. O bloco if/else foi removido.
            self.unit_price = price_to_check

        with transaction.atomic():
            is_new = self.pk is None
            super().save(*args, **kwargs)
            if is_new:
                stock_item, created = StockItem.objects.select_for_update().get_or_create(
                    item=self.item, location=self.location
                )
                # Lógica de cálculo simplificada e sem repetição
                stock_item.quantity += self.get_effective_change() 
                stock_item.save()

    def __str__(self):
        op_signal = '+' if self.movement_type.is_inbound else '-'
        effective_qty = abs(self.get_effective_change())
        # ATUALIZE AQUI PARA USAR O CAMPO DO MIXIN
        return f"{self.item.name}: {op_signal}{effective_qty} em {self.created_at.strftime('%d/%m/%Y')}"
    
class SystemSettings(SingletonModel):
    """
    Um modelo singleton para guardar configurações globais do sistema,
    editáveis através do painel de administração.
    """
    default_branch = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Filial Padrão para Novos Usuários"
    )
    default_sector = models.ForeignKey(
        Sector,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Setor Padrão para Novos Usuários"
    )

    class Meta:
        verbose_name = "Configurações do Sistema"

    def __str__(self):
        return "Configurações do Sistema"