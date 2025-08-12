# backend/inventory/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from django_countries.serializer_fields import CountryField
from .models import (
    Branch, Sector, UserProfile,
    Supplier, Category, Item, Location, 
    StockItem, StockMovement, MovementType
)

# --- Serializadores de Organização e Permissão ---

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name']

class SectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sector
        fields = ['id', 'name']

class UserProfileSerializer(serializers.ModelSerializer):
    # Usamos serializadores aninhados para mostrar nomes em vez de IDs
    branches = BranchSerializer(many=True, read_only=True)
    sectors = SectorSerializer(many=True, read_only=True)

    class Meta:
        model = UserProfile
        fields = ['job_title', 'phone_number', 'hire_date', 'branches', 'sectors']

class UserSerializer(serializers.ModelSerializer):
    # Aninha o perfil dentro dos dados do usuário
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'profile']


# --- Serializadores de Catálogo e Estoque ---

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class SupplierSerializer(serializers.ModelSerializer):
    country = CountryField(name_only=True) # ✅ GARANTA QUE ESTA LINHA EXISTA

    class Meta:
        model = Supplier
        fields = ['id', 'name', 'country', 'is_active']

class LocationSerializer(serializers.ModelSerializer):
    # Exibe o nome da filial em vez de apenas o ID
    branch = serializers.StringRelatedField()

    class Meta:
        model = Location
        fields = ['id', 'name', 'location_code', 'branch']

class ItemSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    supplier = SupplierSerializer(read_only=True)
    total_quantity = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    origin = CountryField(name_only=True, read_only=True) # read_only porque não é preenchido na criação principal


    class Meta:
        model = Item
        # Lista explícita e completa de campos
        fields = [
            'id', 'sku', 'name', 'status', 'category', 'supplier', 'photo', 
            'brand', 'purchase_price', 'sale_price', 'unit_of_measure', 
            'origin', 'cfop', 'minimum_stock_level', 'total_quantity', 'is_low_stock', 'owner'
        ]
        extra_kwargs = {
            'owner': {'read_only': True}  # Normalmente definido automaticamente
        }

class StockItemSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)

    class Meta:
        model = StockItem
        fields = ['id', 'location', 'quantity', 'updated_at']

# --- Serializadores de Movimentação (TPOs e Movimentos) ---

class MovementTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovementType
        fields = ['id', 'name', 'factor', 'units_per_package']

# Atualize o StockMovementSerializer para incluir validações
# backend/inventory/serializers.py

class StockMovementSerializer(serializers.ModelSerializer):
    # 'user' e 'total_moved_value' são apenas para leitura (serão gerados pelo backend)
    user = serializers.StringRelatedField(read_only=True)
    total_moved_value = serializers.ReadOnlyField() # Garante que é apenas leitura

    class Meta:
        model = StockMovement
        fields = [
            'id', 'item', 'location', 'movement_type', 'quantity', 'notes',
            'user', 'movement_date', 'unit_price', 'total_moved_value', 'attachment'
        ]
        # 'unit_price' também será definido no backend, então o tornamos read_only
        read_only_fields = ['user', 'movement_date', 'total_moved_value', 'unit_price']

    def validate(self, data):
        """Validações customizadas para movimentações"""
        # 1. Validação de quantidade
        if data['quantity'] <= 0:
            raise serializers.ValidationError({"quantity": "A quantidade deve ser maior que zero."})
        
        # 2. Validação de estoque para saídas
        movement_type = data['movement_type']
        if movement_type.factor < 0:
            item = data['item']
            location = data['location']
            
            # Calcula a quantidade real da saída, considerando pacotes
            quantity_to_remove = data['quantity'] * (movement_type.units_per_package or 1)

            try:
                stock_item = StockItem.objects.get(item=item, location=location)
                if stock_item.quantity < quantity_to_remove:
                    raise serializers.ValidationError(f"Estoque insuficiente. Saldo atual: {stock_item.quantity}, Saída solicitada: {quantity_to_remove}")
            except StockItem.DoesNotExist:
                raise serializers.ValidationError("Estoque insuficiente. Não há registro de estoque para este item neste local.")
        
        return data