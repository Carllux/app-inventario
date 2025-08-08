from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination
from rest_framework.throttling import UserRateThrottle
from drf_yasg.utils import swagger_auto_schema
from rest_framework.permissions import IsAuthenticated  # Adicionado
from rest_framework.exceptions import PermissionDenied  # Adicionado
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework import status
from .models import Item
from .serializers import ItemSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny 
from .models import Location
from .serializers import LocationSerializer


# Importe os novos modelos e serializadores necessários
from .models import StockMovement
from .serializers import StockMovementSerializer


class CustomAuthToken(ObtainAuthToken):
    """
    View personalizada para login que retorna o token e informações do usuário
    """
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                       context={'request': request})
        if not serializer.is_valid():
            return Response(
                {'error': 'Credenciais inválidas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff
        })

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class ItemList(generics.ListAPIView):
    """
    View para listar todos os itens do inventário com diversas opções de filtro.
    """
    serializer_class = ItemSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    throttle_classes = [UserRateThrottle]
    permission_classes = [IsAuthenticated]  # Requer autenticação
    
    filterset_fields = {
        'brand': ['exact', 'icontains'],
        # 'quantity': ['gte', 'lte', 'exact'], # <-- REMOVA OU COMENTE ESTA LINHA
        'purchase_price': ['gte', 'lte', 'exact'],
        'sale_price': ['gte', 'lte'], # Podemos adicionar o preço de venda também
        'status': ['exact'], # E o status
        'category__name': ['exact', 'icontains'], # Exemplo de filtro através de relacionamento
    }
    
    search_fields = ['name', 'brand', 'short_description', 'long_description']
    ordering_fields = ['name', 'quantity', 'purchase_price', 'created_at']
    ordering = ['-created_at']  # Ordem padrão: mais recentes primeiro

    @method_decorator(cache_page(60*15))  # Cache de 15 minutos
    @swagger_auto_schema(
        operation_description="Retorna uma lista paginada de itens do inventário com opções de filtro",
        responses={
            200: ItemSerializer(many=True),
            401: "Não autenticado",
            403: "Permissão negada"
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        """
        Filtra os itens pelo usuário logado por padrão e aplica filtros adicionais
        """
        # Remove o filtro por owner dos filterset_fields pois vamos tratar manualmente
        queryset = Item.objects.filter(owner=self.request.user)
        
        # Filtro adicional para mostrar todos os itens (apropriado para admins)
        show_all = self.request.query_params.get('show_all', '').lower() == 'true'
        
        if show_all:
            if not self.request.user.is_staff:
                raise PermissionDenied("Você não tem permissão para ver todos os itens")
            queryset = Item.objects.all()
            
        return queryset
    
# ADICIONE A NOVA VIEW ABAIXO
class StockMovementCreate(generics.CreateAPIView):
    """
    Endpoint para criar uma nova movimentação de estoque.
    A lógica no método save() do modelo StockMovement cuidará de
    atualizar a quantidade no modelo StockItem.
    """
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated] # Apenas usuários logados podem criar movimentações

    def perform_create(self, serializer):
        """
        Associa a movimentação ao usuário que está fazendo a requisição.
        """
        serializer.save(user=self.request.user)
        

class LocationList(generics.ListAPIView):
    """
    View para listar todas as localizações cadastradas.
    """
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]