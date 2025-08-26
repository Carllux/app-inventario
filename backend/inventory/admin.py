# backend/inventory/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from solo.admin import SingletonModelAdmin  # type: ignore

# Importamos apenas os modelos do NOSSO app 'inventory'
from .models import (
    Branch, CategoryGroup, Sector, UserProfile,
    Supplier, Category, Item, Location, 
    StockItem, StockMovement, MovementType, SystemSettings 
)


# --- INLINES ---

class UserProfileInline(admin.StackedInline):
    """Permite editar o UserProfile diretamente na página do User."""
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Perfil do Usuário (Filiais e Setores)'
    # Melhora a performance de dropdowns com muitos itens
    autocomplete_fields = ['branches', 'sectors']

class StockItemInline(admin.TabularInline):
    """Exibe o saldo de estoque de um item em diferentes locais."""
    model = StockItem
    extra = 0
    readonly_fields = ('location', 'quantity', 'updated_at')
    can_delete = False
    def has_add_permission(self, request, obj=None):
        return False

class BaseModelAdmin(admin.ModelAdmin):
    """ModelAdmin base para integrar com SoftDeleteMixin e BaseModel."""
    actions = ['restore_selected', 'soft_delete_selected']

    def get_queryset(self, request):
        return self.model.all_objects.all()

    def get_list_display(self, request):
        # Adiciona 'deleted_at' e 'is_active' para fácil visualização
        return list(self.list_display) + ['is_active', 'deleted_at']

    @admin.action(description='Restaurar selecionados')
    def restore_selected(self, request, queryset):
        for obj in queryset:
            obj.restore()

    @admin.action(description='Deletar (arquivar) selecionados')
    def soft_delete_selected(self, request, queryset):
        for obj in queryset:
            obj.delete()

# --- ADMINS CUSTOMIZADOS ---

class CustomUserAdmin(BaseUserAdmin):
    """Estende o admin padrão do User para incluir o UserProfile."""
    inlines = (UserProfileInline,)

    def get_inline_instances(self, request, obj=None):
        if not obj:
            return list()
        return super().get_inline_instances(request, obj)

# --- REGISTRO DOS MODELOS ---

# Desregistramos o User admin padrão e registramos o nosso
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

@admin.register(Branch)
class BranchAdmin(BaseModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Sector)
class SectorAdmin(BaseModelAdmin):
    list_display = ('name', 'branch')
    list_filter = ('branch',)
    search_fields = ('name', 'branch__name')
    autocomplete_fields = ['branch']

@admin.register(Location)
class LocationAdmin(BaseModelAdmin):
    list_display = ('name', 'location_code', 'branch')
    list_filter = ('branch', )
    search_fields = ('name', 'location_code', 'branch__name')
    autocomplete_fields = ['branch']

@admin.register(Supplier)
class SupplierAdmin(BaseModelAdmin):
    list_display = ('name', 'country', 'city', 'ie')
    list_filter = ('country', 'tax_regime')
    search_fields = ('name', 'cnpj', 'tax_id', 'ie')

@admin.register(CategoryGroup)
class CategoryGroupAdmin(BaseModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(Category)
class CategoryAdmin(BaseModelAdmin):
    # ✅ 3. Melhore o admin de Categoria para mostrar o grupo
    list_display = ('name', 'group', 'description')
    list_filter = ('group',)
    search_fields = ('name',)
    autocomplete_fields = ['group'] # Facilita a seleção do grupo

@admin.register(MovementType)
class MovementTypeAdmin(BaseModelAdmin):
    list_display = ('name', 'factor', 'units_per_package')
    list_filter = ('factor',)

@admin.register(Item)
class ItemAdmin(BaseModelAdmin):
    list_display = ('sku', 'name', 'category', 'total_quantity', 'sale_price', 'status', 'is_low_stock')
    list_filter = ('status', 'category', 'supplier')
    search_fields = ('name', 'sku', 'brand')
    readonly_fields = ('total_quantity', 'is_low_stock', 'created_at', 'updated_at')
    autocomplete_fields = ['category', 'supplier']
    inlines = [StockItemInline]
    fieldsets = (
        ('Informações Principais', {'fields': ('created_by', 'name', 'sku', 'status', 'photo')}),
        ('Classificação', {'fields': ('category', 'supplier', 'brand')}),
        ('Detalhes Fiscais e Origem', {'fields': ('origin', 'cfop')}),
        ('Preços', {'fields': ('purchase_price', 'sale_price')}),
        ('Controle de Estoque', {'fields': ('unit_of_measure', 'minimum_stock_level')}),
    )
    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    # ... (Sua classe StockMovementAdmin também estava ótima)
    list_display = ('item', 'location', 'quantity', 'movement_type', 'created_at', 'user')
    list_filter = ('movement_type', 'location', 'created_at')
    search_fields = ('item__name', 'notes', 'user__username')
    date_hierarchy = 'created_at'
    autocomplete_fields = ['item', 'location', 'user']
    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.user = request.user
        super().save_model(request, obj, form, change)

# O registro de StockItem não é estritamente necessário se gerenciado via inlines,
# mas o manteremos para uma visão direta e completa dos saldos.
@admin.register(StockItem)
class StockItemAdmin(admin.ModelAdmin):
    list_display = ('item', 'location', 'quantity', 'updated_at')
    list_filter = ('location',)
    search_fields = ('item__name', 'location__name')
    autocomplete_fields = ['item', 'location']
    readonly_fields = ('quantity',)

@admin.register(SystemSettings)
class SystemSettingsAdmin(SingletonModelAdmin):
    fieldsets = (
        ('Configurações Padrão', {
            'fields': ('default_branch', 'default_sector')
        }),
    )
    autocomplete_fields = ['default_branch', 'default_sector']
    