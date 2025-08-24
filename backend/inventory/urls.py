from django.urls import path
from .views import (
    CategoryGroupDetailView, CategoryGroupList, CategoryList, ItemDetailView, ItemListCreateView, CustomAuthToken, StockMovementCreate, 
    LocationList, MovementTypeList, SupplierList, user_profile_view, logout_view, ItemStockDistributionView,
    SupplierDetailView, CategoryDetailView, LocationDetailView, country_list_view,
)

urlpatterns = [
    # Rotas de Autenticação
    path('login/', CustomAuthToken.as_view(), name='api-login'),
    path('logout/', logout_view, name='api-logout'),
    path('me/', user_profile_view, name='user-profile'),

    # Rotas da Aplicação
    path("items/", ItemListCreateView.as_view(), name="item-list"),
    path('items/<uuid:pk>/', ItemDetailView.as_view(), name='item-detail'),
    path('items/<uuid:pk>/stock/', ItemStockDistributionView.as_view(), name='item-stock-distribution'),
    
    path('movements/', StockMovementCreate.as_view(), name='stockmovement-create'),
    path('movement-types/', MovementTypeList.as_view(), name='movementtype-list'),

    path('locations/', LocationList.as_view(), name='location-list'),
    path('locations/<uuid:pk>/', LocationDetailView.as_view(), name='location-detail'),
    
    # Rotas de detalhe 
    path('categories/', CategoryList.as_view(), name='category-list'),
    path('categories/<uuid:pk>/', CategoryDetailView.as_view(), name='category-detail'),

    path('category-groups/', CategoryGroupList.as_view(), name='categorygroup-list'),
    path('category-groups/<uuid:pk>/', CategoryGroupDetailView.as_view(), name='categorygroup-detail'),

    path('suppliers/', SupplierList.as_view(), name='supplier-list'),
    path('suppliers/<uuid:pk>/', SupplierDetailView.as_view(), name='supplier-detail'),


    path('utils/countries/', country_list_view, name='country-list'),

]
