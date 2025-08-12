# backend/inventory/views.py

from rest_framework import generics, filters, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.models import User

# Importando TODOS os modelos e serializadores que vamos usar
from .models import (
    Branch, Sector, Location, UserProfile,
    Item, MovementType, StockMovement
)
from .serializers import (
    UserSerializer, BranchSerializer, SectorSerializer, LocationSerializer,
    ItemSerializer, MovementTypeSerializer, StockMovementSerializer
)

# --- View de Autenticação Aprimorada ---

class CustomAuthToken(ObtainAuthToken):
    """
    View de login que retorna o token e os dados completos do usuário,
    incluindo seu perfil com filiais e setores.
    """
    # Permite acesso sem autenticação para que o usuário possa logar
    permission_classes = [AllowAny] 
    
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        # ✅ MUDANÇA PRINCIPAL: Usando o UserSerializer para retornar dados completos
        user_data = UserSerializer(user).data
        
        return Response({
            'token': token.key,
            'user': user_data
        })

# --- Views de Listagem para Suporte ao Frontend ---

class BranchList(generics.ListAPIView):
    """Endpoint para listar todas as filiais ativas."""
    queryset = Branch.objects.filter(is_active=True).order_by('name')
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]

class SectorList(generics.ListAPIView):
    """Endpoint para listar setores, opcionalmente filtrados por filial."""
    serializer_class = SectorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Sector.objects.filter(is_active=True)
        branch_id = self.request.query_params.get('branch_id', None)
        if branch_id is not None:
            queryset = queryset.filter(branch_id=branch_id)
        return queryset.order_by('name')

class LocationList(generics.ListAPIView):
    """Endpoint para listar todas as locações ativas."""
    # ✅ MELHORIA: Adicionada ordenação para evitar warnings de paginação
    queryset = Location.objects.filter(is_active=True).order_by('name')
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]

class MovementTypeList(generics.ListAPIView):
    """View inteligente para listar TPOs, filtrando por estoque do item se necessário."""
    serializer_class = MovementTypeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        item_id = self.request.query_params.get('item_id', None)
        base_queryset = MovementType.objects.filter(is_active=True)
        if item_id:
            try:
                item = Item.objects.get(pk=item_id)
                if item.total_quantity <= 0:
                    return base_queryset.filter(factor=1).order_by('name')
            except Item.DoesNotExist:
                pass
        return base_queryset.order_by('name')


# --- Views Principais da Aplicação ---

class ItemList(generics.ListAPIView):
    """
    View principal para listar itens do catálogo. A lógica de permissão é aplicada aqui.
    """
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['sku', 'name', 'brand']
    ordering_fields = ['name', 'sku', 'sale_price', 'total_quantity']
    filterset_fields = ['category', 'supplier', 'status']
    ordering = ['sku']

    def get_queryset(self):
        """
        ✅ LÓGICA DE PERMISSÃO ATUALIZADA:
        - Administradores (staff/superuser) veem todos os itens.
        - Usuários normais veem apenas os itens das filiais associadas ao seu perfil.
        """
        user = self.request.user

        if user.is_staff or user.is_superuser:
            return Item.objects.all().prefetch_related('stock_items__location__branch')

        try:
            user_branches = user.profile.branches.all()
            if not user_branches:
                return Item.objects.none() # Retorna uma lista vazia se não tiver filial
            
            # Filtra itens que têm estoque em locais que pertencem às filiais do usuário
            return Item.objects.filter(
                stock_items__location__branch__in=user_branches
            ).distinct().prefetch_related('stock_items__location__branch')
        
        except UserProfile.DoesNotExist:
            return Item.objects.none() # Retorna uma lista vazia se não tiver perfil


class StockMovementCreate(generics.CreateAPIView):
    """Endpoint para registrar uma nova movimentação de estoque."""
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Associa a movimentação ao usuário logado
        serializer.save(user=self.request.user)