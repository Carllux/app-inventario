# backend/inventory/views.py

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
    ItemSerializer, MovementTypeSerializer, StockMovementSerializer, ItemCreateUpdateSerializer 
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

class BaseListView(generics.ListAPIView):
    """Classe base para views de listagem com recursos comuns"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['name', 'id']
    search_fields = ['name']
    ordering = ['name']

class BranchList(BaseListView):
    serializer_class = BranchSerializer
    
    def get_queryset(self):
        return Branch.objects.filter(is_active=True).select_related('manager')

class SectorList(BaseListView):
    serializer_class = SectorSerializer
    
    def get_queryset(self):
        queryset = Sector.objects.filter(is_active=True)
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        return queryset.select_related('branch')

class LocationList(BaseListView):
    serializer_class = LocationSerializer
    
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

class ItemListCreateView(generics.ListCreateAPIView):
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    search_fields = ['sku', 'name', 'brand', 'supplier__name']
    ordering_fields = ['name', 'sku', 'sale_price', 'purchase_price', 'total_quantity']
    filterset_fields = {
        'status': ['exact'],
        'category': ['exact'],
        'supplier': ['exact'],
        'brand': ['exact', 'icontains'],
        'purchase_price': ['gte', 'lte', 'exact'],
        'sale_price': ['gte', 'lte', 'exact'],
        'stock_items__location': ['exact'],
        'stock_items__location__branch': ['exact'],  # Novo filtro por filial
    }

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ItemCreateUpdateSerializer
        return ItemSerializer
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_queryset(self):
        user = self.request.user
        queryset = Item.objects.all().select_related('category', 'supplier').prefetch_related('stock_items__location__branch')

        # 1. Filtro de segurança por filial (para não-admins)
        if not (user.is_staff or user.is_superuser):
            try:
                user_branches = user.profile.branches.all()
                if not user_branches.exists():
                    return Item.objects.none()
                queryset = queryset.filter(stock_items__location__branch__in=user_branches).distinct()
            except UserProfile.DoesNotExist:
                return Item.objects.none()
        
        # ✅ 2. APLICAMOS OS FILTROS DA URL MANUALMENTE AQUI
        # Filtro por localização
        location_id = self.request.query_params.get('stock_items__location')
        if location_id:
            queryset = queryset.filter(stock_items__location__id=location_id)
            
        # Filtro por categoria
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category__id=category_id)

        # Adicione outros filtros manuais aqui se necessário (status, supplier, etc.)
            
        return queryset.distinct() # Garante que não haja duplicatas

    # ✅ MÉTODO ADICIONADO PARA CORRIGIR O TypeError
    def create(self, request, *args, **kwargs):
        write_serializer = self.get_serializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        self.perform_create(write_serializer)

        # Para a resposta, usamos o serializador de LEITURA
        read_serializer = ItemSerializer(write_serializer.instance)
        
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class StockMovementCreate(generics.CreateAPIView):
    """Endpoint para registrar uma nova movimentação de estoque."""
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [SustainedRateThrottle]
    
    def create(self, request, *args, **kwargs):
        try:
            response = super().create(request, *args, **kwargs)
            
            if response.status_code == status.HTTP_201_CREATED:
                item_id = request.data.get('item')
                location_id = request.data.get('location')
                
                if item_id and location_id:
                    stock_item = StockItem.objects.filter(
                        item_id=item_id,
                        location_id=location_id
                    ).first()
                    if stock_item:
                        response.data['current_stock'] = stock_item.quantity
                        
            return response
            
        except serializers.ValidationError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
class StockItemView(generics.RetrieveUpdateAPIView):
    serializer_class = StockItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = StockItem.objects.select_related(
            'item', 'location', 'location__branch'
        )
        
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                location__branch__in=self.request.user.profile.branches.all()
            )
        return queryset
    
    def perform_update(self, serializer):
        instance = serializer.save()
        logger.info(
            f"StockItem {instance.id} updated by {self.request.user.username}"
        )


class CategoryList(BaseListView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer

class SupplierList(BaseListView):
    queryset = Supplier.objects.filter(is_active=True)
    serializer_class = SupplierSerializer
    search_fields = ['name', 'cnpj'] # Permite buscar por nome ou cnpj

class ItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    View para ver detalhes (GET), atualizar (PUT/PATCH) ou deletar (DELETE) um item.
    """
    permission_classes = [IsAuthenticated]
    
    # A lógica de permissão garante que um usuário só possa acessar
    # itens de suas próprias filiais.
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Item.objects.all()
        try:
            user_branches = user.profile.branches.all()
            return Item.objects.filter(stock_items__location__branch__in=user_branches).distinct()
        except UserProfile.DoesNotExist:
            return Item.objects.none()

    def get_serializer_class(self):
        """Usa o serializador de escrita para PUT/PATCH e o de leitura para GET."""
        if self.request.method in ['PUT', 'PATCH']:
            return ItemCreateUpdateSerializer
        return ItemSerializer