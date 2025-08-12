# backend/inventory/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
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
    class Meta:
        model = Supplier
        fields = ['id', 'name']

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

    class Meta:
        model = Item
        # Lista explícita e completa de campos
        fields = [
            'id', 'sku', 'name', 'status', 'category', 'supplier', 'photo', 
            'brand', 'purchase_price', 'sale_price', 'unit_of_measure', 
            'origin', 'cfop', 'minimum_stock_level', 'total_quantity', 'is_low_stock'
        ]

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

class StockMovementSerializer(serializers.ModelSerializer):
    # Garante que campos de relacionamento sejam apenas IDs na escrita (criação)
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all())
    location = serializers.PrimaryKeyRelatedField(queryset=Location.objects.all())
    movement_type = serializers.PrimaryKeyRelatedField(queryset=MovementType.objects.all())

    class Meta:
        model = StockMovement
        fields = [
            'id', 'item', 'location', 'movement_type', 'quantity', 'notes',
            'user', 'movement_date', 'total_moved_value'
        ]
        # O usuário e a data são definidos pelo backend, portanto, apenas leitura.
        read_only_fields = ['user', 'movement_date', 'total_moved_value']