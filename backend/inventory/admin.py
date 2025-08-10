# backend/inventory/admin.py

from django.contrib import admin
from .models import Supplier, Category, Item, Location, StockItem, StockMovement, MovementType

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'phone_number', 'email')
    search_fields = ('name', 'contact_person')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    # CORREÇÃO: 'shelf' foi removido e os novos campos foram adicionados.
    list_display = ('name', 'location_code', 'location_type', 'warehouse', 'is_active')
    list_filter = ('warehouse', 'location_type', 'is_active')
    search_fields = ('name', 'warehouse', 'location_code')

# ✅ NOVO ADMIN: Registra o modelo MovementType para que possamos gerenciá-lo.
@admin.register(MovementType)
class MovementTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'factor', 'units_per_package', 'is_active')
    list_filter = ('factor', 'is_active')

class StockItemInline(admin.TabularInline):
    model = StockItem
    extra = 0 # Não mostra formulários de adição vazios por padrão.
    readonly_fields = ('quantity', 'updated_at') # O estoque só pode ser alterado via movimentação.
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False # Impede a adição de estoque diretamente na tabela de Item.

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('sku', 'name', 'category', 'total_quantity', 'sale_price', 'status', 'is_low_stock')
    list_filter = ('status', 'category', 'supplier')
    search_fields = ('name', 'sku', 'brand')
    readonly_fields = ('total_quantity', 'is_low_stock', 'created_at', 'updated_at')
    inlines = [StockItemInline]

    fieldsets = (
        ('Informações Principais', {'fields': ('name', 'sku', 'status', 'photo')}),
        ('Classificação', {'fields': ('category', 'supplier', 'brand')}),
        ('Preços', {'fields': ('purchase_price', 'sale_price')}),
        ('Controle de Estoque', {'fields': ('unit_of_measure', 'minimum_stock_level')}),
    )

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.owner = request.user
        super().save_model(request, obj, form, change)

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    # CORREÇÃO: Trocamos 'quantity_change' por 'quantity', conforme o novo modelo.
    list_display = ('item', 'location', 'quantity', 'movement_type', 'movement_date', 'user')
    list_filter = ('movement_type', 'location', 'movement_date')
    search_fields = ('item__name', 'notes', 'user__username')
    date_hierarchy = 'movement_date'
    autocomplete_fields = ['item', 'location', 'user']

    def save_model(self, request, obj, form, change):
        # Garante que o usuário logado no admin seja associado à movimentação
        if not obj.pk:
            obj.user = request.user
        super().save_model(request, obj, form, change)

# O registro do StockItem pode ser removido se você preferir gerenciá-lo
# apenas através dos inlines nos modelos Item e Location. 
# Manteremos por enquanto para uma visão completa.
@admin.register(StockItem)
class StockItemAdmin(admin.ModelAdmin):
    list_display = ('item', 'location', 'quantity', 'updated_at')
    list_filter = ('location',)
    search_fields = ('item__name', 'location__name')
    autocomplete_fields = ['item', 'location']
    # Torna o campo de quantidade apenas leitura para forçar o uso de movimentações.
    readonly_fields = ('quantity',)