from django.urls import path
from .views import (
    BranchDetailView, BranchList, CategoryGroupDetailView, CategoryGroupList, CategoryList, FilterOptionsView, ItemDetailView, ItemListCreateView, CustomAuthToken, MovementTypeDetailView, MovementTypeList, SectorDetailView, SectorList, StockMovementCreate, 
    LocationList, StockMovementListView, SupplierList, SystemSettingsView, UserDetailView, user_profile_view, logout_view, ItemStockDistributionView,
    SupplierDetailView, CategoryDetailView, LocationDetailView, country_list_view,
)

urlpatterns = [
    # Rotas de Autenticação
    path('login/', CustomAuthToken.as_view(), name='api-login'),
    path('logout/', logout_view, name='api-logout'),
    path('me/', user_profile_view, name='user-profile'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),

    # Rotas da Aplicação
    path("items/", ItemListCreateView.as_view(), name="item-list"),
    path('items/<uuid:pk>/', ItemDetailView.as_view(), name='item-detail'),
    path('items/<uuid:pk>/stock/', ItemStockDistributionView.as_view(), name='item-stock-distribution'),
    
    path('movements/', StockMovementCreate.as_view(), name='stockmovement-create'),
    path('movements/history/', StockMovementListView.as_view(), name='stockmovement-list'),

    path('movement-types/', MovementTypeList.as_view(), name='movementtype-list-create'),
    path('movement-types/<uuid:pk>/', MovementTypeDetailView.as_view(), name='movementtype-detail'),

    path('locations/', LocationList.as_view(), name='location-list'),
    path('locations/<uuid:pk>/', LocationDetailView.as_view(), name='location-detail'),
    
    # Rotas de detalhe 
    path('categories/', CategoryList.as_view(), name='category-list'),
    path('categories/<uuid:pk>/', CategoryDetailView.as_view(), name='category-detail'),

    path('category-groups/', CategoryGroupList.as_view(), name='categorygroup-list'),
    path('category-groups/<uuid:pk>/', CategoryGroupDetailView.as_view(), name='categorygroup-detail'),

    path('suppliers/', SupplierList.as_view(), name='supplier-list'),
    path('suppliers/<uuid:pk>/', SupplierDetailView.as_view(), name='supplier-detail'),

    path('branches/', BranchList.as_view(), name='branch-list'),
    path('branches/<uuid:pk>/', BranchDetailView.as_view(), name='branch-detail'),

    path('sectors/', SectorList.as_view(), name='sector-list'),
    path('sectors/<uuid:pk>/', SectorDetailView.as_view(), name='sector-detail'),

    path('system-settings/', SystemSettingsView.as_view(), name='system-settings'),

    path('utils/countries/', country_list_view, name='country-list'),
    path('filter-options/', FilterOptionsView.as_view(), name='filter-options'),

]
