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
    Branch, Sector, Location, UserProfile,
    Item, MovementType, StockMovement, StockItem
)
# Bloco de import unificado para serializadores
from .serializers import (
    StockItemSerializer, UserSerializer, BranchSerializer, SectorSerializer, LocationSerializer,
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

class ItemListCreateView(BaseListView):
    serializer_class = ItemSerializer
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
        """Usa um serializador diferente para leitura (GET) e escrita (POST)."""
        if self.request.method == 'POST':
            return ItemCreateUpdateSerializer
        return ItemSerializer
    
    def perform_create(self, serializer):
        """Associa o item ao usuário logado no momento da criação."""
        serializer.save(owner=self.request.user)

    def get_queryset(self):
        logger.info(f"ItemList accessed by {self.request.user.username}")
        queryset = Item.objects.all().prefetch_related(
            'stock_items__location__branch',
            'category',
            'supplier'
        ).select_related('category', 'supplier')
        
        # Filtro por usuário não admin
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            try:
                user_branches = self.request.user.profile.branches.all()
                if user_branches.exists():
                    queryset = queryset.filter(
                        stock_items__location__branch__in=user_branches
                    ).distinct()
                else:
                    return Item.objects.none()
            except UserProfile.DoesNotExist:
                return Item.objects.none()
        
        # Filtro adicional por baixo estoque
        if self.request.query_params.get('low_stock', '').lower() == 'true':
            queryset = queryset.annotate(
                is_low_stock_condition=models.ExpressionWrapper(
                    models.F('total_quantity') <= models.F('minimum_stock_level'),
                    output_field=models.BooleanField()
                )
            ).filter(is_low_stock_condition=True)
    


        return queryset

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