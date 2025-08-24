# backend/inventory/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework.validators import UniqueTogetherValidator, UniqueValidator 
from .models import (
    Branch, CategoryGroup, Sector, UserProfile,
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

class CountrySerializer(serializers.Serializer):
    """Um serializador simples para representar um país com código e nome."""
    code = serializers.CharField(max_length=2)
    name = serializers.CharField()

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

class CategoryGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryGroup
        fields = ['id', 'name', 'description']


class CategorySerializer(serializers.ModelSerializer):
    """Serializador de LEITURA: exibe o nome do grupo."""
    # Mantém o relacionamento para leitura
    group = serializers.StringRelatedField(read_only=True)
    # ✅ ADICIONAR: campo para escrita também
    group_id = serializers.PrimaryKeyRelatedField(
        source='group',
        queryset=CategoryGroup.objects.all(),
        write_only=True,
        allow_null=True,
        required=False
    )

    class Meta:
        model = Category
        fields = ['id', 'name', 'group', 'group_id', 'description']

class CategoryCreateUpdateSerializer(serializers.ModelSerializer):
    group = serializers.PrimaryKeyRelatedField(
        queryset=CategoryGroup.objects.all(), 
        allow_null=True, 
        required=False
    )

    class Meta:
        model = Category
        fields = ['id', 'name', 'group', 'description']
class SupplierSerializer(serializers.ModelSerializer):
    """Serializador de LEITURA para Fornecedores."""
    # ✅ CORREÇÃO: Usa o CountrySerializer para retornar o objeto {code, name}
    country = CountrySerializer(read_only=True)

    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'cnpj', 'country', 'is_active', 'tax_regime', 'ie',
            'contact_person', 'phone_number', 'email', 'postal_code',
            'address_line_1', 'city', 'state'
        ]

class SupplierCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializador de ESCRITA para Fornecedores."""
    # ✅ Garante que a API espere o código do país ('BR') para escrita
    country = serializers.CharField(max_length=2, required=False, allow_blank=True)
    
    # Adiciona o validador de CNPJ único aqui
    cnpj = serializers.CharField(
        validators=[UniqueValidator(queryset=Supplier.objects.all(), message="Já existe um fornecedor com este CNPJ.")],
        required=False, allow_blank=True
    )

    class Meta:
        model = Supplier
        # Lista de todos os campos que o frontend pode enviar
        fields = [
            'name', 'country', 'tax_regime', 'cnpj', 'ie', 'contact_person',
            'phone_number', 'email', 'postal_code', 'address_line_1', 'city', 'state'
        ]


class LocationSerializer(serializers.ModelSerializer):
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all())

    class Meta:
        model = Location
        fields = ['id', 'name', 'location_code', 'branch']
        
        # ✅ 2. Adicionar validadores customizados
        validators = [
            UniqueTogetherValidator(
                queryset=Location.objects.all(),
                fields=['branch', 'location_code'],
                message="Já existe uma locação com este código nesta filial."
            )
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['branch'] = instance.branch.name
        return representation


class ItemSerializer(serializers.ModelSerializer):
    """Serializador de LEITURA: exibe dados aninhados e calculados."""
    category = CategorySerializer(read_only=True)
    supplier = SupplierSerializer(read_only=True)
    branch = BranchSerializer(read_only=True)
    origin = CountrySerializer(read_only=True) 
    total_quantity = serializers.IntegerField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    active = serializers.BooleanField(read_only=True) # source='is_active' foi removido pois o nome do campo é o mesmo da propriedade no modelo.
    created_by = serializers.StringRelatedField(read_only=True)

    # ✅ 1. NOVO: Adiciona o valor "legível" do campo de status.
    #    A API retornará: "status": "ACTIVE", "status_display": "Ativo"
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # ✅ 2. NOVO: Expõe a propriedade calculada 'volume' do modelo.
    volume = serializers.DecimalField(max_digits=22, decimal_places=6, read_only=True)

    class Meta:
        model = Item
        fields = [
            'id', 'sku', 'name', 'status', 'status_display', # ✅ Adicionado
            'active', 'branch', 'category', 'supplier', 
            'photo', 'brand', 'sale_price', 'unit_of_measure', 'short_description', 'long_description',
            'total_quantity', 'is_low_stock', 'created_by', 'origin', 
            'volume', # ✅ Adicionado
            # ✅ 3. Adicionando campos físicos que estavam faltando na leitura
            'height', 'width', 'depth', 'weight',
        ]

class ItemCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializador de ESCRITA: espera IDs (PKs) para relações."""
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all())
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), allow_null=True, required=False)
    supplier = serializers.PrimaryKeyRelatedField(queryset=Supplier.objects.all(), allow_null=True, required=False)
    # Django-countries lida com a conversão do código do país (ex: 'BR')
    origin = serializers.CharField(max_length=2, required=False, allow_blank=True)
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

    # O queryset é definido como none() aqui porque será populado dinamicamente
    # no método __init__ com base nas permissões de filial do usuário.
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
      