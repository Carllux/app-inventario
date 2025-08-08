# backend/inventory/admin.py

from django.contrib import admin
from .models import Supplier, Category, Item, Location, StockItem, StockMovement

# --- Inlines (para visualização em páginas de modelos relacionados) ---

class StockItemInline(admin.TabularInline):
    """Permite visualizar e editar o estoque de um item dentro da página de Localização."""
    model = StockItem
    extra = 1  # Quantos campos extras de entrada de estoque mostrar

# --- ModelAdmins (para customizar a exibição no painel) ---

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
    list_display = ('name', 'warehouse', 'shelf')
    list_filter = ('warehouse',)
    search_fields = ('name', 'warehouse')
    inlines = [StockItemInline] # Mostra os itens de estoque nesta localização

# Mantenha os outros imports e as outras classes Admin que você já tem

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    # --- Configurações para a lista de exibição ---
    list_display = ('sku', 'name', 'category', 'total_quantity', 'sale_price', 'status', 'is_low_stock')
    list_filter = ('status', 'category', 'supplier')
    search_fields = ('name', 'sku', 'brand', 'short_description')
    ordering = ('name',)
    
    # --- Configurações para o formulário de edição/criação ---
    readonly_fields = ('total_quantity', 'is_low_stock', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Informações Principais', {
            'fields': ('name', 'sku', 'status', 'photo', 'short_description')
        }),
        ('Classificação', {
            'fields': ('category', 'supplier', 'brand')
        }),
        ('Preços e Estoque', {
            'fields': ('purchase_price', 'sale_price', 'minimum_stock_level')
        }),
        ('Detalhes Adicionais', {
            'fields': ('long_description', 'unit_of_measure', 'weight', 'origin'),
            'classes': ('collapse',) 
        }),
    )
    
    # Exibe e permite editar o estoque diretamente na página do item
    inlines = [StockItemInline]

    # --- MÉTODO ESSENCIAL PARA RESOLVER O ERRO ---
    def save_model(self, request, obj, form, change):
        """
        Este método é chamado quando um item é salvo pelo admin.
        Ele garante que o 'owner' seja definido como o usuário logado
        ao CRIAR um novo item.
        """
        if not obj.pk:  # Verifica se o objeto é novo
            obj.owner = request.user
        super().save_model(request, obj, form, change)

@admin.register(StockItem)
class StockItemAdmin(admin.ModelAdmin):
    list_display = ('item', 'location', 'quantity', 'updated_at')
    list_filter = ('location',)
    search_fields = ('item__name', 'location__name')
    # Torna o campo de quantidade apenas leitura para forçar o uso de movimentações
    readonly_fields = ('quantity',) 

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('item', 'location', 'quantity_change', 'movement_type', 'movement_date', 'user')
    list_filter = ('movement_type', 'location', 'movement_date')
    search_fields = ('item__name', 'notes', 'user__username')
    date_hierarchy = 'movement_date'
    autocomplete_fields = ['item', 'location', 'user'] # Melhora a busca de FKeys