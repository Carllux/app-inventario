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
    user = serializers.StringRelatedField(read_only=True)
    total_moved_value = serializers.ReadOnlyField()

    class Meta:
        model = StockMovement
        fields = [
            'id', 'item', 'location', 'movement_type', 'quantity', 'notes',
            'user', 'movement_date', 'unit_price', 'total_moved_value'
        ]
        read_only_fields = ['user', 'movement_date', 'unit_price', 'total_moved_value']

    def validate(self, data):
        # Validações customizadas
        if data['quantity'] <= 0:
            raise serializers.ValidationError(
                {"quantity": "A quantidade deve ser maior que zero."}
            )
        
        movement_type = data['movement_type']
        if movement_type.factor < 0:
            item = data['item']
            location = data['location']
            quantity_to_remove = data['quantity'] * (movement_type.units_per_package or 1)
            
            stock_item = StockItem.objects.filter(item=item, location=location).first()
            
            if not stock_item or stock_item.quantity < quantity_to_remove:
                current_stock = stock_item.quantity if stock_item else 0
                raise serializers.ValidationError(
                    f"Estoque insuficiente. Saldo atual: {current_stock}, Saída solicitada: {quantity_to_remove}"
                )
        return data

        def create(self, validated_data):
            # A lógica de criação agora vive aqui.
            validated_data['user'] = self.context['request'].user
            
            movement = StockMovement(**validated_data)
            # O método .save() do modelo será chamado aqui, com toda a sua lógica.
            movement.save() 
            
            return movement
    
class ItemCreateUpdateSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Item
        # Lista de campos que o frontend poderá ENVIAR
        fields = [
            'sku', 'name', 'category', 'supplier', 'status', 'brand',
            'purchase_price', 'sale_price', 'unit_of_measure',
            'origin', 'cfop', 'minimum_stock_level', 'owner',
            'internal_code', 'manufacturer_code', 'short_description', 'long_description',
            'weight', 'photo'
        ]
        # O owner será definido na view, não enviado pelo frontend
        read_only_fields = ['owner']