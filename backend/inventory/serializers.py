# backend/inventory/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User, Group
from django.core.exceptions import ValidationError
from rest_framework.validators import UniqueTogetherValidator, UniqueValidator 
from .models import (
    Branch, CategoryGroup, Sector, SystemSettings, UserProfile,
    Supplier, Category, Item, Location, 
    StockItem, StockMovement, MovementType, validate_ean  
)
from .validators import validate_cnpj_format


# --- Serializadores de Organização e Permissão ---

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        # ✅ Adiciona 'description' e outros campos de auditoria para consistência
        fields = [
            'id', 'name', 'description', 'is_active', 
            'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

class SectorSerializer(serializers.ModelSerializer):
    """Serializador de LEITURA: exibe o nome da filial."""
    # Exibe o nome da filial em vez do ID, o que é ótimo para a UI
    branch = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Sector
        # Adiciona 'branch' e 'description' para uma representação completa
        fields = ['id', 'name', 'branch', 'description', 'is_active']

class SectorCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializador de ESCRITA: espera o ID da filial."""
    # Ao criar/atualizar, o frontend enviará o ID da filial.
    # O queryset garante que o ID enviado corresponda a uma filial existente.
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all())

    class Meta:
        model = Sector
        fields = ['name', 'branch', 'description']
        # Adiciona a validação de unicidade que já existe no modelo
        validators = [
            UniqueTogetherValidator(
                queryset=Sector.objects.all(),
                fields=['branch', 'name'],
                message="Já existe um setor com este nome nesta filial."
            )
        ]

class CountrySerializer(serializers.Serializer):
    """Um serializador simples para representar um país com código e nome."""
    code = serializers.CharField(max_length=2)
    name = serializers.CharField()

class UserProfileSerializer(serializers.ModelSerializer):
    branches = BranchSerializer(many=True, read_only=True)
    sectors = SectorSerializer(many=True, read_only=True)
    manager = serializers.PrimaryKeyRelatedField(
        queryset=UserProfile.objects.all(), 
        allow_null=True, 
        required=False
    )
    manager_name = serializers.CharField(source='manager.user.get_full_name', read_only=True)

    class Meta:
        model = UserProfile
        # 1. ATUALIZAR ESTA LISTA DE CAMPOS
        fields = [
            'job_title', 
            'phone_number', 
            'hire_date', 
            'branches', 
            'sectors',
            'manager', 
            'manager_name',
            
            # --- NOVOS CAMPOS ADICIONADOS ---
            'avatar',
            'preferred_theme',
            'default_items_per_page',
            'table_density',
        ]

class UserSerializer(serializers.ModelSerializer):
    # Aninha o perfil dentro dos dados do usuário
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'profile']
        
class UserStatsSerializer(serializers.Serializer):
    items_created = serializers.IntegerField()
    member_since = serializers.DateTimeField()
    most_frequent_movement = serializers.CharField(allow_null=True)

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializador para o usuário ATUALIZAR seu próprio perfil."""
    # Traz campos do modelo User para serem atualizados
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    email = serializers.EmailField(source='user.email', required=False, allow_blank=True)
    # Adiciona o campo de imagem para o upload
    avatar = serializers.ImageField(required=False)
    
    # Adiciona os campos de preferências que implementaremos a seguir
    preferred_theme = serializers.ChoiceField(choices=UserProfile.ThemeChoices.choices, required=False)
    default_items_per_page = serializers.IntegerField(required=False)
    table_density = serializers.ChoiceField(choices=UserProfile.TableDensityChoices.choices, required=False)
    class Meta:
        model = UserProfile
        # Lista de campos que o usuário pode editar
        fields = [
            'first_name', 'last_name', 'email', 'job_title', 'phone_number', 
            'avatar', 'preferred_theme', 'default_items_per_page', 'table_density'
        ]

    def update(self, instance, validated_data):
        # Lida com a atualização do objeto User aninhado
        if 'user' in validated_data:
            user_data = validated_data.pop('user')
            user = instance.user
            user.first_name = user_data.get('first_name', user.first_name)
            user.last_name = user_data.get('last_name', user.last_name)
            user.email = user_data.get('email', user.email)
            user.save()
        
        # Atualiza os campos do UserProfile
        return super().update(instance, validated_data)

# --- Serializadores de Catálogo e Estoque ---

class CategoryGroupSerializer(serializers.ModelSerializer):
    # It's good practice to explicitly show related fields for readability
    created_by = serializers.StringRelatedField(read_only=True)
    last_updated_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = CategoryGroup
        # Include all relevant fields from BaseModel
        fields = [
            'id', 
            'name', 
            'description',
            'is_active',
            'created_at',
            'updated_at',
            'created_by',
            'last_updated_by',
            'deleted_at'
        ]
        read_only_fields = [
            'id', 
            'created_at', 
            'updated_at', 
            'created_by', 
            'last_updated_by', 
            'deleted_at'
        ]


class CategorySerializer(serializers.ModelSerializer):
    """Serializador de LEITURA: exibe o nome do grupo."""
    group = serializers.StringRelatedField(read_only=True)
    group_id = serializers.PrimaryKeyRelatedField(
        source='group',
        queryset=CategoryGroup.objects.all(),
        allow_null=True,
        required=False
    )
    
    # Adicione campos legíveis para as chaves estrangeiras de auditoria
    created_by = serializers.StringRelatedField(read_only=True)
    last_updated_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Category
        # Expanda a lista de campos para incluir os herdados
        fields = [
            'id', 'name', 'group', 'group_id', 'description',
            'is_active', 'created_at', 'updated_at', 'created_by',
            'last_updated_by', 'deleted_at'
        ]

class CategoryCreateUpdateSerializer(serializers.ModelSerializer):
    group = serializers.PrimaryKeyRelatedField(
        queryset=CategoryGroup.objects.all(), 
        allow_null=True, 
        required=False
    )
    group_id = serializers.PrimaryKeyRelatedField(
        source='group',
        queryset=CategoryGroup.objects.all(),
        allow_null=True,
        required=False
    )

    class Meta:
        model = Category
        fields = ['id', 'name', 'group', 'group_id', 'description']

class SupplierSerializer(serializers.ModelSerializer):
    """Serializador de LEITURA para Fornecedores."""
    country = CountrySerializer(read_only=True)
    parent_supplier = serializers.PrimaryKeyRelatedField(
        allow_null=True, 
        required=False,
        read_only=True  # ✅ Deve ser read_only no serializer de leitura
    )
    tax_regime_display = serializers.CharField(source='get_tax_regime_display', read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)
    last_updated_by = serializers.StringRelatedField(read_only=True)


    class Meta:
        model = Supplier
        # Expanda a lista de campos para ser completa
        fields = [
            # Informações Principais
            'id', 'name', 'parent_supplier', 'contact_person', 
            'phone_number', 'email', 'is_active',
            
            # Informações Fiscais
            'tax_regime', 'tax_regime_display', 'cnpj', 'tax_id', 'ie',
            
            # Endereço
            'country', 'postal_code', 'address_line_1', 'address_line_2',
            'neighborhood', 'city', 'state',
            
            # Auditoria
            'created_by', 'last_updated_by', 'created_at', 'updated_at', 'deleted_at'
        ]
        read_only_fields = ['id', 'is_active']  # ✅ Campos apenas leitura


class SupplierCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializador de ESCRITA para Fornecedores."""
    country = serializers.CharField(max_length=2, required=False, allow_blank=True)
    override_cnpj_validation = serializers.BooleanField(write_only=True, required=False, default=False)

    parent_supplier = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(), 
        allow_null=True, 
        required=False
    )
    cnpj = serializers.CharField(
        validators=[
            UniqueValidator(
                queryset=Supplier.objects.all(), 
                message="Já existe um fornecedor com este CNPJ."
            ),
        ],
        required=False, 
        allow_blank=True
    )

    class Meta:
        model = Supplier
        fields = [
            'name', 'parent_supplier', 'tax_regime', 'cnpj', 'tax_id', 'ie',
            'contact_person', 'phone_number', 'email', 'country', 'postal_code',
            'address_line_1', 'address_line_2', 'neighborhood', 'city', 'state',
            "override_cnpj_validation", "cnpj_validation_overridden",
        ]

    def validate_cnpj(self, value):
        """
        Valida o CNPJ e define uma flag interna se a anulação for necessária e utilizada.
        """
        if not value or not value.strip():
            return value

        # Inicializa a flag interna
        self._override_was_triggered = False
        override_requested = self.initial_data.get('override_cnpj_validation', False)

        try:
            # Tenta a validação matemática
            validate_cnpj_format(value)
        except ValidationError as e:
            # Se falhar, verifica se a anulação foi solicitada
            if override_requested:
                # Se sim, marca que a anulação foi de fato utilizada
                self._override_was_triggered = True
            else:
                # Se não, levanta o erro de validação
                raise e
        
        return value

    def create(self, validated_data):
        # Verifica a flag interna definida por validate_cnpj
        if getattr(self, '_override_was_triggered', False):
            validated_data['cnpj_validation_overridden'] = True
        
        validated_data.pop('override_cnpj_validation', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Verifica a flag interna definida por validate_cnpj
        if getattr(self, '_override_was_triggered', False):
            validated_data['cnpj_validation_overridden'] = True
        
        validated_data.pop('override_cnpj_validation', None)
        return super().update(instance, validated_data)

    def validate(self, data):
        """Validações cruzadas que funcionam para criação e atualização parcial."""
        errors = {}
        
        # Se self.instance existe, é uma atualização (PATCH/PUT)
        instance = getattr(self, 'instance', None)

        # Verifica se o CNPJ está presente nos dados recebidos ou já existe na instância
        has_cnpj = 'cnpj' in data or (instance and instance.cnpj)
        
        # Verifica se a IE está presente nos dados recebidos ou já existe na instância
        has_ie = 'ie' in data or (instance and instance.ie)
        
        # Verifica se o país está sendo definido ou já existe
        country = data.get('country') or (instance and instance.country)
        
        # Verifica se o regime tributário está sendo definido ou já existe
        tax_regime = data.get('tax_regime') or (instance and instance.tax_regime)

        # Regra 1: Se tem CNPJ, deve ter IE
        if has_cnpj and not has_ie:
            errors['ie'] = "Inscrição Estadual é obrigatória ao usar um CNPJ."
            
        # Regra 2: Regime tributário deve ser preenchido para Brasil
        if country == 'BR' and not tax_regime:
            errors['tax_regime'] = "Regime tributário é obrigatório para fornecedores no Brasil."
            
        if errors:
            raise serializers.ValidationError(errors)
            
        return data

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
    warranty_days = serializers.IntegerField(read_only=True)
    internal_code = serializers.CharField(read_only=True)
    manufacturer_code = serializers.CharField(read_only=True)
    cfop = serializers.CharField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    volume = serializers.DecimalField(max_digits=22, decimal_places=6, read_only=True)
    last_updated_by = serializers.StringRelatedField(read_only=True)



    class Meta:
        model = Item
        # Expanda a lista de fields para incluir os campos faltantes
        fields = [
            # Informações Principais
            'id', 'sku', 'name', 'ean', 'status', 'status_display',
            'active', 'branch', 'category', 'supplier', 'brand',
            'photo', 'short_description', 'long_description',

            # Preços e Medidas
            'purchase_price', 'sale_price', 'unit_of_measure',
            
            # Controle de Estoque
            'total_quantity', 'is_low_stock', 'minimum_stock_level',

            # Dimensões
            'height', 'width', 'depth', 'weight', 'volume',

            # Detalhes Adicionais
            'origin', 'cfop', 'warranty_days', 
            'internal_code', 'manufacturer_code',
            
            # Auditoria
            'created_by', 'last_updated_by', 'created_at', 'updated_at', 'deleted_at'
        ]

class ItemCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializador de ESCRITA: espera IDs (PKs) para relações."""
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all())
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), allow_null=True, required=False)
    supplier = serializers.PrimaryKeyRelatedField(queryset=Supplier.objects.all(), allow_null=True, required=False)
    # Django-countries lida com a conversão do código do país (ex: 'BR')
    origin = serializers.CharField(max_length=2, required=False, allow_blank=True)
    warranty_days = serializers.IntegerField(required=False)
    internal_code = serializers.CharField(required=False, allow_blank=True)
    manufacturer_code = serializers.CharField(required=False, allow_blank=True)
    cfop = serializers.CharField(required=False, allow_blank=True)
    ean = serializers.CharField(
        max_length=13,
        validators=[validate_ean],
        required=False,
        allow_blank=True,
        allow_null=True
    )
    class Meta:
        model = Item
        # Lista de campos que o frontend pode ENVIAR
        fields = [
            'sku', 'name', 'branch', 'category', 'supplier', 'status', 'brand',
            'purchase_price', 'sale_price', 'unit_of_measure',
            'origin', 'cfop', 'minimum_stock_level',
            'internal_code', 'manufacturer_code', 'short_description', 'long_description',
            'height', 'width', 'depth', 'weight', 'photo', 'created_by',  
            'warranty_days', 'internal_code', 'manufacturer_code', 'cfop', "ean"
        ]
        read_only_fields = ['created_by']

class StockItemSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)

    class Meta:
        model = StockItem
        fields = ['id', 'location', 'quantity', 'updated_at']

class StockMovementListSerializer(serializers.ModelSerializer):
    """Exibe uma representação detalhada e legível de uma movimentação de estoque."""
    item = serializers.StringRelatedField()
    location = serializers.StringRelatedField()
    movement_type = serializers.StringRelatedField()
    user = serializers.StringRelatedField()

    class Meta:
        model = StockMovement
        fields = [
            'id', 'item', 'location', 'movement_type', 'quantity', 'unit_price',
            'total_moved_value', 'user', 'created_at', 'notes'
        ]

# --- Serializadores de Movimentação (TPOs e Movimentos) ---

class MovementTypeSerializer(serializers.ModelSerializer):
    """Serializador de LEITURA para Tipos de Movimento."""
    # Para leitura, mostramos os nomes e valores legíveis
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    factor_display = serializers.CharField(source='get_factor_display', read_only=True)
    allowed_for_groups = serializers.StringRelatedField(many=True, read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)
    last_updated_by = serializers.StringRelatedField(read_only=True)
    parent_type = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = MovementType
        fields = [
            'id', 'code', 'name', 'description', 'factor', 'factor_display',
            'units_per_package', 'parent_type', 'category', 'category_display',
            'document_type', 'document_type_display', 'requires_approval',
            'affects_finance', 'is_locked', 'allowed_for_groups', 'is_active',
            'created_by', 'last_updated_by', 'created_at', 'updated_at', 'deleted_at'
        ]

class MovementTypeCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializador de ESCRITA para Tipos de Movimento."""
    # Para escrita, esperamos os IDs
    parent_type = serializers.PrimaryKeyRelatedField(
        queryset=MovementType.objects.all(),
        allow_null=True,
        required=False
    )
    allowed_for_groups = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Group.objects.all(),
        required=False
    )

    class Meta:
        model = MovementType
        fields = [
            'code', 'name', 'description', 'factor', 'units_per_package',
            'parent_type', 'category', 'document_type', 'requires_approval',
            'affects_finance', 'is_locked', 'allowed_for_groups', 'is_active'
        ]

    def validate(self, data):
        """Validação para impedir que um tipo seja pai de si mesmo."""
        if self.instance and 'parent_type' in data:
            if self.instance == data.get('parent_type'):
                raise serializers.ValidationError({"parent_type": "Um tipo de movimento não pode ser pai de si mesmo."})
        return data

class StockMovementSerializer(serializers.ModelSerializer):
    # Campos para LEITURA (quando retornamos dados)
    user = serializers.StringRelatedField(read_only=True)
    total_moved_value = serializers.ReadOnlyField()
    attachment = serializers.FileField(required=False, allow_null=True)
    # O queryset é definido como none() aqui porque será populado dinamicamente
    # no método __init__ com base nas permissões de filial do usuário.
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.none())
    location = serializers.PrimaryKeyRelatedField(queryset=Location.objects.none())
    movement_type = serializers.PrimaryKeyRelatedField(queryset=MovementType.objects.all())

    class Meta:
        model = StockMovement
        fields = [
            'id', 'item', 'location', 'movement_type', 'quantity', 'notes',
            'user', 'created_at', 'unit_price', 'total_moved_value', 'attachment'
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
        item = data['item']
        movement_type = data['movement_type']
        quantity = data['quantity']
        
        # ✅ ADICIONE A LÓGICA DE VALIDAÇÃO DE PREÇO AQUI ✅
        price_to_check = item.purchase_price if movement_type.is_inbound else item.sale_price
        if price_to_check is None or price_to_check <= 0:
            price_type = 'compra' if movement_type.is_inbound else 'venda'
            raise serializers.ValidationError(
                f"Não é possível criar o movimento. O item '{item.name}' "
                f"não possui um preço de {price_type} válido."
            )

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
      
class SystemSettingsSerializer(serializers.ModelSerializer):
    """Serializador para as Configurações do Sistema (Singleton)."""
    class Meta:
        model = SystemSettings
        fields = ['default_branch', 'default_sector']

class ActivityLogSerializer(serializers.Serializer):
    """Serializador definitivo para o log de atividades do usuário."""
    # Estes são os campos que a view nos fornece a partir do .values()
    # Eles são "write_only" porque só os usamos para CÁLCULO,
    # não para serem exibidos diretamente na API.
    history_id = serializers.IntegerField(write_only=True)
    history_date = serializers.DateTimeField(write_only=True)
    history_type = serializers.CharField(write_only=True)
    history_user_id = serializers.IntegerField(write_only=True)
    model_name = serializers.CharField(write_only=True)
    record_name = serializers.CharField(write_only=True, allow_null=True)
    item_name = serializers.CharField(required=False, write_only=True, allow_null=True)
    movement_type_name = serializers.CharField(required=False, write_only=True, allow_null=True)
    # O campo 'id' do objeto original, que pode ser UUID ou int. Lemos como string.
    original_record_id = serializers.CharField(source='id', write_only=True, required=False, allow_null=True)
    # O campo 'user_id' específico do UserProfile. Lemos como int.
    user_profile_pk = serializers.IntegerField(source='user_id', write_only=True, required=False, allow_null=True)

    # --- CAMPOS QUE REALMENTE APARECEM NA RESPOSTA DA API ---
    # Estes são os campos que serão calculados e enviados para o frontend.
    timestamp = serializers.DateTimeField(source='history_date', read_only=True)
    user = serializers.SerializerMethodField(read_only=True)
    action_type = serializers.SerializerMethodField(read_only=True)
    description = serializers.SerializerMethodField(read_only=True)
    target_url = serializers.SerializerMethodField(read_only=True)

    def get_description(self, obj):
        action_map = {'+': 'adicionou', '~': 'atualizou', '-': 'deletou'}
        action_verb = action_map.get(obj['history_type'], 'modificou')
        
        model_type = obj['model_name']
        record_name = obj.get('record_name')

        if model_type == 'StockMovement':
            if obj['history_type'] == '+':
                return f"Você realizou o movimento '{obj.get('movement_type_name')}' no item '{obj.get('item_name')}'."
            return f"Você {action_verb} um registro de movimentação."

        if model_type == 'UserProfile':
            return f"Você {action_verb} os dados do seu perfil."

        model_name_map = {
            'Item': 'o item', 'Supplier': 'o fornecedor', 'Branch': 'a filial',
            'Sector': 'o setor', 'Location': 'a locação', 'Category': 'a categoria',
            'MovementType': 'o tipo de movimento', 'CategoryGroup': 'o grupo de categoria',
        }
        model_name_display = model_name_map.get(model_type, 'o registro')
        return f"Você {action_verb} {model_name_display} '{record_name}'."

    def get_user(self, obj):
        request = self.context.get('request')
        if request and request.user.id == obj['history_user_id']:
            full_name = request.user.get_full_name()
            return full_name if full_name else request.user.username
        return "Usuário Desconhecido"

    def get_action_type(self, obj):
        model_name = obj['model_name']
        action_map = {'+': 'CREATED', '~': 'UPDATED', '-': 'DELETED'}
        action = action_map.get(obj['history_type'], 'MODIFIED')
        return f"{model_name}_{action}"

    def get_target_url(self, obj):
        model_name = obj['model_name']
        
        if model_name == 'UserProfile':
            return '/profile' # URL para UserProfile é estática
        
        # Para outros modelos, use o ID original do registro
        record_id = obj.get('original_record_id')
        if not record_id:
            return None

        url_map = {
            'Item': f'/inventory/{record_id}',
            'Branch': f'/settings/branches/{record_id}',
            'UserProfile': '/profile', # URL para UserProfile é estática, não precisa do ID
            'Supplier': f'/suppliers/{record_id}',
        }
        return url_map.get(model_name)