from django.urls import path
from .views import (
    CategoryList, ItemDetailView, ItemListCreateView, CustomAuthToken, StockMovementCreate, 
    LocationList, MovementTypeList, SupplierList, user_profile_view, logout_view
)

urlpatterns = [
    # Rotas de Autenticação
    path('login/', CustomAuthToken.as_view(), name='api-login'),
    path('logout/', logout_view, name='api-logout'),          # ✅ ROTA ADICIONADA
    path('me/', user_profile_view, name='user-profile'),     # ✅ ROTA ADICIONADA

    # Rotas da Aplicação
    path("items/", ItemListCreateView.as_view(), name="item-list"),
    path('items/<int:pk>/', ItemDetailView.as_view(), name='item-detail'),
    path('movements/', StockMovementCreate.as_view(), name='stockmovement-create'),
    path('locations/', LocationList.as_view(), name='location-list'),
    path('movement-types/', MovementTypeList.as_view(), name='movementtype-list'),
    path('categories/', CategoryList.as_view(), name='category-list'),
    path('suppliers/', SupplierList.as_view(), name='supplier-list'),

]
