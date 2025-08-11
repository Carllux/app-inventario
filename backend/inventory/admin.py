# backend/inventory/admin.py

from django.contrib import admin
from .models import (
    Supplier, Category, Item, Location, 
    StockItem, StockMovement, MovementType
)

# A classe 'Inline' permite editar modelos relacionados na mesma página.
# Aqui, o estoque (StockItem) é exibido dentro da página do Item.
class StockItemInline(admin.TabularInline):
    model = StockItem
    extra = 0  # Não mostra formulários extras por padrão
    readonly_fields = ('location', 'quantity', 'updated_at')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        # Impede a adição de estoque diretamente aqui, forçando o uso de movimentações.
        return False

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
    list_display = ('name', 'location_code', 'location_type', 'warehouse', 'is_active')
    list_filter = ('warehouse', 'location_type', 'is_active')
    search_fields = ('name', 'warehouse', 'location_code')

@admin.register(MovementType)
class MovementTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'factor', 'units_per_package', 'is_active')
    list_filter = ('factor', 'is_active')
    search_fields = ('name',)

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('sku', 'name', 'category', 'total_quantity', 'sale_price', 'status', 'is_low_stock')
    list_filter = ('status', 'category', 'supplier')
    search_fields = ('name', 'sku', 'brand')
    readonly_fields = ('total_quantity', 'is_low_stock', 'created_at', 'updated_at')
    autocomplete_fields = ['category', 'supplier']
    inlines = [StockItemInline]

    fieldsets = (
        ('Informações Principais', {
            'fields': ('name', 'sku', 'status', 'photo')
        }),
        ('Classificação', {
            'fields': ('category', 'supplier', 'brand')
        }),
        ('Preços', {
            'fields': ('purchase_price', 'sale_price')
        }),
        ('Controle de Estoque', {
            'fields': ('unit_of_measure', 'minimum_stock_level')
        }),
        ('Detalhes Adicionais', {
            'fields': ('short_description', 'long_description'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.owner = request.user
        super().save_model(request, obj, form, change)

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('item', 'location', 'movement_type', 'quantity', 'movement_date', 'user')
    list_filter = ('movement_type', 'location', 'movement_date')
    search_fields = ('item__name', 'notes', 'user__username')
    date_hierarchy = 'movement_date'
    autocomplete_fields = ['item', 'location', 'user']

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.user = request.user
        super().save_model(request, obj, form, change)

# Opcional: Registrar StockItem para uma visão direta, se desejado.
@admin.register(StockItem)
class StockItemAdmin(admin.ModelAdmin):
    list_display = ('item', 'location', 'quantity', 'updated_at')
    list_filter = ('location',)
    search_fields = ('item__name', 'location__name')
    autocomplete_fields = ['item', 'location']
    readonly_fields = ('quantity',)