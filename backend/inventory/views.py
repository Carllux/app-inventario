# backend/inventory/views.py

from django.http import Http404
from django_countries import countries
from rest_framework import generics, filters, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.throttling import UserRateThrottle
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.models import User
from django.db import models, transaction
# Bloco de import unificado para modelos
from .models import (
    Branch, Category, Sector, Location, Supplier, UserProfile,
    Item, MovementType, StockMovement, StockItem
)
# Bloco de import unificado para serializadores
from .serializers import (
    CategorySerializer, StockItemSerializer, SupplierSerializer, UserSerializer, BranchSerializer, SectorSerializer, LocationSerializer,
    ItemSerializer, MovementTypeSerializer, StockMovementSerializer, ItemCreateUpdateSerializer, SupplierCreateUpdateSerializer, 
)
import logging
logger = logging.getLogger(__name__)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100

class BurstRateThrottle(UserRateThrottle):
    scope = 'burst'

class SustainedRateThrottle(UserRateThrottle):
    scope = 'sustained'

# --- VIEWS DE AUTENTICAÇÃO E PERFIL ---

class CustomAuthToken(ObtainAuthToken):
    """
    View de login que retorna o token e os dados completos do usuário,
    incluindo seu perfil com filiais e setores.
    """
    permission_classes = [AllowAny] 
    
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Atualizado para incluir tratamento de erros
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={'job_title': 'Colaborador'}  # Valor padrão
        )
        
        # Atualiza o token existente em vez de criar um novo
        token, created = Token.objects.get_or_create(user=user)
        if not created:
            token.delete()
            token = Token.objects.create(user=user)
        
        user_data = UserSerializer(user, context={'request': request}).data
        
        return Response({
            'token': token.key,
            'user': user_data
        }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """Endpoint melhorado com cache e tratamento de perfil ausente"""
    try:
        # Força a atualização do perfil se necessário
        request.user.profile
    except UserProfile.DoesNotExist:
        UserProfile.objects.create(user=request.user)
    
    serializer = UserSerializer(request.user, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Endpoint mais robusto com tratamento de erros"""
    try:
        request.user.auth_token.delete()
        return Response(
            {'detail': 'Logout realizado com sucesso.'},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {'detail': 'Erro ao realizar logout.'},
            status=status.HTTP_400_BAD_REQUEST
        )


# --- VIEWS DE LISTAGEM PARA SUPORTE AO FRONTEND ---

class BaseListView(generics.ListCreateAPIView): # ✅ 1. Mudar para ListCreateAPIView
    """Classe base para views de listagem E CRIAÇÃO com recursos comuns"""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination # ✅ 2. Adicionar paginação padrão
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    ordering = ['-updated_at'] 
    ordering_fields = ['name', 'created_at', 'updated_at'] 
    search_fields = ['name']

class BranchList(BaseListView):
    serializer_class = BranchSerializer
    
    def get_queryset(self):
        return Branch.objects.filter(is_active=True).select_related('manager')
    

class BranchFilteredQuerysetMixin:
    """
    Um mixin que filtra um queryset para garantir que usuários não-staff
    vejam apenas os dados de suas filiais permitidas.

    A view que usar este mixin DEVE definir o atributo `branch_filter_field`.
    Ex: `branch_filter_field = 'location__branch__in'`
    """
    branch_filter_field = None

    def get_queryset(self):
        # Primeiro, obtemos o queryset original da view pai
        queryset = super().get_queryset()
        user = self.request.user

        # Se for admin, retorna tudo
        if user.is_staff or user.is_superuser:
            return queryset

        # Se o atributo de filtro não foi definido na view, levanta um erro para o dev
        if not self.branch_filter_field:
            raise NotImplementedError(
                "A view que usa BranchFilteredQuerysetMixin deve definir 'branch_filter_field'."
            )

        # Aplica o filtro de filial para usuários normais
        try:
            user_branches = user.profile.branches.all()
            if not user_branches.exists():
                return queryset.none() # Retorna um queryset vazio se o usuário não tem filial

            # Usa o campo de filtro customizável
            filter_kwargs = {self.branch_filter_field: user_branches}
            return queryset.filter(**filter_kwargs).distinct()

        except UserProfile.DoesNotExist:
            return queryset.none() # Retorna um queryset vazio se não houver perfil

class SectorList(BaseListView):
    serializer_class = SectorSerializer
    
    def get_queryset(self):
        queryset = Sector.objects.filter(is_active=True)
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        return queryset.select_related('branch')

class LocationList(generics.ListCreateAPIView):
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated] # Mantenha a permissão
    
    def get_queryset(self):
        queryset = Location.objects.filter(is_active=True)
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        return queryset.select_related('branch')

class MovementTypeList(BaseListView):
    serializer_class = MovementTypeSerializer
    
    def get_queryset(self):
        queryset = MovementType.objects.filter(is_active=True)
        item_id = self.request.query_params.get('item_id')
        
        if item_id:
            try:
                item = Item.objects.get(pk=item_id)
                if item.total_quantity <= 0:
                    return queryset.filter(factor=1)
            except Item.DoesNotExist:
                pass
        return queryset

# --- VIEWS PRINCIPAIS DA APLICAÇÃO ---

class ItemListCreateView(BranchFilteredQuerysetMixin, generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['sku', 'name', 'brand']
    branch_filter_field = 'branch__in' # Diz ao mixin qual campo filtrar
    filterset_fields = {
        'category': ['exact'],
        'supplier': ['exact'],
        'branch': ['exact'],
        'stock_items__location': ['exact'],
    }

    def get_serializer_class(self):
        if self.request.method in ['POST', 'PUT', 'PATCH']:
            return ItemCreateUpdateSerializer
        return ItemSerializer

    def get_queryset(self):
        # --- LÓGICA ESPECÍFICA QUE PERMANECE ---
        # PASSO 1: Define o queryset base dinamicamente.
        # Esta lógica é específica desta view (admins veem soft-deleted).
        user = self.request.user
        base_queryset = Item.all_objects.all() if user.is_staff else Item.objects.all()
        
        # Atribui o queryset base para que o `super().get_queryset()` do Mixin possa encontrá-lo.
        self.queryset = base_queryset
        
        # --- LÓGICA GENÉRICA QUE É MOVIDA PARA O MIXIN ---
        # PASSO 2: Chama o `get_queryset` do Mixin (via super).
        # Ele vai pegar o self.queryset que acabamos de definir e aplicar o filtro de filial.
        queryset_filtrado_por_filial = super().get_queryset()

        # --- LÓGICA ESPECÍFICA QUE PERMANECE ---
        # PASSO 3: Aplica a lógica de validação de localização, que é específica desta view.
        if not (user.is_staff or user.is_superuser):
            location_id = self.request.query_params.get("stock_items__location")
            if location_id:
                try:
                    # Tenta buscar a filial do usuário. Se não tiver, user_branches será vazio.
                    user_branches = user.profile.branches.all()
                    if not Location.objects.filter(id=location_id, branch__in=user_branches).exists():
                        return queryset_filtrado_por_filial.none()
                except UserProfile.DoesNotExist:
                    return queryset_filtrado_por_filial.none()

        # PASSO 4: Adiciona otimizações de query.
        return queryset_filtrado_por_filial.select_related("branch", "category", "supplier").distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        write_serializer = self.get_serializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        self.perform_create(write_serializer)

        read_serializer = ItemSerializer(write_serializer.instance, context={'request': request})
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk' 
    

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ItemCreateUpdateSerializer
        return ItemSerializer

    def get_queryset(self):
        user = self.request.user
    
        # PASSO 1: Define o queryset base. Admins veem tudo (incluindo soft-deleted).
        # Usuários normais veem apenas os itens não-deletados (o .objects já faz isso).
        queryset = Item.all_objects.all() if user.is_staff else Item.objects.all()
    
        # PASSO 2: Aplica o filtro de permissão por filial APENAS para usuários normais.
        if not (user.is_staff or user.is_superuser):
            try:
                user_branches = user.profile.branches.all()
                if not user_branches.exists():
                    return queryset.none() # Se não tem filial, não vê nada.
                
                # Filtra o queryset base que já foi definido.
                queryset = queryset.filter(branch__in=user_branches)
            except UserProfile.DoesNotExist:
                return queryset.none()
        
        # PASSO 3: Adiciona otimizações e retorna o resultado final.
        return queryset.select_related('branch', 'category', 'supplier').distinct()

    def perform_destroy(self, instance):
        instance.delete()

class StockMovementCreate(generics.CreateAPIView):
    """Endpoint para registrar uma nova movimentação de estoque."""
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [SustainedRateThrottle]

    def perform_create(self, serializer):
        """
        Este método é chamado APENAS DEPOIS da validação passar.
        Aqui definimos o usuário que está fazendo a movimentação.
        """
        serializer.save(user=self.request.user)
    
class StockItemView(BranchFilteredQuerysetMixin, generics.RetrieveUpdateAPIView):
    serializer_class = StockItemSerializer
    permission_classes = [IsAuthenticated]
    queryset = StockItem.objects.select_related('item', 'location', 'location__branch')
    
    # Apenas definimos o caminho para o filtro. O Mixin faz o resto!
    branch_filter_field = 'location__branch__in'
    
    def perform_update(self, serializer):
        instance = serializer.save()
        logger.info(
            f"StockItem {instance.id} updated by {self.request.user.username}"
        )


class CategoryList(generics.ListCreateAPIView): # ✅ Aplicar a mesma correção
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

class SupplierList(BaseListView, generics.ListCreateAPIView): # ✅ Aplicar a mesma correção
    queryset = Supplier.objects.filter(is_active=True)
    serializer_class = SupplierSerializer
    search_fields = ['name', 'cnpj']
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SupplierCreateUpdateSerializer
        return SupplierSerializer

class BaseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Classe base para views de detalhe com permissão."""
    permission_classes = [IsAuthenticated]

class CategoryDetailView(BaseDetailView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class SupplierDetailView(BaseDetailView):
    queryset = Supplier.objects.all()
    
    # ✅ Usa o serializador correto para cada método HTTP
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return SupplierCreateUpdateSerializer
        return SupplierSerializer

class LocationDetailView(BaseDetailView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer

class ItemStockDistributionView(generics.ListAPIView):
    serializer_class = StockItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        item_pk = self.kwargs.get("pk")

        # Primeiro, checa se o item existe e é acessível
        qs_item = Item.objects.all()
        if not (user.is_staff or user.is_superuser):
            qs_item = qs_item.filter(branch__in=user.profile.branches.all())

        if not qs_item.filter(pk=item_pk).exists():
            # 🔥 força 404 se o item não pertence a uma filial acessível
            raise Http404("Item não encontrado ou sem permissão")

        # Caso contrário, retorna os estoques do item
        return StockItem.objects.filter(item__pk=item_pk).order_by("location__name")

@api_view(['GET'])
@permission_classes([IsAuthenticated]) # Protegido por autenticação
def country_list_view(request):
    """
    Retorna uma lista de todos os países disponíveis com código, nome e URL da bandeira.
    """
    country_data = [
        {
            "code": code,
            "name": name,
            "flag_url": f"/static/flags/4x3/{code.lower()}.svg" # Caminho para as bandeiras estáticas
        }
        for code, name in list(countries)
    ]
    return Response(country_data)
