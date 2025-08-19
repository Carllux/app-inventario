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
    country = CountryField(name_only=True) 

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
    """Serializador de LEITURA: exibe dados aninhados e calculados."""
    category = CategorySerializer(read_only=True)
    supplier = SupplierSerializer(read_only=True)
    branch = BranchSerializer(read_only=True)
    origin = CountryField(name_only=True, read_only=True)
    total_quantity = serializers.IntegerField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    active = serializers.BooleanField(source='is_active', read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Item
        fields = [
            'id', 'sku', 'name', 'status', 'active', 'branch', 'category', 'supplier', 
            'photo', 'brand', 'sale_price', 'unit_of_measure', 'short_description',
            'total_quantity', 'is_low_stock', 'created_by', 'origin'
        ]

class ItemCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializador de ESCRITA: espera IDs (PKs) para relações."""
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    
    # Django-countries lida com a conversão do código do país (ex: 'BR')
    origin = CountryField(name_only=True, required=False)
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all())
    class Meta:
        model = Item
        # Lista de campos que o frontend pode ENVIAR
        fields = [
            'sku', 'name', 'branch', 'category', 'supplier', 'status', 'brand',
            'purchase_price', 'sale_price', 'unit_of_measure',
            'origin', 'cfop', 'minimum_stock_level',
            'internal_code', 'manufacturer_code', 'short_description', 'long_description',
            'height', 'width', 'depth', 'weight', 'photo', 'created_by'
        ]
        read_only_fields = ['created_by']
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
    # Campos para LEITURA (quando retornamos dados)
    user = serializers.StringRelatedField(read_only=True)
    total_moved_value = serializers.ReadOnlyField()

    # Campos para ESCRITA (quando recebemos dados)
    # Definimos explicitamente para poder modificar seus querysets
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.none())
    location = serializers.PrimaryKeyRelatedField(queryset=Location.objects.none())
    movement_type = serializers.PrimaryKeyRelatedField(queryset=MovementType.objects.all())

    class Meta:
        model = StockMovement
        fields = [
            'id', 'item', 'location', 'movement_type', 'quantity', 'notes',
            'user', 'created_at', 'unit_price', 'total_moved_value'
        ]
        read_only_fields = ['user', 'created_at', 'unit_price', 'total_moved_value']

    def __init__(self, *args, **kwargs):
        """
        Filtra os querysets de 'item' e 'location' com base nas filiais
        do usuário que está fazendo a requisição.
        """
        super().__init__(*args, **kwargs)
        
        # Se não houver um request no contexto, não faz nada (útil para o OpenAPI schema)
        request = self.context.get('request', None)
        if not request or not request.user:
            return

        user = request.user
        
        # Se for admin, pode ver tudo. Senão, filtra pela filial.
        if user.is_staff:
            self.fields['item'].queryset = Item.objects.all()
            self.fields['location'].queryset = Location.objects.all()
        else:
            try:
                user_branches = user.profile.branches.all()
                self.fields['item'].queryset = Item.objects.filter(branch__in=user_branches)
                self.fields['location'].queryset = Location.objects.filter(branch__in=user_branches)
            except UserProfile.DoesNotExist:
                # Se não tiver perfil, não pode ver nada
                self.fields['item'].queryset = Item.objects.none()
                self.fields['location'].queryset = Location.objects.none()

    def validate(self, data):
        """
        Validações de regras de negócio que ocorrem DEPOIS da validação de campo.
        """
        movement_type = data['movement_type']
        quantity = data['quantity']

        if quantity <= 0:
            raise serializers.ValidationError({"quantity": "A quantidade deve ser maior que zero."})
        
        if movement_type.factor < 0:
            item = data['item']
            location = data['location']
            quantity_to_remove = quantity * (movement_type.units_per_package or 1)
            stock_item = StockItem.objects.filter(item=item, location=location).first()
            
            if not stock_item or stock_item.quantity < quantity_to_remove:
                current_stock = stock_item.quantity if stock_item else 0
                raise serializers.ValidationError(
                    f"Estoque insuficiente. Saldo atual: {current_stock}, Saída solicitada: {quantity_to_remove}"
                )
        return data
      