# backend/inventory/serializers.py

from rest_framework import serializers
from .models import Item, Category, Supplier, Location, StockItem, StockMovement, MovementType

# --- Serializadores de Suporte (para exibição em outros modelos) ---

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name']

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'name', 'warehouse']

class MovementTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovementType
        # Incluímos todos os campos, pois o frontend usará a lógica do 'factor' e 'units_per_package'
        fields = ['id', 'name', 'factor', 'units_per_package', 'description']

# --- Serializador Principal de Itens (para listagem e detalhes) ---

class ItemSerializer(serializers.ModelSerializer):
    # Usando serializadores aninhados para exibir mais do que apenas o ID
    category = CategorySerializer(read_only=True)
    supplier = SupplierSerializer(read_only=True)
    
    # Expondo as propriedades do modelo como campos de apenas leitura
    total_quantity = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()

    class Meta:
        model = Item
        # Listamos explicitamente os campos que a API deve expor
        fields = [
            'id', 'sku', 'name', 'status', 'category', 'supplier',
            'photo', 'brand', 'short_description', 'purchase_price',
            'sale_price', 'total_quantity', 'is_low_stock', 'minimum_stock_level',
            'created_at', 'updated_at'
        ]

# --- Serializador para o Estoque por Local ---

class StockItemSerializer(serializers.ModelSerializer):
    # Aninhamos a informação do local para ser mais útil no frontend
    location = LocationSerializer(read_only=True)

    class Meta:
        model = StockItem
        fields = ['id', 'location', 'quantity', 'updated_at']


# --- Serializador para CRIAR Novas Movimentações ---

class StockMovementSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = StockMovement
        # Usamos 'fields' para sermos explícitos sobre o que o frontend pode enviar
        fields = [
            'id', 'item', 'location', 'movement_type', 'quantity', 
            'notes', 'user', 'movement_date'
        ]
        read_only_fields = ['user', 'movement_date']