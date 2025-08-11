from django.urls import path
from .views import CustomAuthToken, ItemList, StockMovementCreate, LocationList, MovementTypeList
from django.contrib import admin  # Importação adicionada

urlpatterns = [
    path("items/", ItemList.as_view(), name="item-list"),
    path('login/', CustomAuthToken.as_view(), name='api-login'),
    path('movements/', StockMovementCreate.as_view(), name='stockmovement-create'),
    path('locations/', LocationList.as_view(), name='location-list'),
    path('movement-types/', MovementTypeList.as_view(), name='movementtype-list'),

]
