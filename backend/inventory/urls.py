from django.urls import path
from .views import (
    CategoryList, ItemDetailView, ItemListCreateView, CustomAuthToken, StockMovementCreate, 
    LocationList, MovementTypeList, SupplierList, user_profile_view, logout_view, ItemStockDistributionView,
    SupplierDetailView, CategoryDetailView, LocationDetailView, country_list_view,
)

urlpatterns = [
    # Rotas de Autenticação
    path('login/', CustomAuthToken.as_view(), name='api-login'),
    path('logout/', logout_view, name='api-logout'),          # ✅ ROTA ADICIONADA
    path('me/', user_profile_view, name='user-profile'),     # ✅ ROTA ADICIONADA

    # Rotas da Aplicação
    path("items/", ItemListCreateView.as_view(), name="item-list"),
    path('items/<uuid:pk>/', ItemDetailView.as_view(), name='item-detail'),
    path('items/<uuid:pk>/stock/', ItemStockDistributionView.as_view(), name='item-stock-distribution'),
    path('movements/', StockMovementCreate.as_view(), name='stockmovement-create'),
    path('locations/', LocationList.as_view(), name='location-list'),
    path('movement-types/', MovementTypeList.as_view(), name='movementtype-list'),
    path('categories/', CategoryList.as_view(), name='category-list'),
    path('suppliers/', SupplierList.as_view(), name='supplier-list'),

    # Rotas de detalhe 
    path('suppliers/<uuid:pk>/', SupplierDetailView.as_view(), name='supplier-detail'),
    path('categories/<uuid:pk>/', CategoryDetailView.as_view(), name='category-detail'),
    path('locations/<uuid:pk>/', LocationDetailView.as_view(), name='location-detail'),

    path('utils/countries/', country_list_view, name='country-list'),

]
